if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
module.exports = {
    port: process.env.PORT,
    environment: process.env.NODE_ENV,
    domain: process.env.DOMAIN,
    _clientid: process.env.CLIENT_ID,
    _clientSecret: process.env.CLIENT_SECRET,
    _sinchService: process.env.SERVICE_PLAN_ID,
    _sinchToken: process.env.SINCH_TOKEN,
}

