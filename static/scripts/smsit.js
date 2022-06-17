const SERVER_URL = `${window.location.origin}`;

const getcode = () => {
    try {
        let code = window.location.search.split("=");
        if (code[1] === undefined) throw new Error("No code found");
        console.log('code', code[1]);
        return code[1];
    } catch (e) {
        //get element by id
        alert("Error! Please SignIn with GHL again");
        console.log(e.message);
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
            document.querySelector('input[name="locationId"]').value = formData.locationId,
                document.querySelector('input[name="apikey"]').value = formData.apikey,
                document.querySelector('input[name="inboundNumbers"]').value = formData.inboundNumbers,
                document.querySelector('input[name="outboundNumber"]').value = formData.outboundNumber
        }
    } catch (e) {
        document.querySelector('input[name="locationId"]').value = locationId;
    }
}
//exec part
let authcode = getcode();
if (authcode) {
    getcred(SERVER_URL + '/ghl-code', { "code": authcode })
        .then(data => {
            console.log("GHL CONNECTED SUCCESSFULLY !");
            console.log("data1", data[1]);
            document.getElementById('message').innerHTML = `
            <p>[location ID] ${data[0]}</p>
            <p>[Name] ${data[1].location.business.name}</p>`;
            GetForm(data[0]);
        }).catch(err => {
            console.log(err.message);
            document.getElementById('message').innerHTML = `<div class="error"><a href="${window.location.origin}">Error : Please login with GoHighLevel again</a></div>`;
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
            inboundNumbers: document.querySelector('textarea[name="inboundNumbers"]').value.trim().replace(/\s/g, ''),
            outboundNumber: document.querySelector('input[name="outboundNumber"]').value.trim().replace(/\s/g, ''),
        })
    }).then(
        response => response.json()
    ).then(data => alert(data.message)).catch(e => {
        console.log('error encountered :', e.message);
        document.getElementById('message').innerHTML = `<div class="error"><p>${e.message}</p></div>`;
    });
    //await TriggerTask(locationId);
});