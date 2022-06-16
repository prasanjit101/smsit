const { OutboundBlockCache } = require("../services/Cache");
const { GhlRecieve, GhlSend, CreateContact } = require("./ghl/ghlApi");
const { ApiClientwToken } = require("../services/ApiClient");
const DatastoreClient = require("../models/datastore");


const getContact = async (locationId, phoneNumber) => {
    try {
        const newContact = await CreateContact(locationId, phoneNumber);
        return newContact.contact.id;
    } catch (error) {
        const options = {
            method: 'GET',
            url: 'https://api.msgsndr.com/contacts/',
            params: { locationId: locationId, limit: '40' },
            headers: { 'Content-Type': 'application/json', Authorization: '', Version: process.env.API_VERSION }
        };
        if (process.env.OLDEST_CONTACT_ID) {
            options.params.startAfterId = process.env.OLDEST_CONTACT_ID;
        }
        const data = await ApiClientwToken(options, locationId);
        const contact = await data.contacts.filter(contact => contact.phone === phoneNumber);
        return contact[0].id;
    }
}


const GotoInbound = async (req, recieverData = null, senderData = null) => {
    console.log("--GotoInbound--");
    console.log("GotoInbound data: ", req.body);
    if (!recieverData) {
        recieverData = await DatastoreClient.get('locations', req.params.locationId);
    }
    console.log("recieverData: ", recieverData);
    if (recieverData) {
        if (!senderData) {
            const l = await DatastoreClient.FilterEquals('conversations', 'phone', req.body.content.contactPhoneNumbers[0]);
            const m = l.filter(conversation => conversation.locationId === recieverData.locationId);
            senderData = m[0];
        }
        //contact id present in db
        console.log("senderData: ", senderData);
        if (senderData) {
            //make inbound to ghl
            process.nextTick(async () => {
                try {
                    await GhlRecieve(
                        req.body.content.body,
                        senderData.conversationId,
                        recieverData.locationId
                    );
                } catch (error) {
                    console.log('error at existing inbound process tick : ', error.message);
                }
            });
        }
        //contact id not present in db
        else {
            //create/get contact
            const contact = await getContact(recieverData.locationId, req.body.content.contactPhoneNumbers[0]);
            console.log("contact: ", contact);
            if (contact) {
                //send a message to the contact
                const sent = await GhlSend(contact, recieverData.locationId, ".");
                //insert the message into outboundBlock cache
                process.nextTick(async () => {
                    await OutboundBlockCache.set(sent.messageId, 1);
                });
                //save the details in datastore
                await DatastoreClient.save('conversations', sent.conversationId, {
                    conversationId: sent.conversationId,
                    contactId: contact,
                    phone: req.body.content.contactPhoneNumbers[0],
                    locationId: recieverData.locationId
                });
                //make inbound to ghl
                process.nextTick(async () => {
                    try {
                        await GhlRecieve(
                            req.body.content.body,
                            sent.conversationId,
                            recieverData.locationId
                        );
                        console.log("inbound recieved at ghl");
                    } catch (error) {
                        console.log('error at fresh inbound process tick : ', error.message);
                    }
                });
            }
        }
    }
}

const GotoOutbound = async (req, sender = null, reciever = null) => {
    console.log("--GOTO OUTBOUND--");
    // here recieverData  = the contact we are sending the message to , SenderData = the goto account sending the message 
    if (!sender) {
        sender = await DatastoreClient.get('locations', req.params.locationId);
    }
    console.log("recieverData: ", sender);
    if (sender) {
        if (!reciever) {
            reciever = await DatastoreClient.FilterEquals('conversations', 'phone', req.body.content.contactPhoneNumbers[0]);
            //filter the conversation with the required locationId
            const m = l.filter(conversation => conversation.locationId === x.locationId);
            reciever = m[0];
        }
        //contact id present in db
        if (reciever) {
            //send a message to the contact
            const sent = await GhlSend(reciever.contactId, sender.locationId, req.body.content.body);
            process.nextTick(() => {
                OutboundBlockCache.set(sent.messageId, 1);
            });
            //insert the message into outboundBlock cache

        }
        //contact id not present in db
        else {
            //create/get contact id
            const contact = await getContact(sender.locationId, req.body.content.contactPhoneNumbers[0]);
            if (contact) {
                //send a message to the contact
                const sent = await GhlSend(contact, sender.locationId, req.body.content.body);
                //insert the message into outboundBlock cache
                process.nextTick(() => {
                    OutboundBlockCache.set(sent.messageId, 1);
                });
                //save the details in datastore
                await DatastoreClient.save('conversations', sent.conversationId, {
                    conversationId: sent.conversationId,
                    contactId: contact,
                    phone: req.body.content.contactPhoneNumbers[0],
                    locationId: sender.locationId
                });
            }
        }
    }
}

module.exports = { GotoInbound, GotoOutbound };