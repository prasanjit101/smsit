/* eslint-disable no-useless-catch */
const hooks = require('express').Router();
const GhlListener = require('../controllers/Outbound');
const smsitListener = require("../controllers/smsithook");
const DatastoreClient = require("../models/datastore");

hooks.route('/').post(GhlListener.GhlWebhook);
hooks.route('/ghl/conversation').post(GhlListener.GhlConversationWebhook);


hooks.route('/smsit/:locationId').post(async (req, res) => {
    res.sendStatus(200);
    try {
        var x, senderData;
        if (req.body.type === "message" && req.body.content.direction === "IN") {
            x = await DatastoreClient.get('locations', req.params.locationId);
            //get conversations where phone number is equal to contactphonenumbers
            const l = await DatastoreClient.FilterEquals('conversations', 'phone', req.body.content.contactPhoneNumbers[0]);
            //filter the conversation with the required locationId
            const m = l.filter(conversation => conversation.locationId === x.locationId);
            senderData = m[0];
            smsitListener.smsitInbound(req, x, senderData);
        } else if (req.body.type === "message" && req.body.content.direction === "OUT") {
            smsitListener.smsitOutbound(req, x, senderData);
        }
    }
    catch (error) {
        console.log("error at smsit hook listener : ", error.message);
    }

});

module.exports = hooks;