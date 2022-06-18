/* eslint-disable no-useless-catch */
const hooks = require('express').Router();
const GhlListener = require('../controllers/Outbound');
const DatastoreClient = require("../models/datastore");
const crypto = require('crypto');
const smsitListener = require('../controllers/Inbound');


hooks.route('/').post(GhlListener.GhlWebhook);
hooks.route('/ghl/conversation').post(GhlListener.GhlConversationWebhook);


hooks.route('/smsit/:number').post(async (req, res) => {
    res.sendStatus(200);
    console.log("--smsitInbound--");
    try {
        if (req.headers["HTTP_X_SG_SIGNATURE"]) {
            const signature = crypto.createHmac('sha256', process.env.SMSIT_API_KEY).update(req.body.messages).digest('base64');
            if (signature === req.headers["HTTP_X_SG_SIGNATURE"]) {
                let msgs = req.body.messages;
                console.log("smsitInbound data: ", msgs);
                let mynumber = req.params.number;
                msgs.forEach(message => {
                    let number = message.number;
                    let msg = message.message;
                    /* //get conversations where phone number is equal to contactphonenumbers
                    const l = DatastoreClient.FilterEquals('conversations', 'phone', number);
                    //filter the conversation with the required locationId
                    const m = l.filter(conversation => conversation.locationId === message.locationId);
                    const senderData = m[0]; */
                    smsitListener.smsitInbound(req, number, mynumber, msg);
                });
            } else {
                res.sendStatus(401);
                console.log("Signature don't match!");
            }
        } else {
            res.sendStatus(400);
            console.log("Signature not found!");
        }
    }
    catch (error) {
        console.log("error at smsit hook listener : ");
        try {
            error.forEach(e => console.log(e.message));
        } finally {
            console.log(error.message || " ");
        }
    }
});

module.exports = hooks;