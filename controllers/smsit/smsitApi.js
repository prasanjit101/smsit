const axios = require('axios').default;
const DatastoreClient = require("../../models/datastore");

const is401Error = (error) => {
    if (error.response && error.response.status === 401) {
        return true;
    }
    return false;
}

//send outbound message using sinch api
exports.smsitSend = async (body) => {
    //get sinch service plan id and sinch access token from the  datastore using the location id
    const res = await DatastoreClient.get('locations', body.locationId);
    let response;
    const options = {
        method: 'POST',
        url: 'https://api.jive.com/messaging/v1/messages',
        headers: {
            'Authorization': `Bearer ${res.goto_access_token}`,
            'content-type': 'application/json'
        },
        data: {
            ownerPhoneNumber: body.ownerPhoneNumber,
            contactPhoneNumbers: body.contactPhoneNumbers,
            body: body.body,
        }
    };
    try {
        response = await axios(options);
        return response.data;
    } catch (error) {
        //console.log('error: ', error.response.data);
        if (is401Error(error)) {
            const a = await GotoRefreshToken(body.locationId, res.goto_refresh_token);
            options.headers.Authorization = `Bearer ${a.access_token}`;
            response = await axios(options);
            return response.data;
        }
    }
}
