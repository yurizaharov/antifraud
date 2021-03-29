const {getall} = require('../functions/queries.js')
const {get24hr} = require('../functions/queries.js')
const {storephonerecord} = require('../functions/queries.js')
const {deletephonerecords} = require('../functions/queries.js')

module.exports = {

    getallphonerecords: async function (phoneNumber) {
        let phoneRecords = [];
        phoneRecords = await getall(phoneNumber);
        return phoneRecords;
    },

    get24hrphonerecords: async function (phoneNumber, timeStamp) {
        let phone24HrRecords = [];
        let period24Hr = timeStamp - 1000*60*60*24;
        phone24HrRecords = await get24hr(phoneNumber, period24Hr);
        return phone24HrRecords;
    },

    storerecord: async function (phoneNumber, timeStamp) {
        await storephonerecord(phoneNumber, timeStamp);
    },

    cleanphonerecords: async function (phoneNumber, timeStamp) {
        let period24Hr = timeStamp - 1000*60*60*24;
        await deletephonerecords(phoneNumber, period24Hr);
    }

}