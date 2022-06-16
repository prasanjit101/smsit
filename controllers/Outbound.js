const { UpdateMessageStatus } = require("./ghl/ghlApi");
const { GotoSend } = require("./goto/gotoApi");
const { OutboundBlockCache } = require("../services/Cache");
const DatastoreClient = require("../models/datastore");

const GhlWebhook = async (req, res) => {
    try {
        if (req.body.type === 'ContactDelete') {
            //delete contact entity from DB
            const t = await DatastoreClient.FilterEquals('conversations', 'contactId', req.body.id);
            const entry = t[0];
            if (entry) {
                await DatastoreClient.delete('conversations', entry.conversationId);
            }
        }
        res.status(200).send("ok");
    } catch (error) {
        res.sendStatus(400);
    }
}

const send = async (req) => {
    try {
        let d = await DatastoreClient.get('locations', req.body.locationId);
        if (d) {
            process.nextTick(async () => {
                try {
                    await GotoSend({
                        locationId: req.body.locationId,
                        ownerPhoneNumber: d.number,
                        contactPhoneNumbers: [req.body.phone],
                        body: req.body.message,
                        //attachments: req.body.attachments
                    });
                } catch (error) {
                    console.log('error at gotosend: ', error.message);
                }
            });
            //update delivery status
            UpdateMessageStatus(req.body.messageId, req.body.locationId, 'delivered');
        }
    } catch (error) {
        console.log("error at send to goto :", error.message);
    }
}

const GhlConversationWebhook = async (req, res) => {
    if (req.body.type === "SMS") {
        try {
            OutboundBlockCache.set(req.body.messageId, 0);
            let val = await DatastoreClient.get('conversations', req.body.conversationId);
            if (val) {
                //if contact is present in our db  
                if (val.phone !== req.body.phone) {
                    //if the contacts number has updated then update in db
                    val.phone = req.body.phone;
                    await DatastoreClient.save('conversations', req.body.conversationId, val);
                }
            } else {
                //we store the oldest contact id that was registered in our app
                if (!process.env.OLDEST_CONTACT_ID) {
                    process.env.OLDEST_CONTACT_ID = req.body.contactId;
                }
                //if contact not in db then store it in db
                await DatastoreClient.save('conversations', req.body.conversationId, {
                    conversationId: req.body.conversationId,
                    contactId: req.body.contactId,
                    phone: req.body.phone,
                    locationId: req.body.locationId
                });
            }
            setTimeout(() => {
                const block = OutboundBlockCache.get(req.body.messageId);
                if (!block) {
                    await send(req);
                } else {
                    console.log("Outbound blocked for message ID:", req.body.messageId);
                    OutboundBlockCache.del(req.body.messageId);
                }
            }, 4000);
        } catch (error) {
            try {
                UpdateMessageStatus(req.body.messageId, req.body.locationId, 'failed');
                console.log("error at ghlconversationwebhook: ", error.message);
            } catch (error) {
                console.log("error at ghlconversationwebhook and update ghl message status: ", error.message);
            }
        }
    }
}
module.exports = { GhlWebhook, GhlConversationWebhook }