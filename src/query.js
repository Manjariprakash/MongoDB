const dbConnection = require('./database')
const ObjectId = require('mongodb').ObjectId
const dbHandle = dbConnection.getClient().db('holidayDB')

const checkDBConnection = () => {
    return dbConnection.isConnected()
}

const getAllHolidaysForYear = async (year) => {
    const sort = { Date: 1};
    return await dbHandle.collection('holidays').find({Date: new RegExp(year)}).sort(sort).toArray();
}

const findHoliday = async (holiday) => {
    return await dbHandle.collection('holidays').findOne({
        Date: holiday.Date,
        Locations: holiday.Locations
    });
}

const findHolidayById = async (objId) => {
    return await dbHandle.collection('holidays').findOne({_id: ObjectId(objId)});
}

const createHoliday = async (newHoliday) => {
    return await dbHandle.collection('holidays').insertOne(newHoliday);
}

const updateHolidayById = async (holiday) => {
    return await dbHandle.collection('holidays').updateOne(
        {_id: ObjectId(holiday._id)},
        {
            $set: {
                    Date: holiday.Date,
                    Desc: holiday.Desc,
                    Type: holiday.Type,
                    Locations: holiday.Locations
            }
        }
    );
}

const deleteHolidayById = async (objId) => {
    return await dbHandle.collection('holidays').deleteOne({ _id: ObjectId(objId) });
}

module.exports = {
    checkDBConnection,
    getAllHolidaysForYear,
    findHolidayById,
    updateHolidayById,
    createHoliday,
    findHoliday,
    deleteHolidayById
}
