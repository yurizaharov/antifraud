const http = require('http'),
    httpProxy = require('http-proxy');

const query = require('./functions/queries')
const proxy = httpProxy.createProxyServer({});

// Setting instance parameters
// Mobile context (mobile-cppk for example)
const mobileContext = process.env.MOBILE_CONTEXT || 'mobile' ;
console.log("Mobile context of this instance is:", mobileContext);
// Interval in minutes for each phone number
const smsAllowInterval = process.env.SMS_ALLOW_INTERVAL || '1';
console.log("Interval between sending messages is set to:", smsAllowInterval, "min");
// MobileBack address
const mobileBack = process.env.MOBILE_BACK || 'http://192.168.4.138:8880/'
console.log("Mobileback for this instance  is:", mobileBack);
// Period in hours of allowed sms
const periodHrs = process.env.PERIOD_HRS || '24'
console.log("Mobileback for this instance  is:", periodHrs);
// Number of allowed sms per period
const numberSMS = process.env.NUMBER_SMS || '10'
console.log("Mobileback for this instance  is:", numberSMS);


const server = http.createServer(async function(req, res) {
    let currentDate = new Date().toLocaleString('ru-RU');
    let timeStamp = Date.now();

    if (req.url.match('\/' + mobileContext +'\/rest\/phones\/(\\d+)\/token')) {
        console.log(currentDate, '-', req.headers['x-real-ip'], '-', req.url);

        let arrayOfUrlParts = req.url.split("/");
        let phoneNumber = arrayOfUrlParts[4];

        let phonePeriodHrsRecords = await query.getPhoneRecords(phoneNumber, timeStamp, periodHrs);

        console.log(currentDate, '- Found', phonePeriodHrsRecords.length, 'entries last', periodHrs,'hours of phone number:', phoneNumber)

        switch (true) {
            case phonePeriodHrsRecords.length === 0:
                query.storePhoneRecord(phoneNumber, timeStamp, currentDate);
                proxy.web(req, res, { target: mobileBack }, function(err) {
                    console.log(err);
                });
                break;

            case phonePeriodHrsRecords.length > 0 && phonePeriodHrsRecords.length < numberSMS:
                if ((timeStamp - phonePeriodHrsRecords[0].timeStamp) < smsAllowInterval*1000*60) {
                    let period = timeStamp - phonePeriodHrsRecords[0].timeStamp;
                    console.log(currentDate, '- Too frequently request:', period, 'msec. Phone number:', phoneNumber);
                    res.writeHead(403);
                    res.end();
                } else {
                    query.storePhoneRecord(phoneNumber, timeStamp, currentDate);
                    proxy.web(req, res, { target: mobileBack }, function(err) {
                        console.log(err);
                    });
                }
                break;

            case phonePeriodHrsRecords.length >= numberSMS:
                let timeInMessage = periodHrs - (timeStamp - phonePeriodHrsRecords[9].timeStamp)/1000/60/60;
                console.log(currentDate, '- More than', numberSMS, 'requests past', periodHrs,'hours. Wait', timeInMessage.toFixed(2), 'hr. Phone number:', phoneNumber);
                res.writeHead(403);
                res.end();
                break;
        }

        query.deletePhoneRecords(phoneNumber, timeStamp, currentDate, periodHrs);

   }

    if ( req.url === '\/healthcheck\/' ){
        res.writeHead(200);
        res.write(JSON.stringify({ health: 'ok' }));
        res.end();
    }

});

console.log("listening on port 5050")
server.listen(5050);
