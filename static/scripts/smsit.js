const SERVER_URL = `${window.location.origin}`;

const getcode = () => {
    try {
        let code = window.location.search.split("=");
        return code[1];
    } catch (e) {
        //get element by id
        document.getElementById('error').innerHTML = `<div class="error"><p>Error! Please SignIn with Goto</p></div>`;
        console.log(e);
    }
}

const getcred = async (server_url, body) => {
    let res = await fetch(server_url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(body)
    });
    let data = await res.json();
    return data;
}


const GetForm = async (locationId) => {
    try {
        const res = await fetch(SERVER_URL + '/get-form', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code: locationId })
        });
        const formData = await res.json();
        if (formData) {
            document.querySelector('input[name="number"]').value = formData.number;
        }
    } catch (e) {
        document.querySelector('input[name="number"]').value = '';
    }
}

const TriggerTask = async (locationId) => {
    try {
        let res = await fetch(SERVER_URL + '/trigger-channel', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                locationId
            })
        });
    } catch (e) {
        console.log('Error in triggering task in server', e.response.message);
    }
}

//exec part
let authcode = getcode();
if (authcode) {
    //pass authorisation code to backend and get access token, credentials...
    const obj = {
        code: authcode,
        locationId: localStorage.getItem('ghl_location_id')
    }
    getcred(SERVER_URL + '/goto-code', obj)
        .then(data => {
            showSnackbar("GOTO CONNECTED SUCCESSFULLY !");
            document.getElementById('message').innerHTML = `
            <p>[location ID] ${data.locationId}</p>
            <p>[Name] ${data.businessName}</p>`;
            GetForm(data.locationId);
        }).catch(err => {
            console.log(err);
            document.getElementById('error').innerHTML = `<p>Failed to get credentials. Try login again</p>`;
        });
}

function showSnackbar(message) {
    let x = document.getElementById("snackbar");
    x.innerHTML = message;
    x.className = "show";
    setTimeout(function () { x.className = x.className.replace("show", ""); }, 2000);
}


document.getElementById('goto').addEventListener("submit", async function (e) {
    e.preventDefault();
    let url = `${window.location.origin}/form`;
    const locationId = localStorage.getItem('ghl_location_id');
    await fetch(url, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        method: "POST",
        body: new URLSearchParams({
            number: document.querySelector('input[name="number"]').value.trim().replace(/\s/g, ''),
            locationId: locationId
        })
    }).then(
        response => response.json()
    ).then(data => showSnackbar(data.message)).catch(e => showSnackbar('error encountered :', e.message));
    await TriggerTask(locationId);
});