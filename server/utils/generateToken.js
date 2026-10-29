const jwt = require('jsonwebtoken');

/**
 * Signs a JWT containing the user's id and role.
 * @param {string} id - MongoDB user _id
 * @param {string} role - user role (user | organizer | admin)
 */
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

module.exports = generateToken;
