
const redis       = require('redis'),
      redisClient = redis.createClient({ host : 'localhost', port : 6379}),
      express     = require('express'),
      bodyParser  = require('body-parser'),
      nodemailer  = require('nodemailer'),
      async       = require('async'),
      winston     = require('winston');
      app         = express();


let host = "localhost:3000";

 let logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: 'logfile' })
    ]
  });


let smtpTransport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
       user: 'yourmail@gmail.com',
       pass: 'yourpassword'
    },
    tls: {rejectUnauthorized: false},
    debug:true
});



exports.sendMail = function(req, res){

    logger.log('info', req.body.to);
  async.waterfall([
    // Check if email already exists.
    // format to store in Redis is {email : unique key}
    function(callback) {
      redisClient.exists(req.body.to,function(err,reply) {
        if(err) {
          logger.error('Error in redis happened!');
          return callback(true,"Error in redis");
        }
        if(reply === 1) {
          logger.info("Email already requested");
          return callback(true,"Email already requested");
        }
        callback(null);
      });
    },
    function(callback) {
      // Generating random string.
      let rand = Math.floor((Math.random() * 100) + 54);
      let encodedMail = new Buffer(req.body.to).toString('base64');
      let link="http://"+req.get('host')+"/verify?mail="+encodedMail+"&id="+rand;
      let mailOptions={
        from : 'kucukkaraaslan.didem@gmail.com',
        to : req.body.to,
        subject : "Email Verification",
        html : "Hello,<br> Please Click on the link to verify your email.<br><a href="+link+">Click here to verify</a>"
      };
      callback(null,mailOptions,rand);
    },
    function(mailData,secretKey,callback) {
     
      // Sending email 
      smtpTransport.sendMail(mailData, function(error, response){
         if(error){
          logger.error('Error happened while sending email');
          return callback(true,"Error in sending email");
       }
        console.log("Message sent: " + JSON.stringify(response));
        // Adding hash key.
        redisClient.set(req.body.to,secretKey);
        redisClient.expire(req.body.to,600); // setting expiry for 10 minutes.
        callback(null,"Email sent Successfully");
    });
    }
  ],function(err,data) {
    console.log(err,data);
    res.json({error : err === null ? false : true, data : data});

  });

}




exports.verify = function(req, res){
   
    if((req.protocol+"://"+req.get('host')) === ("http://"+host)) {
  
    async.waterfall([
      function(callback) {
        let decodedMail = new Buffer(req.query.mail, 'base64').toString('ascii');
        redisClient.get(decodedMail,function(err,reply) {
          if(err) {
            logger.error('Error in redis happened');
            return callback(true,"Error in redis");
          }
          if(reply === null) {
            logger.info("Invalid email address");
            return callback(true,"Invalid email address");
          }
          callback(null,decodedMail,reply);
        });
      },
      function(key,redisData,callback) {
        if(redisData === req.query.id) {
          redisClient.del(key,function(err,reply) {
            if(err) {
              logger.error("Error in deleting key in redis");
              return callback(true,"Error in redis");
            }
            if(reply !== 1) {
              return callback(true,"Issue in redis");
            }
            logger.info("Email is verified")
            callback(null,"Email is verified");
          });
        } else {
          logger.error("Invalid token");
          return callback(true,"Invalid token");
        }
      }
    ],function(err,data) {
      res.send(data);
    });
  } else {
    logger.error("Request is from unknown source");
    res.end("<h1>Request is from unknown source");
  } 
}