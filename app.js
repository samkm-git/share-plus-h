const https = require('https');
const fs = require('fs');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');

const main = require('./main');

const options = {
  // key: fs.readFileSync('./certs-new/localhost+4-key.pem', 'utf-8'),
  // cert: fs.readFileSync('./certs-new/localhost+4.pem', 'utf-8')
};

const port = process.env.PORT || 3000;
// const port = process.env.PORT || 8000;

app.use(bodyParser());
// app.use(app.router);
app.use(express.static(__dirname + ''));

app.post('/video', (req, res) => {
  // console.log(req);
  console.log(req.body);
  
  var vidUrl = main.beginVideo(req.body.vidUrl)
    .then((url) => {
      res.send(url);
    });
  // res.send("response");
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/index.html'));
  // res.sendFile('/index.html');
});


// app.listen(port);
var httpsServer = https.createServer(options, app);
httpsServer.listen(port);
