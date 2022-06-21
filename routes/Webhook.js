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
        //check if signature is present
        if (req.headers["x-sg-signature"]) {
            let recieverData = await DatastoreClient.ArrLookUp('locations', 'inboundNumbers', '+' + req.body.to);//req.body.to = 17005878164 - number you want to recieve at in the GHL end
            if (recieverData) {
                let rd = recieverData[0];
                //make signature
                const signature = crypto.createHmac('sha256', rd.gatewaykey).update(req.body.messages).digest('base64');
                //check if signature is correct
                if (signature === req.headers["x-sg-signature"]) {
                    let msgs = JSON.parse(req.body.messages);
                    console.log("smsitInbound data: ", msgs);
                    msgs = msgs[0];
                    //for each message in the message list
                    smsitListener.smsitInbound(req, msgs.number, msgs.message, rd);
                } else {
                    console.log("Signature did not matched!");
                }
            } else {
                console.log("No reciever data for this number: ", '+' + req.body.to);
            }
        } else {
            console.log("Signature not found!");
        }
    }
    catch (error) {
        console.log("error at smsit hook listener : ");
        console.log(error.message || "error at inbound ");
    }
});

module.exports = hooks;