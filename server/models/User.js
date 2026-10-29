const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 50,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false, // never return password by default
    },
    avatar: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      maxlength: 300,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'organizer', 'admin'],
      default: 'user',
    },
    savedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
    pushToken: {
      type: String, // Expo push notification token
      default: '',
    },
    // Email verification. Defaults to true so accounts created before this feature
    // (and seeded/admin accounts) keep working; the register endpoint explicitly
    // sets it to false for new sign-ups until they confirm the emailed code.
    isVerified: {
      type: Boolean,
      default: true,
    },
    verifyOtp: { type: String, select: false }, // hashed 6-digit code
    verifyOtpExpires: { type: Date, select: false },
    verifyOtpAttempts: { type: Number, default: 0, select: false },
    verifyOtpSentAt: { type: Date, select: false },
    // Password reset reuses resetPasswordToken/Expires to hold the hashed 6-digit code
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    resetOtpAttempts: { type: Number, default: 0, select: false },
    resetOtpSentAt: { type: Date, select: false },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive fields when converting to JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  delete obj.verifyOtp;
  delete obj.verifyOtpExpires;
  delete obj.verifyOtpAttempts;
  delete obj.verifyOtpSentAt;
  delete obj.resetOtpAttempts;
  delete obj.resetOtpSentAt;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
