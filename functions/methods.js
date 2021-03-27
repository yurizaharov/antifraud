const {getphonerecords} = require('../functions/queries.js')
const {storephonerecord} = require('../functions/queries.js')
const {deletephonerecords} = require('../functions/queries.js')

module.exports = {

    getallphonerecords: async function (phoneNumber) {
        let phoneRecords = [];
        phoneRecords = await getphonerecords(phoneNumber);
        return phoneRecords;
    },

    storerecord: async function (phoneNumber, timeStamp) {
        await storephonerecord(phoneNumber, timeStamp);
    },

    cleanphonerecords: async function (phoneNumber) {
        await deletephonerecords(phoneNumber);
    }

}