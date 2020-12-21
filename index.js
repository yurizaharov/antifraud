const http = require('http'),
    httpProxy = require('http-proxy');

const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const userScheme = new Schema({
    ip: String
});
const User = mongoose.model("User", userScheme);

const phoneScheme = new Schema({
    phone: String,
    timestamp: Number
});
const Phone = mongoose.model("Phone", phoneScheme);


// Setting instance parameters
const mongoUri = "mongodb://" + process.env.MONGO_ADDR + "/" + process.env.MONGO_DBS;
console.log("MongoDB address set to:", mongoUri);
const mobileBack = process.env.MOBILE_BACK;
console.log("Mobileback for this instance  is:", mobileBack);
const mobileContext = process.env.MOBILE_CONTEXT;
console.log("Mobile context of this instance is:", mobileContext);
const smsAllowInterval = process.env.SMS_ALLOW_INTERVAL;
console.log("Interval between sending messages is set to:", smsAllowInterval, "min");

mongoose.connect(mongoUri);

var proxy = httpProxy.createProxyServer({});

var server = http.createServer(function(req, res) {
    var timeStamp = Date.now();

    var newsUrl = '\/' + mobileContext +'\/rest\/points\/news\/';
    if (newsUrl.includes(req.url)) {
        console.log(timeStamp, '-', req.headers['x-real-ip'], '-', req.url)
        User.findOne({ ip: req.headers['x-real-ip'] }, function(err, doc){
            if(err) return console.log(err);
            if(!doc) {
                let user = new User({
                    ip: req.headers['x-real-ip']
                })
                user.save(function(){
                    console.log(timeStamp, "IP address saved:", req.headers['x-real-ip']);
                });
            } else {
                console.log(timeStamp, "IP address found:", doc.ip);
            }
            proxy.web(req, res, { target: mobileBack }, function(e) {
                console.log(e)
            });
        });
    }

    var addrUrl = '\/' + mobileContext +'\/rest\/addresses\/';
    if (addrUrl.includes(req.url)) {
        console.log(timeStamp, '-', req.headers['x-real-ip'], '-', req.url)
        User.findOne({ ip: req.headers['x-real-ip'] }, function (err, doc) {
            if (err) return console.log(err);
            if(!doc) {
                let user = new User({
                    ip: req.headers['x-real-ip']
                })
                user.save(function () {
                    console.log(timeStamp, "IP address saved:", req.headers['x-real-ip']);
                });
            } else {
                console.log(timeStamp, "IP address found:", doc.ip);
            }
            proxy.web(req, res, { target: mobileBack }, function(e) {
                console.log(e)
            });
        });
    }

    var tokenUrl = req.url;
    if (tokenUrl.match('\/' + mobileContext +'\/rest\/phones\/(\\d+)\/token')) {
        console.log(timeStamp, '-', req.headers['x-real-ip'], '-', req.url)

        var arrayOfStrings = req.url.split("/");
        var phoneNumber = arrayOfStrings[4]

        User.findOne({ip: req.headers['x-real-ip']}, function (err, doc) {
            if (err) return console.log(err);
            try {
                let user = doc.ip;
                console.log(timeStamp, "Объект найден:", user);

                Phone.findOne({phone: phoneNumber}, function (err, rec) {
                    if (err) return console.log(err);
                    try {
                        let phone = rec.phone;
                        if ((timeStamp - rec.timestamp) < smsAllowInterval*60*1000) {
                            console.log(timeStamp, "Слишком частый запрос, прошло", timeStamp - rec.timestamp, "мсек. Номер:", phoneNumber);
                            res.writeHead(503);
                            res.end();
                        } else {
                            Phone.updateMany({phone: phoneNumber}, {timestamp: timeStamp}, function(err, result){
                                if(err) return console.log(err);
                                console.log(timeStamp, "Номер обновлен:", phoneNumber);
                            });
                            proxy.web(req, res, {target: mobileBack});
                        }
                    } catch (e) {
                        let phone = new Phone({
                            phone: phoneNumber,
                            timestamp: timeStamp
                        })
                        phone.save(function(err){
                            console.log(timeStamp, "Номер сохранен:", phone.phone);
                            proxy.web(req, res, {target: mobileBack});
                        });
                    }
                });
            } catch (e) {
                console.log(e);
                res.writeHead(503);
                res.end();
            }
        });
    }

    if ( req.url === '\/healthcheck\/' ){
        res.writeHead(200);
        res.write(JSON.stringify({ health: 'ok' }));
        res.end();
    }

});

console.log("listening on port 5050")
server.listen(5050);
