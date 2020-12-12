var http = require('http'),
    httpProxy = require('http-proxy');

const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const userScheme = new Schema({
    ip: String
});
const User = mongoose.model("User", userScheme);

var mongoUri = "mongodb://" + process.env.MONGO_ADDR + "/" + process.env.MONGO_DBS;
console.log("MongoDB address set to:", mongoUri);
var mobileBack = process.env.MOBILEBACK;
console.log("This instance mobileback is:", mobileBack);

mongoose.connect(mongoUri);

var proxy = httpProxy.createProxyServer({});

var server = http.createServer(function(req, res) {

    var newsUrl = '\/mobile\/rest\/points\/news\/';
    if (newsUrl.includes(req.url)) {
        console.log(Date.now(), '-', req.headers['x-real-ip'], '-', req.url)
        User.findOne({ip: req.headers['x-real-ip']}, function(err, doc){
            if(err) return console.log(err);
            try {
                let user = doc.ip
                console.log(Date.now(), "Объект найден:", user);
            } catch (e) {
            console.log(e)
                let user = new User({
                    ip: req.headers['x-real-ip']
                })
                user.save(function(err){
                    console.log(Date.now(), "Объект сохранен:", user.ip);
                });
            }
        proxy.web(req, res, { target: mobileBack });
        });
    }

    var addrUrl = '\/mobile\/rest\/addresses\/';
    if (addrUrl.includes(req.url)) {
        console.log(Date.now(), '-', req.headers['x-real-ip'], '-', req.url)
        User.findOne({ip: req.headers['x-real-ip']}, function (err, doc) {
            if (err) return console.log(err);
            try {
                let user = doc.ip
                console.log(Date.now(), "Объект найден:", user);
            } catch (e) {
                console.log(e)
                let user = new User({
                    ip: req.headers['x-real-ip']
                })
                user.save(function (err) {
                    console.log(Date.now(), "Объект сохранен:", user.ip);
                });
            }
            proxy.web(req, res, {target: mobileBack});
        });
    }

    var tokenUrl = req.url;
    if (tokenUrl.match('\/mobile\/rest\/phones\/(\\d+)\/token')) {
        console.log(Date.now(), '-', req.headers['x-real-ip'], '-', req.url)
        User.findOne({ip: req.headers['x-real-ip']}, function (err, doc) {
            if (err) return console.log(err);
            try {
                let user = doc.ip
                console.log(Date.now(), "Объект найден:", user);
                proxy.web(req, res, {target: mobileBack});
            } catch (e) {
                console.log(e);
                res.writeHead(401);
                res.end();
            }
        });
    }

    if ( req.url === '\/healthcheck\/' ){
        res.writeHead(200);
        res.write( 'health: ok\n' );
        res.end();
    }

});

console.log("listening on port 5050")
server.listen(5050);
