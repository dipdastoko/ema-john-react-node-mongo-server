const express = require("express");
const app = express();
const port = process.env.PORT || 5000;

app.get('/', (req, res) => {
    res.send('server running');
})
app.listen(port, () => {
    console.log('listening from server,', port);
})