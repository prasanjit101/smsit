const SERVER_URL = `${window.location.origin}`;

// for ghlInteg.html
const ghl_clientID = "62aa48294e0a8e2b8d33d6e1-l4g2u7lp";
const ghl_redirectUri = SERVER_URL + "/redirect";

const ghl_template = `<a class="btn ripple" href="https://marketplace.gohighlevel.com/oauth/chooselocation?response_type=code&redirect_uri=${ghl_redirectUri}&client_id=${ghl_clientID}&scope=conversations/message.readonly conversations/message.write locations.readonly contacts.readonly contacts.write">
connect with GoHighLevel</a>`

document.getElementById('ghl').innerHTML = ghl_template;


