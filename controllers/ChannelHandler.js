const { GotoCreateHook, GotoSubscribe } = require("./goto/gotoApi");


exports.CreateHook = async (req, res) => {
    try {
        //create webhook
        const locationId = Buffer.from(req.body.locationId, 'base64').toString('ascii').slice(0, -10);
        const channel = await GotoCreateHook(locationId);
        //subscribe to webhook
        await GotoSubscribe(channel.channelId, locationId);
        res.status(200).send("ok");
    } catch (error) {
        console.log('Error at create Hook : ', error.message);
        res.send({ error: error.message });
    }

}