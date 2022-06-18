const axios = require('axios').default;
const DatastoreClient = require("../models/datastore");

const is401Error = (error) => {
    if (error.response && error.response.status === 401) {
        return true;
    }
    return false;
}

//contolpanel.smsit.ai -> number eg = 917005878164

exports.smsitaddContacts = async (apikey, number) => {
    let options = {
        method: 'POST',
        url: 'https://controlpanel.smsit.ai/apis/addcontact/',
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        params: {
            "apikey": apikey,
            "group": "ghl",
            "number": number,
        }
    };
    let response = await axios(options);
    let data = await response.data;
    return data;
    /* {
    "status":"-7",
    "msg":"Number is already subscribed for home"
    } */
}

exports.smsitGetContacts = async (apikey, number) => {
    let options = {
        method: 'POST',
        url: 'https://controlpanel.smsit.ai/apis/getcontacts/',
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        params: {
            "apikey": apikey,
            "number": number,
            "sortby": "created",
        }
    };
    let response = await axios(options);
    let data = await response.data;
    return data;
    /* { 
    "status":"0",
    "contacts": [
    {
        "id": "23",
        "name": "John Doe",
        "birthday": "1981-06-12",
        "email": "johndoe@smsit.ai",
        "number": "14156007425",
        "group": "Group One",
        "subscriber": "Yes",
        "source": "SMS",
        "carrier":"Verizon",
        "date": "2021-03-12 11:02:04"
        },
    {
        "id": "32",
        "name": "John Smith",
        "birthday": "1978-01-13",
        "email": "",
        "number": "18159819712",
        "group": "Group Two",
        "subscriber": "Yes",
        "source": "Kiosk",
        "carrier":"",
        "date": "2021-12-17 13:12:04"
        }
    ]
} */
}


//send outbound message using sinch api
exports.smsitSend = async (apikey, from, to, message) => {
    let options = {
        method: 'POST',
        url: 'https://controlpanel.smsit.ai/apis/smscontact/',
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        params: {
            "apikey": apikey,
            "from": from,
            "to": to,
            "message": message
        }
    };
    let response = await axios(options);
    let data = await response.data;
    return data;
    /* {
        "status":"-3",
        "msg":"The 'from' number passed in doesn't exist in your account or isn't SMS-enabled."
    } */
}

exports.smsitGetDeliveryStats = async (apikey, number) => {
    let options = {
        method: 'POST',
        url: 'https://controlpanel.smsit.ai/apis/getcontactsmsdeliveryreport/',
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        params: {
            "apikey": apikey,
            "number": number
        }
    };
    let response = await axios(options);
    let data = await response.data;
    return data;
    /* {
    "smsstatus":"delivered",
    "errormsg":""
    } */
}

