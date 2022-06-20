const { UpdateMessageStatus } = require("./ghlApi");
const { OutboundBlockCache } = require("../services/Cache");
const DatastoreClient = require("../models/datastore");
const { smsitGetContacts, smsitaddContacts, smsitGetDeliveryStats, smsitSend } = require("./smsitApi");
const GhlWebhook = async (req, res) => {
    res.sendStatus(200);
    try {
        if (req.body.type === 'ContactDelete') {
            //delete contact entity from DB
            const t = await DatastoreClient.FilterEquals('conversations', 'contactId', req.body.id);
            const entry = t.filter(e => e.locationId === req.body.locationId);
            if (entry) {
                await DatastoreClient.delete('conversations', entry.conversationId);
            }
        }
    } catch (error) {
        console.log("error at ghlwebhook: ", error.message);
    }
}

const send = async (req, phoneNumber, apikey) => {
    try {
        let d = await DatastoreClient.get('locations', req.body.locationId);

        if (d) {
            process.nextTick(async () => {
                try {
                    const from = d.outboundNumber.replace(/[^0-9]/g, '');
                    let sentresult = await smsitSend(apikey, from, phoneNumber, req.body.message);
                    console.log("Result of message sent through smsit API : ", sentresult.msg);
                    //update delivery status
                    let d_report = await smsitGetDeliveryStats(apikey, phoneNumber);
                    if (d_report === "delivered") {
                        UpdateMessageStatus(req.body.messageId, req.body.locationId, 'delivered');
                    } else {
                        UpdateMessageStatus(req.body.messageId, req.body.locationId, 'failed');
                        console.log("error by smsit: ", d_report.errormsg);
                    }
                } catch (error) {
                    console.log('error at smsitsend: ', error.message);
                }
            });
        }
    } catch (error) {
        console.log("error at send to smsit :", error.message);
    }
}

const GhlConversationWebhook = async (req, res) => {
    res.sendStatus(200);
    if (req.body.type === "SMS") {
        try {
            let phoneNumber = req.body.phone;
            phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
            //get credentials from 
            let apikey = await DatastoreClient.get('locations', req.body.locationId);
            apikey = apikey.apikey;//apikey  = apikey of smsit
            var val = await DatastoreClient.get('conversations', req.body.conversationId);
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
            //get the contact from smsit account
            let contact = await smsitGetContacts(apikey, phoneNumber);
            if (contact.status === "0") {
                //contact exists
                setTimeout(() => {
                    if (!OutboundBlockCache.has(req.body.messageId)) {
                        send(req, phoneNumber, apikey);
                    } else {
                        console.log("Outbound blocked for message ID:", req.body.messageId);
                        OutboundBlockCache.del(req.body.messageId);
                    }
                }, 2000);
            } else if (contact.status === "-7") {
                //contact does not exist -> add contact in smsit
                let addContact = await smsitaddContacts(apikey, phoneNumber);
                addContact = addContact[0];
                if (addContact.status === "0") {
                    //contact added
                    console.log("SMSIT - > contact added in group \'ghl\'");
                    setTimeout(() => {
                        if (!OutboundBlockCache.has(req.body.messageId)) {
                            send(req, phoneNumber, apikey);
                        }
                        else {
                            console.log("Outbound blocked for message ID:", req.body.messageId);
                            OutboundBlockCache.del(req.body.messageId);
                        }
                    }, 2000);
                }
                else {
                    console.log("Error in contact create : ", addContact.msg);
                    UpdateMessageStatus(req.body.messageId, req.body.locationId, 'failed');
                }
            } else {
                console.log("error at smsitGetContacts: ", contact.msg);
                UpdateMessageStatus(req.body.messageId, req.body.locationId, 'failed');
            }

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