const express = require("express");
const app = express();
const dot = require("./config");
const path = require('path');
const multer = require('multer');
const cors = require("cors");
// const { GotoAuth, FormHandler, GetForm } = require("./controllers/goto/gotoauth.js");
// const { GhlAuthCode } = require("./controllers/ghl/ghlauth");
// const { CreateHook } = require("./controllers/ChannelHandler");
const helmet = require("helmet");
// const hooks = require('./routes/Webhook');

const PORT = dot.port || 8080;

app.use(cors());
app.use(helmet());
app.use(multer().array());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static')));
app.use(express.raw({ type: 'application/octet-stream' }));
// app.use('/hooks', hooks);

app.enable('trust proxy');

/* 
//logging capabilites in development to check requests and responses made
if (process.env.NODE_ENV !== 'production') {
    const morganBody = require('morgan-body');
    const rfs = require("rotating-file-stream");
    const rfsStream = rfs.createStream("./logs/express.log", {
        size: '1M',
        interval: '1d',
        compress: 'gzip'
    });
    morganBody(app, {
        noColors: true,
        stream: rfsStream
    });
} 
*/

//for the static pages
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'static/ghlInteg.html'));
});

app.get("/redirect", (req, res) => {
    res.sendFile(path.join(__dirname, 'static/landing.html'));
});

/* Hooks - 
/hooks -> ghl webhook
/hooks/ghl/conversation -> ghl conversation webhook
/hooks/goto/locationId -> goto webhook
 */
//rotes
// app.post("/goto-code", GotoAuth);//for goto oauth code
// app.post("/ghl-code", GhlAuthCode);//for ghl oauth code
// app.post("/form", FormHandler);//post form data
// app.post("/get-form", GetForm);//get form data
// app.post("/trigger-channel", CreateHook);//trigger task

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
