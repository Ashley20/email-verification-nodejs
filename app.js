const redis = require('redis'),
      redisClient = redis.createClient({ host : 'localhost', port : 6379}),
      express = require('express'),
      bodyParser = require('body-parser'),
      nodemailer = require('nodemailer'),
      async = require('async'),
      mandrillTransport = require('nodemailer-mandrill-transport'),
      router = express.Router();
      app = express();

app.use(bodyParser.urlencoded({"extended" : false}));
app.use(router);




app.listen(3000, function(){
    console.log('App is listening on port 3000');
});

require('./routes/Router')(router);



