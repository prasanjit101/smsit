/* eslint-disable no-useless-catch */
const axios = require('axios').default;
const { RefreshToken } = require('../controllers/Authcode');
const DatastoreClient = require("../models/datastore");

const is401Error = (error) => {
    if (error.response && error.response.status === 401) {
        return true;
    }
    return false;
}

//tokens is a object with access_token and refresh_token
//function makes request with tokens, if fails-> it will ask for refreshed tokens and then make a call again 
exports.ApiClientwToken = async (config, locationId, tokens = null) => {
    try {
        if (tokens) {
            config.headers.Authorization = `Bearer ${tokens.access_token}`;
        } else {
            let d = await DatastoreClient.get('locations', locationId);
            if (d) {
                tokens = {
                    access_token: d.access_token,
                    refresh_token: d.refresh_token
                }
                config.headers.Authorization = `Bearer ${d.access_token}`;
            }
            const response = await axios(config);
            return response.data;
        }
    } catch (error) {
        if (is401Error(error)) {
            const a = await RefreshToken(tokens.refresh_token);
            config.headers.Authorization = `Bearer ${a.access_token}`;
            const response = await axios(config);
            return response.data;
        }
        else {
            throw error;
        }
    }
}

exports.ApiClient = async (config) => {
    let response = await axios(config);
    return response.data;
}
