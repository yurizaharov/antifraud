var http = require('http'),
    httpProxy = require('http-proxy');

const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const userScheme = new Schema({
    ip: String
});
const User = mongoose.model("User", userScheme);
mongoose.connect("mongodb://192.168.4.197:27017/usersdb");

var proxy = httpProxy.createProxyServer({});

var server = http.createServer(function(req, res) {
    let timeStamp = Date.now()
    let xRealIp = req.headers['x-real-ip']
    let destUrl = req.url
    console.log(`${timeStamp} - ${xRealIp} - ${destUrl}`)

    var newsUrl = '\/mobile\/rest\/points\/news\/';
    if (newsUrl.includes(req.url)) {
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
        proxy.web(req, res, { target: 'http://192.168.4.138:8880' });
        });
    }

    var addrUrl = '\/mobile\/rest\/addresses\/';
    if (addrUrl.includes(req.url)) {
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
            proxy.web(req, res, {target: 'http://192.168.4.138:8880'});
        });
    }

    var tokenUrl = req.url;
    if (tokenUrl.match('\/mobile\/rest\/phones\/(\\d+)\/token')) {
        User.findOne({ip: req.headers['x-real-ip']}, function (err, doc) {
            if (err) return console.log(err);
            try {
                let user = doc.ip
                console.log(Date.now(), "Объект найден:", user);
                proxy.web(req, res, {target: 'http://192.168.4.138:8880'});
            } catch (e) {
                console.log(e);
                res.writeHead(401);
                res.end();
            }
        });
    }
});

console.log("listening on port 5050")
server.listen(5050);
