const mongoose = require('mongoose');

/**
 * Connects to MongoDB using the URI defined in environment variables.
 * Exits the process on failure so process managers (pm2, docker) can restart it.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Modern mongoose (6+) no longer needs useNewUrlParser/useUnifiedTopology
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
