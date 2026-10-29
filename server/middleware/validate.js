const { validationResult } = require('express-validator');

/**
 * Runs after an array of express-validator checks. If any failed,
 * responds with a 400 and a list of field-level error messages.
 * Usage: router.post('/route', [check('email').isEmail()], validate, controllerFn)
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

module.exports = validate;
