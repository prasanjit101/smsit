const SERVER_URL = `${window.location.origin}`;

const getcode = () => {
    try {
        let code = window.location.search.split("=");
        if (code[1] == undefined) throw new Error("No code found");
        return code[1];
    } catch (e) {
        //get element by id
        alert("Error! Please SignIn with GHL again");
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
    getcred(SERVER_URL + '/smsit-code', authcode)
        .then(data => {
            showSnackbar("SMSIT CONNECTED SUCCESSFULLY !");
            document.getElementById('message').innerHTML = `
            <p>[location ID] ${data.locationId}</p>
            <p>[Name] ${data.businessName}</p>`;
            GetForm(data.locationId);
        }).catch(err => {
            console.log(err);
            document.getElementById('message').innerHTML = `<div class="error"><p>Failed to get credentials. Try login again</p></div>`;
        });
}


document.getElementById('smsit').addEventListener("submit", async function (e) {
    e.preventDefault();
    let url = `${window.location.origin}/form`;
    await fetch(url, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        method: "POST",
        body: new URLSearchParams({
            locationId: document.querySelector('input[name="locationId"]').value,
            apikey: document.querySelector('input[name="apikey"]').value,
            inboundNumbers: document.querySelector('input[name="inboundNumbers"]').value.trim().replace(/\s/g, ''),
            outboundNumber: document.querySelector('input[name="outboundNumber"]').value.trim().replace(/\s/g, ''),
        })
    }).then(
        response => response.json()
    ).then(data => showSnackbar(data.message)).catch(e => showSnackbar('error encountered :', e.message));
    await TriggerTask(locationId);
});