const { MongoClient } = require("mongodb");
const logger = require("./logger");

const client = new MongoClient(process.env.MONGODB_URI);

client.connect().then(() => {
    logger.info("Connected to MongoDB");
}).catch((error) => {
    logger.error("Error connecting to MongoDB", error);
});


const getClient = () => {
    return client;
}

module.exports = { getClient };