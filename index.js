const http = require('http'),
    httpProxy = require('http-proxy');

const {getallphonerecords} = require('./functions/methods.js');
const {storerecord} = require('./functions/methods.js');
const {cleanphonerecords} = require('./functions/methods.js');

const proxy = httpProxy.createProxyServer({});

// Setting instance parameters
const mobileContext = process.env.MOBILE_CONTEXT || 'mobile' ;
console.log("Mobile context of this instance is:", mobileContext);
const smsAllowInterval = process.env.SMS_ALLOW_INTERVAL || '1';
console.log("Interval between sending messages is set to:", smsAllowInterval, "min");
const mobileBack = process.env.MOBILE_BACK || 'http://192.168.4.138:8880/'
console.log("Mobileback for this instance  is:", mobileBack);


const server = http.createServer(async function(req, res) {
    let currentDate = new Date().toLocaleString('ru-RU');
    let timeStamp = Date.now();

    if (req.url.match('\/' + mobileContext +'\/rest\/phones\/(\\d+)\/token')) {
        console.log(currentDate, '-', req.headers['x-real-ip'], '-', req.url);

        let arrayOfUrlParts = req.url.split("/");
        let phoneNumber = arrayOfUrlParts[4];

        let phoneRecords = await getallphonerecords(phoneNumber);

        switch (true) {
            case phoneRecords.length === 0:
                await storerecord(phoneNumber, timeStamp);
                proxy.web(req, res, { target: mobileBack }, function(err) {
                    console.log(err);
                });
                break;

            case phoneRecords.length > 0 && phoneRecords.length < 10:
                if ((timeStamp - phoneRecords[0].timeStamp) < smsAllowInterval*1000*60) {
                    let period = timeStamp - phoneRecords[0].timeStamp;
                    console.log(timeStamp, "Too frequently request:", period, "msec. Phone number:", phoneNumber);
                    res.writeHead(503);
                    res.end();
                } else {
                    await storerecord(phoneNumber, timeStamp);
                    proxy.web(req, res, { target: mobileBack }, function(err) {
                        console.log(err);
                    });
                }
                break;

            case phoneRecords.length >= 10:
                if ((timeStamp - phoneRecords[0].timeStamp) < smsAllowInterval*1000*60*60*24) {
                    let period = (timeStamp - phoneRecords[0].timeStamp)/1000/60/60;
                    console.log(timeStamp, "More than 10 requests past 24hr:", period, "hr. Phone number:", phoneNumber);
                    res.writeHead(503);
                    res.end();
                } else {
                    await cleanphonerecords(phoneNumber);
                    await storerecord(phoneNumber, timeStamp);
                    proxy.web(req, res, { target: mobileBack }, function(err) {
                        console.log(err);
                    });
                }
                break;
        }
   }

    if ( req.url === '\/healthcheck\/' ){
        res.writeHead(200);
        res.write(JSON.stringify({ health: 'ok' }));
        res.end();
    }

});

console.log("listening on port 5050")
server.listen(5050);
