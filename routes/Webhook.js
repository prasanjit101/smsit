/* eslint-disable no-useless-catch */
const hooks = require('express').Router();
const GhlListener = require('../controllers/Outbound');
const GotoListener = require("../controllers/gotohook");
const DatastoreClient = require("../models/datastore");

hooks.route('/').post(GhlListener.GhlWebhook);
hooks.route('/ghl/conversation').post(GhlListener.GhlConversationWebhook);


hooks.route('/goto/:locationId').post(async (req, res) => {
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
            GotoListener.GotoInbound(req, x, senderData);
        } else if (req.body.type === "message" && req.body.content.direction === "OUT") {
            GotoListener.GotoOutbound(req, x, senderData);
        }
    }
    catch (error) {
        console.log("error at goto hook listener : ", error.message);
    }

});

module.exports = hooks;