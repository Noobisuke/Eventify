const crypto = require('crypto');

// 6-digit numeric code, cryptographically random
const generateOtp = () => String(crypto.randomInt(100000, 1000000));

// Codes are stored hashed (like passwords), so a leaked database doesn't leak live codes
const hashOtp = (code) =>
  crypto
    .createHmac('sha256', process.env.JWT_SECRET || 'eventify-otp')
    .update(String(code))
    .digest('hex');

const matchesOtp = (code, storedHash) => {
  if (!code || !storedHash) return false;
  const a = Buffer.from(hashOtp(code), 'hex');
  const b = Buffer.from(storedHash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

module.exports = { generateOtp, hashOtp, matchesOtp };
