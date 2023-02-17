const { MongoClient } = require('mongodb');
const url = "mongodb://0.0.0.0:27017";
const client = new MongoClient(url);

let CONNECTED = false;
const isConnected = () => {
    return CONNECTED;
}
const getClient = () => {
    return client;
}

client.on('serverHeartbeatFailed', event => {
    console.log('failed');
    CONNECTED = false;
});

client.on('serverHeartbeatSucceeded', event => {
    console.log('success');
    CONNECTED = true;
});

async function connectDB(){
    try {
        await client.connect();
        CONNECTED = true;
        console.log('Mongodb is connected');
    } catch (e) {
        console.error('Error: ' + e);
    } 
}
connectDB().catch(console.error);

module.exports = {
    isConnected,
    getClient
}









