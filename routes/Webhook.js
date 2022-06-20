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
        if (req.headers["HTTP_X_SG_SIGNATURE"]) {
            let recieverData = await DatastoreClient.ArrLookUp('locations', 'inboundNumbers', '+' + req.params.number);//req.params.number = 17005878164 - number you want to recieve at in the GHL end
            if (recieverData) {
                let rd = recieverData[0];
                gatewaykey = gatewaykey.gatewaykey;
                //make signature
                const signature = crypto.createHmac('sha256', rd.gatewaykey).update(req.body.messages).digest('base64');
                //check if signature is correct
                if (signature === req.headers["HTTP_X_SG_SIGNATURE"]) {
                    let msgs = req.body.messages;
                    console.log("smsitInbound data: ", msgs);
                    //for each message in the message list
                    msgs.forEach(message => {
                        //let number = message.number; //+1679588986
                        //let msg = message.message;
                        smsitListener.smsitInbound(req, message.number, message.message, rd);
                    });
                } else {
                    res.sendStatus(401);
                    console.log("Signature don't match!");
                }
            } else {
                console.log("No reciever data for this number: ", '+' + req.params.number);
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