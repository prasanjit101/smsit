const { OutboundBlockCache } = require("../services/Cache");
const { GhlSend, GhlRecieve, CreateContact } = require("./ghlApi");
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


const smsitInbound = async (req, number, msg, recieverData) => {
    //assuming only every location id has unique inbound numbers
    console.log("recieverData: ", recieverData);
    if (recieverData) {
        //get conversation fields
        const l = await DatastoreClient.FilterEquals('conversations', 'phone', number);
        const senderData = l.find(conversation => conversation.locationId === recieverData.locationId);//if the conversation belongs to the location iD
        console.log("senderData: ", senderData);
        //contact id present in db
        if (senderData) {
            //make inbound to ghl
            process.nextTick(async () => {
                try {
                    await GhlRecieve(
                        msg,
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
            const contact = await getContact(recieverData.locationId, number);
            console.log("contact: ", contact);
            if (contact) {
                //send a message to the contact
                const sent = await GhlSend(contact, recieverData.locationId, ".");
                console.log("Default ghl send helper data for inbound : ", sent);
                //insert the message into outboundBlock cache
                process.nextTick(async () => {
                    await OutboundBlockCache.set(sent.messageId, 1);
                });
                //save the details in datastore
                await DatastoreClient.save('conversations', sent.conversationId, {
                    conversationId: sent.conversationId,
                    contactId: contact,
                    phone: number,
                    locationId: recieverData.locationId
                });
                //make inbound to ghl
                process.nextTick(async () => {
                    try {
                        await GhlRecieve(
                            msg,
                            sent.conversationId,
                            recieverData.locationId
                        );
                        console.log("inbound recieved at ghl");
                    } catch (error) {
                        console.log('error at fresh inbound process tick : ', error.message);
                    }
                });
            } else {
                console.log("contact not found and cannot be created");
            }
        }
    }
}
module.exports = { smsitInbound };