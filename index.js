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
        User.findOne({ ip: req.headers['x-real-ip'] }, function (err, doc){
            if(err) return console.log(err);
            if(!doc) {
                let user = new User({
                    ip: req.headers['x-real-ip']
                })
                user.save(function (err){
                    if(err) return console.log(err);
                    console.log(timeStamp, "Saved IP address:", req.headers['x-real-ip']);
                });
            } else {
                console.log(timeStamp, "Found IP address:", doc.ip);
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
            if(err) return console.log(err);
            if(!doc) {
                let user = new User({
                    ip: req.headers['x-real-ip']
                })
                user.save(function (err) {
                    if(err) return console.log(err);
                    console.log(timeStamp, "Saved IP address:", req.headers['x-real-ip']);
                });
            } else {
                console.log(timeStamp, "Found IP address:", doc.ip);
            }
            proxy.web(req, res, { target: mobileBack }, function(e) {
                console.log(e)
            });
        });
    }

    var tokenUrl = req.url;
    if (tokenUrl.match('\/' + mobileContext +'\/rest\/phones\/(\\d+)\/token')) {
        console.log(timeStamp, '-', req.headers['x-real-ip'], '-', req.url)

        var arrayOfParts = req.url.split("/");
        var phoneNumber = arrayOfParts[4]

        User.findOne({ ip: req.headers['x-real-ip'] }, function (err, doc) {
            if(err) return console.log(err);
            if (!doc) {
                console.log(timeStamp, "IP address not found:", req.headers['x-real-ip']);
                res.writeHead(503);
                res.end();
            } else {
                console.log(timeStamp, "Found IP address:", doc.ip);
                Phone.findOne({ phone: phoneNumber }, function (err, rec) {
                    if(err) return console.log(err);
                    if(!rec) {
                        let phone = new Phone({
                            phone: phoneNumber,
                            timestamp: timeStamp
                        })
                        phone.save(function (err) {
                            if(err) return console.log(err);
                            console.log(timeStamp, "Saved phone number:", phoneNumber);
                        });
                        proxy.web(req, res, { target: mobileBack }, function(e) {
                            console.log(e)
                        });
                    } else {
                        if ((timeStamp - rec.timestamp) < smsAllowInterval*60*1000) {
                            console.log(timeStamp, "Too frequently request:", timeStamp - rec.timestamp, "msec. Phone number:", phoneNumber);
                            res.writeHead(503);
                            res.end();
                        } else {
                            Phone.updateMany({ phone: phoneNumber }, { timestamp: timeStamp }, function(err){
                                if(err) return console.log(err);
                                console.log(timeStamp, "Phone number renewed:", phoneNumber);
                            });
                            proxy.web(req, res, { target: mobileBack }, function(e) {
                                console.log(e)
                            });
                        }
                    }
                })
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
