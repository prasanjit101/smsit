/* eslint-disable no-useless-catch */
const axios = require('axios').default;
const DatastoreClient = require("../models/datastore");
const { GhlRefreshToken } = require("../controllers/ghl/ghlauth");

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
        let d = await DatastoreClient.get('locations', locationId);
        if (d) {
            tokens = {
                ghl_access_token: d.ghl_access_token,
                ghl_refresh_token: d.ghl_refresh_token
            }
            config.headers.Authorization = `Bearer ${d.ghl_access_token}`;
            const response = await axios(config);
            return response.data;
        }
    } catch (error) {
        if (is401Error(error)) {
            const a = await GhlRefreshToken(tokens.ghl_refresh_token);
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
