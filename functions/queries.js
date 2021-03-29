const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const phoneScheme = new Schema({
    phoneNumber: String,
    timeStamp: Number
});
const Phone = mongoose.model('Phone', phoneScheme);

// Setting variables
mongoAddr = process.env.MONGO_ADDR || 'localhost'
mongoDBS = process.env.MONGO_DBS || process.env.MOBILE_CONTEXT
//mongoDBS = process.env.MONGO_DBS || 'mobile'

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

    getall: async function (phoneNumber) {
        let result = [];

        result = await Phone.find( { 'phoneNumber' : phoneNumber }, function (err, doc){
            if(err) return console.log(err);
        }).sort({ 'timeStamp' : -1 }).lean();

        return result;
    },

    get24hr: async function (phoneNumber, period24Hr) {
        let result = [];

        result = await Phone.find( { 'phoneNumber' : phoneNumber }, function (err, doc){
            if(err) return console.log(err);
        }).where('timeStamp').gt(period24Hr).sort({ 'timeStamp' : -1 }).lean();

        return result;
    },

    storephonerecord: async function (phoneNumber, timeStamp) {
        let phone = new Phone({
            phoneNumber: phoneNumber,
            timeStamp: timeStamp
        })
        let result = await phone.save(function (err, doc) {
            if(err) return console.log(err);
            console.log('Saved phone number:', phoneNumber);
        });
        console.log(result)

    },

    deletephonerecords: async function (phoneNumber, period24Hr) {
        await Phone.deleteMany( { 'phoneNumber' : phoneNumber }, function (err){
            if(err) return console.log(err);
            console.log('Deleted phone number:', phoneNumber);
        }).where('timeStamp').lt(period24Hr)
    }

}
