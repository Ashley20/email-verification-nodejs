var smtp = require('../smtp/Smtp');


module.exports = function(router){

    router.get('/index', function(req, res){
        res.sendfile('index.html');
    }),

    router.post('/send', smtp.sendMail),

    router.get('/verify', smtp.verify)


}