const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const phoneScheme = new Schema({
    phoneNumber: String,
    timeStamp: Number,
    requestDate: String
});
const Phone = mongoose.model('Phone', phoneScheme);

// Setting variables
mongoAddr = process.env.MONGO_ADDR || 'localhost'
mongoDBS = process.env.MONGO_DBS || 'mobile'

// Setting instance parameters
const mongoUri = "mongodb://" + mongoAddr + "/" + mongoDBS;
console.log("MongoDB address set to:", mongoUri);

// Setting mongoose parameters
const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
    autoIndex: false, // Don't build indexes
    poolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 10000, // Close sockets after 10 seconds of inactivity
    family: 4 // Use IPv4, skip trying IPv6
};

mongoose.connect(mongoUri, options);

module.exports = {

    getPhoneRecords: async function (phoneNumber, timeStamp, periodHrs) {
        let result = [];
        let period = timeStamp - 1000*60*60*periodHrs;

        result = await Phone.find( { 'phoneNumber' : phoneNumber }, function (err, doc){
            if(err) return console.log(err);
        }).where('timeStamp').gt(period).sort({ 'timeStamp' : -1 }).lean();

        return result;
    },

    storePhoneRecord: function (phoneNumber, timeStamp, currentDate) {
        let phone = new Phone({
            phoneNumber: phoneNumber,
            timeStamp: timeStamp,
            requestDate: currentDate
        });
        phone.save(function (err) {
            if(err) return console.log(err);
            console.log(currentDate, '- Saved phone number:', phoneNumber);
        });
    },

    deletePhoneRecords: function (phoneNumber, timeStamp, currentDate, periodHrs) {
        let period = timeStamp - 1000*60*60*periodHrs;

        Phone.deleteMany( { 'phoneNumber' : phoneNumber }, function (err, result){
            if(err) return console.log(err);
            else console.log(currentDate, '- Deleted', result.deletedCount, 'entries of phone number:', phoneNumber);
        }).where('timeStamp').lt(period);
    }

}
