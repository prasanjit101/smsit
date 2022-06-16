const { ApiClientwToken } = require("../../services/ApiClient");
const ghl_api_version = process.env.API_VERSION;
const conversationProviderId = process.env.CONVERSATION_PROVIDER_ID;

//send outbound message from ghl
exports.GhlSend = async (contactId, locationId, message) => {
    const data = await ApiClientwToken({
        method: 'POST',
        url: 'https://api.msgsndr.com/conversations/messages',
        headers: { 'Content-Type': 'application/json', Version: ghl_api_version },
        data: {
            type: 'SMS',
            contactId: contactId,
            message: message,
        }
    }, locationId);
    return data;//convo id,message id
}

//add inbound message using api |  -> (token,version,message,convoid,locationid)
exports.GhlRecieve = async (message, conversationId, locationId) => {
    const data = await ApiClientwToken({
        method: 'POST',
        url: 'https://api.msgsndr.com/conversations/messages/inbound',
        headers: { 'Content-Type': 'application/json', Version: ghl_api_version },
        data: {
            type: 'SMS',
            message: message,
            conversationId: conversationId,
            conversationProviderId: conversationProviderId,
        }
    }, locationId);
    return data;//convo id,message id
}


//update message status
exports.UpdateMessageStatus = async (messageId, locationId, status) => {
    try {
        await ApiClientwToken({
            method: 'PUT',
            url: `https://api.msgsndr.com/conversations/messages/${messageId}/status`,
            headers: { Version: ghl_api_version },
            data: {
                status: status,
                error: {
                    code: '400',
                    type: 'saas',
                    message: 'outbound error'
                }
            }
        }, locationId);
    } catch (error) {
        console.log('Update message status error');
    }
}

//create contact
exports.CreateContact = async (locationId, phone) => {
    try {
        const data = await ApiClientwToken({
            method: 'POST',
            url: `https://api.msgsndr.com/contacts/`,
            headers: { Version: ghl_api_version },
            data: {
                locationId: locationId,
                phone: phone
            }
        }, locationId);
        return data;
    } catch (error) {
        return null;
    }
}