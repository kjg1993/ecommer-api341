const dotenv = require('dotenv');
const { MongoNotConnectedError } = require('mongodb');
const mongoose = require('mongoose');

dotenv.config();

let isConnected = false;

const connectDB = async () => {
    if (isConnected) {
        console.log('Using existing mongoose connection');
        return;
    }

    try {

        const db = await mongoose.connect(process.env.MONGODB_URL, {
            dbName: 'ecommerce-api'
        });

        isConnected = db.connections[0].readyState === 1;
        console.log('Mongoose successfully connected to MongoDB Atlas');
        console.log('Database used:', mongoose.connection.db.databaseName);

        mongoose.connection.on('error', (err) => {
            console.error('Error connecting to Mongoose:', err);

        });

        mongoose.connection.on('disconnected', () => {
            console.log('Mongoose disconnected');
            isConnected = false;

        });

    } catch (error) {
        console.error('Error connecting to the database:', error);
        process.exit(1);

    }
};

const getDb = () => {
    if (!isConnected) {
        throw new Error('Database not connected');

    }
    return mongoose.connection;
};

module.exports = {
    connectDB,
    getDb
};