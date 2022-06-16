const axios = require('axios').default;
const DatastoreClient = require('../../models/datastore');

const ghl_api_version = process.env.API_VERSION;

const GhlCode = async (code, grant_type = 'authorization_code', refresh_token = '') => {
    let config = {
        client_id: process.env.GHL_CLIENT_ID,
        client_secret: process.env.GHL_CLIENT_SECRET,
        grant_type: grant_type,
        code: code,
        refresh_token: refresh_token
    };

    let options = {
        method: 'POST',
        url: 'https://api.msgsndr.com/oauth/token',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        data: new URLSearchParams(config)
    };

    let response = await axios(options);
    return response.data;
}

//returns location details of the ghl subaccount
const GetLocation = async (locationId, access_token) => {
    let options = {
        method: 'GET',
        url: `https://api.msgsndr.com/locations/${locationId}`,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access_token}`,
            'Version': `${ghl_api_version}`
        }
    };
    let response = await axios(options);
    let data = await response.data;
    return data;
}

const encode = (locationId) => {
    //base64 encode locationID
    let encoded = Buffer.from(locationId + "ghlConnect").toString('base64');
    return encoded;
}

exports.GhlRefreshToken = async (refresh_token) => {
    const response = await GhlCode('', 'refresh_token', refresh_token);
    let data = await DatastoreClient.get('locations', response.locationId);
    //update tokens in db 
    if (data) {
        data.ghl_access_token = response.access_token;
        data.ghl_refresh_token = response.refresh_token;
        await DatastoreClient.save('locations', response.locationId, data);
    }
    return { access_token: response.access_token, refresh_token: response.refresh_token };
}


//exchange auth code for access token
exports.GhlAuthCode = async (req, res) => {
    try {
        let credentials = await GhlCode(req.body.code);
        let locationDetails = await GetLocation(credentials.locationId, credentials.access_token);
        //if location id present in db
        let value = await DatastoreClient.get('locations', credentials.locationId);
        if (value) {
            //update it
            value.ghl_access_token = credentials.access_token;
            value.ghl_refresh_token = credentials.refresh_token;
            value.code = req.body.code;
            await DatastoreClient.save('locations', credentials.locationId, value);
        }
        else {
            //else create it
            const obj = {
                locationId: credentials.locationId,
                number: '',
                name: locationDetails.location.name,
                businessName: locationDetails.location.business.name,
                owner_mail: '',
                ghl_access_token: credentials.access_token,
                ghl_refresh_token: credentials.refresh_token,
                goto_access_token: '',
                goto_refresh_token: '',
                code: req.body.code,
                goto_code: '',
                subscriptionId: '',
                channelId: ''
            }
            //save in database
            await DatastoreClient.save('locations', credentials.locationId, obj);
        }
        res.status(200).json([encode(credentials.locationId), locationDetails]);

    } catch (e) {
        try {
            const t = await DatastoreClient.FilterEquals('locations', 'code', req.body.code);
            const locationDetails = t[0];
            res.status(200).json([encode(locationDetails.locationId), {
                location: {
                    id: locationDetails.locationId,
                    name: locationDetails.name,
                    business: {
                        name: locationDetails.businessName
                    }
                }
            }]);
        } catch (error) {
            res.status(403).json({ error: "Error encountered. Retry logging in !" });
        }
    }
}


