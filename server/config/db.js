const mongoose = require('mongoose');

// Reuse the connection across requests (Vercel keeps warm instances alive between calls)
const cached = global._mongoose || (global._mongoose = { conn: null, promise: null });

/**
 * Connects to MongoDB using MONGO_URI.
 * Reuses an existing connection, and throws on failure instead of exiting,
 * so the error handler can respond with a 500 and the next request can retry.
 */
const connectDB = async () => {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGO_URI, { bufferCommands: false })
      .then((m) => {
        console.log(`MongoDB Connected: ${m.connection.host}`);
        return m;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null; // allow a retry on the next request
    console.error(`MongoDB connection error: ${error.message}`);
    throw error;
  }

  return cached.conn;
};

module.exports = connectDB;