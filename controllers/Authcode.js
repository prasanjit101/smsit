/* eslint-disable no-useless-catch */
const axios = require('axios').default;
const DatastoreClient = require('../models/datastore');

const ghl_api_version = process.env.API_VERSION;

//returns ghl oauth2 credentials js object
const GetCred = async (code, grant_type = 'authorization_code', refresh_token = '') => {
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
    return data[locationId] || data.location;
}

//sets the oauth cache and db ,and returns new tokens 
exports.RefreshToken = async (refresh_token) => {
    const response = await GetCred('', 'refresh_token', refresh_token);
    let data = await DatastoreClient.get('locations', response.locationId);
    //set tokens in db 
    if (data) {
        data.access_token = response.access_token;
        data.refresh_token = response.refresh_token;
        await DatastoreClient.save('locations', response.locationId, data);
    }
    return { access_token: response.access_token, refresh_token: response.refresh_token };
}


//exchange auth code for access token
exports.exchangeAuthCode = async (req, res) => {
    try {
        //get GHL credentials first to store and use later
        var credentials = await GetCred(req.body.code);
        //get location details to send to the frontend
        var locationDetails = await GetLocation(credentials.locationId, credentials.access_token);
        //if location id present in db
        let value = await DatastoreClient.get('locations', credentials.locationId);
        if (value) {
            //update it
            value.access_token = credentials.access_token;
            value.refresh_token = credentials.refresh_token;
            value.code = req.body.code;
            await DatastoreClient.save('locations', credentials.locationId, value);
        }
        else {
            //create it
            const obj = {
                locationId: credentials.locationId,
                code: req.body.code,
                access_token: credentials.access_token,
                refresh_token: credentials.refresh_token,
                apikey: '',
                outboundNumber: '',
                inboundNumbers: [],
                name: locationDetails.name,
                businessName: locationDetails.business.name,
            }
            //save in database
            await DatastoreClient.save('locations', credentials.locationId, obj);
        }
        res.status(200).json([credentials.locationId, locationDetails.business.name]);

    } catch (e) {
        try {
            let locationDetails = await DatastoreClient.FilterEquals('locations', 'code', req.body.code);
            locationDetails = locationDetails[0];
            res.status(200).json([locationDetails.locationId, locationDetails.businessName]);
        } catch (e) {
            res.status(403).json({ error: e.message });
        }
    }
}

exports.FormHandler = async (req, res) => {
    try {
        //retrieve form values for the location id
        let val = await DatastoreClient.get('locations', req.body.locationId);
        //update the form values in db
        if (val) {
            val.outboundNumber = req.body.outboundNumber.trim().replace(/\s/g, '');
            const b = [];
            req.body.inboundNumbers.trim().split(',').forEach(element => {
                b.push(element.replace(/\s/g, ''));
            });
            val.inboundNumbers = b;
            val.apikey = req.body.apikey.trim();
            val.gatewaykey = req.body.gatewaykey.trim();

            await DatastoreClient.save('locations', req.body.locationId, val);
            res.status(200).json({ message: 'Your data is updated successfully' });
        } else {
            res.status(401).json({ message: 'error in updating form values: location not found. Retry logging in' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}


exports.SetForm = async (req, res) => {
    try {
        const id = req.body.code;// id =location id
        let data = await DatastoreClient.get('locations', id);
        data = {
            apikey: data.apikey,
            businessName: data.businessName,
            code: data.code,
            gatewaykey: data.gatewaykey,
            inboundNumbers: data.inboundNumbers,
            locationId: data.locationId,
            name: data.name,
            outboundNumber: data.outboundNumber,
        }
        res.status(200).json(data);
    } catch (error) {
        return null;
    }
}