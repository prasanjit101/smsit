
exports.CreateHook = async (req, res) => {
    res.sendStatus(200);
    try {
        a = 4;
    } catch (error) {
        res.status(500).send(error.message);
    }
}