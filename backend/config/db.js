const mongoose = require('mongoose');
require('dotenv').config(); // To load environment variables from the .env file

const connectDB = async () => {
  try {
    // Get the MongoDB URI from environment variables
    const dbURI = process.env.MONGODB_URI;

    // Connect to MongoDB
    await mongoose.connect(dbURI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1); // Exit the process if there's a connection error
  }
};

module.exports = connectDB;
