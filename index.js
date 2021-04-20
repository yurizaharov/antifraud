const http = require('http'),
    httpProxy = require('http-proxy');

const query = require('./functions/queries')
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

        let phone24HrRecords = await query.get24hrphonerecords(phoneNumber, timeStamp);

        console.log(currentDate, '- Found', phone24HrRecords.length, 'entries last 24Hr of phone number:', phoneNumber)

        switch (true) {
            case phone24HrRecords.length === 0:
                query.storephonerecord(phoneNumber, timeStamp, currentDate);
                proxy.web(req, res, { target: mobileBack }, function(err) {
                    console.log(err);
                });
                break;

            case phone24HrRecords.length > 0 && phone24HrRecords.length < 10:
                if ((timeStamp - phone24HrRecords[0].timeStamp) < smsAllowInterval*1000*60) {
                    let period = timeStamp - phone24HrRecords[0].timeStamp;
                    console.log(currentDate, '- Too frequently request:', period, 'msec. Phone number:', phoneNumber);
                    res.writeHead(403);
                    res.end();
                } else {
                    query.storephonerecord(phoneNumber, timeStamp, currentDate);
                    proxy.web(req, res, { target: mobileBack }, function(err) {
                        console.log(err);
                    });
                }
                break;

            case phone24HrRecords.length >= 10:
                let timeInMessage = 24 - (timeStamp - phone24HrRecords[9].timeStamp)/1000/60/60;
                console.log(currentDate, "- More than 10 requests past 24hr. Wait", timeInMessage.toFixed(2), "hr. Phone number:", phoneNumber);
                res.writeHead(403);
                res.end();
                break;
        }

        query.deletephonerecords(phoneNumber, timeStamp, currentDate);

   }

    if ( req.url === '\/healthcheck\/' ){
        res.writeHead(200);
        res.write(JSON.stringify({ health: 'ok' }));
        res.end();
    }

});

console.log("listening on port 5050")
server.listen(5050);
