/* eslint-disable no-useless-catch */
const axios = require('axios').default;
const DatastoreClient = require('../../models/datastore');
const gotoAuthHeader = process.env.GOTO_AUTH;

//returns ghl oauth2 credentials js object

const GotoCode = async (code) => {
    const redirect_uri = process.env.REDIRECT_URI;
    const options = {
        method: 'POST',
        url: 'https://authentication.logmeininc.com/oauth/token',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${gotoAuthHeader}`,
            Accept: 'application/json',
        },
        data: `redirect_uri=${redirect_uri}&grant_type=authorization_code&code=${code}`
    };

    let response = await axios(options);
    return response.data;
}

exports.GotoRefreshToken = async (locationId, refresh_token) => {
    try {
        const options = {
            method: 'POST',
            url: 'https://api.getgo.com/oauth/v2/token',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': `Basic ${gotoAuthHeader}`,
            },
            data: `grant_type=refresh_token&refresh_token=${refresh_token} `
        };

        let response = await axios(options);
        let data = await DatastoreClient.get('locations', locationId);
        //set tokens in db 
        if (data && response) {
            data.goto_access_token = response.data.access_token;
            data.goto_refresh_token = response.data.refresh_token;
            await DatastoreClient.save('locations', locationId, data);
        }
        return { access_token: response.data.access_token, refresh_token: response.data.refresh_token };
    } catch (error) {
        console.log('Error in Goto refresh token :', error.response.data);
    }
}

exports.GotoAuth = async (req, res) => {
    const locationId = Buffer.from(req.body.locationId, 'base64').toString('ascii').slice(0, -10);
    try {
        let credentials = await GotoCode(req.body.code);
        //if location id present in db
        let value = await DatastoreClient.get('locations', locationId);
        if (value && credentials) {
            //update it
            value.goto_access_token = credentials.access_token;
            value.goto_refresh_token = credentials.refresh_token;
            value.goto_code = req.body.code;
            value.owner_mail = credentials.principal;
            await DatastoreClient.save('locations', locationId, value);
        }
        res.status(200).json({ locationId: value.locationId, name: value.name, businessName: value.businessName, mail: credentials.principal });

    } catch (e) {
        try {
            const locationDetails = await DatastoreClient.get('locations', locationId);
            if (locationDetails) {
                //update it
                locationDetails.goto_code = req.body.code;
                await DatastoreClient.save('locations', locationId, locationDetails);
            }
            res.status(200).json({ locationId: locationId, name: locationDetails.name, businessName: locationDetails.businessName, mail: locationDetails.owner_mail });
        } catch (error) {
            res.status(403).json({ error: "Error encountered. Retry logging in !" });
        }
    }
}


exports.FormHandler = async (req, res) => {
    const locationId = Buffer.from(req.body.locationId, 'base64').toString('ascii').slice(0, -10);
    try {
        //retrieve form values for the location id
        let val = await DatastoreClient.get('locations', locationId);
        //update the form values in db
        if (val) {
            val.number = req.body.number;
            await DatastoreClient.save('locations', locationId, val);
            res.status(200).json({ message: 'success !' });
        } else {
            res.status(401).json({ message: 'error in updating form values: location not found. Retry logging in' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Error ! Retry logging in' });
    }
}

exports.GetForm = async (req, res) => {
    try {
        const data = await DatastoreClient.get('locations', req.body.code);
        res.status(200).json(data);
    } catch (error) {
        return null;
    }
}
