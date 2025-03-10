const https = require('https');
const http = require('http');
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
// const port = 8080;
// const port = process.env.PORT || 8000;

app.use(bodyParser());
// app.use(app.router);
app.use(express.static('public'));

app.post('/video', (req, res) => {
  // console.log(req);
  console.log(req.body);
  
  var vidUrl = main.beginVideo(req.body.vidUrl)
    .then((url) => {
      res.send(url);
      console.log(url);
    });
  // res.send("response");
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
  // res.sendFile('/index.html');
});


// app.listen(port, () => console.log(`Listening on ${ port }`));
// var httpsServer = https.createServer(options, app);
// httpsServer.listen(port, () => console.log(`Listening on ${ port }`));
var httpServer = http.createServer({}, app);
httpServer.listen(port, () => console.log(`Listening on ${ port }`));
