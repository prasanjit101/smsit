const axios = require('axios').default;
const { GotoRefreshToken } = require("../goto/gotoauth");
const DatastoreClient = require("../../models/datastore");

const is401Error = (error) => {
    if (error.response && error.response.status === 401) {
        return true;
    }
    return false;
}

//send outbound message using sinch api
exports.GotoSend = async (body) => {
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

exports.GotoCreateHook = async (locationId) => {
    const data = await DatastoreClient.get('locations', locationId);
    const options = {
        method: 'POST',
        url: `https://api.jive.com/notification-channel/v1/channels/${locationId}`,
        headers: {
            Authorization: `Bearer ${data.goto_access_token}`,
            'content-type': 'application/json'
        },
        data: {
            channelType: 'Webhook',
            webhookChannelData: { webhook: { url: process.env.DOMAIN + "/hooks/goto/" + locationId } },
        }
    };
    let response;
    try {
        response = await axios(options);
        return response.data;
    }
    catch (error) {
        if (is401Error(error)) {
            const a = await GotoRefreshToken(locationId, data.goto_refresh_token);
            options.headers.Authorization = `Bearer ${a.access_token}`;
            response = await axios(options);
            return response.data;
        }
        else {
            throw error;
        }
    }
}

const GetSubscriptions = async (locationId, goto_access_token, goto_refresh_token) => {
    const options = {
        method: 'GET',
        url: `https://api.jive.com/messaging/v1/subscriptions`,
        headers: {
            Authorization: `Bearer ${goto_access_token}`
        },
    };
    let response;
    try {
        response = await axios(options);
        return response.data.items;
    }
    catch (error) {
        if (is401Error(error)) {
            const a = await GotoRefreshToken(locationId, goto_refresh_token);
            options.headers.Authorization = `Bearer ${a.access_token}`;
            response = await axios(options);
            return response.data.items;
        }
        else {
            console.log('error at get subscriptions : ', error.response.data);
        }
    }
}

const deleteSubscription = async (locationId, subscriptionId, goto_access_token, goto_refresh_token) => {
    const options = {
        method: 'DELETE',
        url: `https://api.jive.com/messaging/v1/subscriptions/${subscriptionId}`,
        headers: {
            Authorization: `Bearer ${goto_access_token}`,
        },
    };
    let response;
    try {
        response = await axios(options);
        return response.data;
    }
    catch (error) {
        if (is401Error(error)) {
            const a = await GotoRefreshToken(locationId, goto_refresh_token);
            options.headers.Authorization = `Bearer ${a.access_token}`;
            response = await axios(options);
            return response.data;
        }
        else {
            console.log('error at delete subscription : ', error.response.data);
        }
    }
}

const retrySubscription = async (locationId, channelId, number, goto_access_token, goto_refresh_token) => {
    const options = {
        method: 'POST',
        url: 'https://api.jive.com/messaging/v1/subscriptions',
        headers: {
            Authorization: `Bearer ${goto_access_token}`,
            'content-type': 'application/json'
        },
        data: JSON.stringify({
            ownerPhoneNumber: number,
            eventTypes: [
                'INCOMING_MESSAGE',
                'OUTGOING_MESSAGE'
            ],
            channelId: channelId
        })
    };
    let response;
    try {
        response = await axios(options);
        return response.data;
    } catch (error) {
        if (is401Error(error)) {
            const a = await GotoRefreshToken(locationId, goto_refresh_token);
            options.headers.Authorization = `Bearer ${a.access_token}`;
            response = await axios(options);
            return response.data;
        }
        else {
            console.log('error at retry subscription : ', error.response.data);
        }
    }
}

//channelId, locationId, number, optional : goto accesss token
exports.GotoSubscribe = async (channelId, locationId) => {
    const d = await DatastoreClient.get('locations', locationId);
    const options = {
        method: 'POST',
        url: 'https://api.jive.com/messaging/v1/subscriptions',
        headers: {
            Authorization: `Bearer ${d.goto_access_token}`,
            'content-type': 'application/json'
        },
        data: JSON.stringify({
            ownerPhoneNumber: d.number,
            eventTypes: [
                'INCOMING_MESSAGE',
                'OUTGOING_MESSAGE'
            ],
            channelId: channelId
        })
    };
    let response;
    try {
        response = await axios(options);
        d.subscriptionId = response.data.id;
        d.channelId = channelId;
        await DatastoreClient.save('locations', locationId, d);
        return response.data;
    }
    catch (error) {
        console.log('error at goto subscribe : ', error.response.data);
        if (error.response.status === 401 || error.errorCode === "AUTHN_INVALID_TOKEN" || error.errorCode === "AUTHN_EXPIRED_TOKEN") {
            const a = await GotoRefreshToken(locationId, d.goto_refresh_token);
            options.headers.Authorization = `Bearer ${a.access_token}`;
            response = await axios(options);
            return response.data;
        }
        else if (error.response.status === 409 || error.errorCode === "CONFLICT") {
            //if message subscription already exists, delete it and retry
            d.channelId = channelId;
            if (!d.subscriptionId) {
                //if subscription id not present in the datastore, get it using the GOTO api and filter our subscription and use the id to delete the subscription 
                let subscriptions = await GetSubscriptions(locationId, d.goto_access_token, d.goto_refresh_token);
                subscriptions = subscription.items;
                const subscription = subscriptions.find(s => s.channelId === channelId);
                d.subscriptionId = subscription.id;
                await DatastoreClient.save('locations', locationId, d);
                await deleteSubscription(locationId, subscription.id, d.goto_access_token, d.goto_refresh_token);
            }
            else {
                await deleteSubscription(locationId, d.subscriptionId, d.goto_access_token, d.goto_refresh_token);
            }
            await retrySubscription(locationId, channelId, d.number, d.goto_access_token, d.goto_refresh_token);
        }
    }
}      