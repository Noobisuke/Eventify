const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { generateOtp, hashOtp, matchesOtp } = require('../utils/otp');
const { sendOtpEmail } = require('../utils/sendEmail');
const { checkEmailDeliverable } = require('../utils/emailCheck');
const { asyncHandler } = require('../middleware/errorHandler');

const VERIFY_OTP_MINUTES = 10;
const RESET_OTP_MINUTES = 15;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_OTP_ATTEMPTS = 5;

// Seconds left before another code may be requested (0 = allowed now)
const cooldownRemaining = (sentAt) => {
  if (!sentAt) return 0;
  const elapsed = (Date.now() - new Date(sentAt).getTime()) / 1000;
  return Math.max(0, Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed));
};

const issueVerificationOtp = async (user) => {
  const code = generateOtp();
  user.verifyOtp = hashOtp(code);
  user.verifyOtpExpires = new Date(Date.now() + VERIFY_OTP_MINUTES * 60 * 1000);
  user.verifyOtpAttempts = 0;
  user.verifyOtpSentAt = new Date();
  await user.save();
  await sendOtpEmail({ to: user.email, name: user.name, code, purpose: 'verify', minutes: VERIFY_OTP_MINUTES });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Only allow 'user' or 'organizer' at signup; 'admin' must be set manually/by another admin
  const allowedRole = role === 'organizer' ? 'organizer' : 'user';

  let user = await User.findOne({ email }).select('+verifyOtpSentAt');

  if (user && user.isVerified) {
    return res.status(400).json({ success: false, message: 'Email is already registered' });
  }

  // Reject typos, throwaway inboxes and addresses that can't receive mail
  // BEFORE sending anything or creating an account.
  const emailCheck = await checkEmailDeliverable(email);
  if (!emailCheck.ok) {
    return res.status(400).json({ success: false, code: 'INVALID_EMAIL', message: emailCheck.message });
  }

  if (user) {
    // An earlier sign-up with this email was never verified - let the latest attempt take over,
    // but not faster than the resend cooldown (stops people spamming codes to someone's inbox).
    const wait = cooldownRemaining(user.verifyOtpSentAt);
    if (wait > 0) {
      return res.status(429).json({
        success: false,
        message: `A code was just sent to ${email}. Check your inbox, or try again in ${wait}s.`,
        retryAfter: wait,
      });
    }
    user.name = name;
    user.password = password;
    user.role = allowedRole;
  } else {
    user = new User({ name, email, password, role: allowedRole, isVerified: false });
  }

  try {
    await issueVerificationOtp(user);
  } catch (err) {
    console.error('[EMAIL ERROR] register:', err.message);
    return res.status(502).json({
      success: false,
      message: 'We could not send the verification email. Check the address and try again.',
    });
  }

  // No token yet - the account can't be used until the emailed code is confirmed
  res.status(201).json({
    success: true,
    message: 'Account created. Enter the code we emailed you to verify your address.',
    requiresVerification: true,
    email: user.email,
  });
});

/**
 * @route   POST /api/auth/verify-email
 * @desc    Confirm the emailed 6-digit code; logs the user in on success
 * @access  Public
 */
const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email }).select('+verifyOtp +verifyOtpExpires +verifyOtpAttempts');
  if (!user) {
    return res.status(400).json({ success: false, message: 'Invalid or expired code' });
  }
  if (user.isVerified) {
    return res.status(400).json({ success: false, message: 'Email is already verified. Please log in.' });
  }
  if (!user.verifyOtp || !user.verifyOtpExpires || user.verifyOtpExpires < Date.now()) {
    return res.status(400).json({ success: false, message: 'This code has expired. Request a new one.' });
  }
  if (user.verifyOtpAttempts >= MAX_OTP_ATTEMPTS) {
    return res.status(429).json({ success: false, message: 'Too many incorrect attempts. Request a new code.' });
  }

  if (!matchesOtp(otp, user.verifyOtp)) {
    user.verifyOtpAttempts += 1;
    await user.save();
    const left = MAX_OTP_ATTEMPTS - user.verifyOtpAttempts;
    return res.status(400).json({
      success: false,
      message: left > 0 ? `Incorrect code. ${left} attempt${left === 1 ? '' : 's'} left.` : 'Too many incorrect attempts. Request a new code.',
    });
  }

  user.isVerified = true;
  user.verifyOtp = undefined;
  user.verifyOtpExpires = undefined;
  user.verifyOtpAttempts = 0;
  await user.save();

  const token = generateToken(user._id, user.role);
  res.status(200).json({ success: true, message: 'Email verified', token, user });
});

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Send a fresh verification code (60s cooldown)
 * @access  Public
 */
const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email }).select('+verifyOtpSentAt');

  // Same answer whether or not the account exists, so emails can't be probed
  const generic = { success: true, message: 'If that account needs verification, a new code has been sent.' };
  if (!user || user.isVerified) return res.status(200).json(generic);

  const wait = cooldownRemaining(user.verifyOtpSentAt);
  if (wait > 0) {
    return res.status(429).json({ success: false, message: `Please wait ${wait}s before requesting another code.`, retryAfter: wait });
  }

  try {
    await issueVerificationOtp(user);
  } catch (err) {
    console.error('[EMAIL ERROR] resend:', err.message);
    return res.status(502).json({ success: false, message: 'We could not send the email. Please try again.' });
  }
  res.status(200).json(generic);
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & return token
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password +verifyOtpSentAt');
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  if (!user.isActive) {
    return res.status(403).json({ success: false, message: 'Account has been deactivated' });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  // Password was right but the email was never confirmed: send a fresh code (if the
  // cooldown allows) and tell the app to show the verification screen.
  if (!user.isVerified) {
    let message = 'Please verify your email to continue.';
    if (cooldownRemaining(user.verifyOtpSentAt) === 0) {
      try {
        await issueVerificationOtp(user);
        message = 'Please verify your email to continue. We sent you a new code.';
      } catch (err) {
        console.error('[EMAIL ERROR] login:', err.message);
      }
    }
    return res.status(403).json({ success: false, code: 'EMAIL_NOT_VERIFIED', email: user.email, message });
  }

  const token = generateToken(user._id, user.role);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    user,
  });
});

/**
 * @route   GET /api/auth/me
 * @desc    Get currently authenticated user's profile
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('savedEvents', 'title date images city category');
  res.status(200).json({ success: true, user });
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update logged-in user's profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, bio, avatar, pushToken } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  if (name !== undefined) user.name = name;
  if (bio !== undefined) user.bio = bio;
  if (avatar !== undefined) user.avatar = avatar;
  if (pushToken !== undefined) user.pushToken = pushToken;

  await user.save();

  res.status(200).json({ success: true, message: 'Profile updated', user });
});

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change password while logged in
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Current password is incorrect' });
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({ success: true, message: 'Password changed successfully' });
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Email a 6-digit password reset code
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email }).select('+resetOtpSentAt');

  // Always the same response, so it can't be used to find out which emails are registered
  const generic = { success: true, message: 'If that email is registered, a reset code has been sent.' };
  if (!user) return res.status(200).json(generic);

  if (cooldownRemaining(user.resetOtpSentAt) > 0) return res.status(200).json(generic);

  const code = generateOtp();
  user.resetPasswordToken = hashOtp(code);
  user.resetPasswordExpires = new Date(Date.now() + RESET_OTP_MINUTES * 60 * 1000);
  user.resetOtpAttempts = 0;
  user.resetOtpSentAt = new Date();
  await user.save();

  try {
    await sendOtpEmail({ to: user.email, name: user.name, code, purpose: 'reset', minutes: RESET_OTP_MINUTES });
  } catch (err) {
    console.error('[EMAIL ERROR] forgot-password:', err.message);
  }

  res.status(200).json(generic);
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using the emailed 6-digit code
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({ email }).select('+resetOtpAttempts');
  if (!user || !user.resetPasswordToken || !user.resetPasswordExpires || user.resetPasswordExpires < Date.now()) {
    return res.status(400).json({ success: false, message: 'Invalid or expired code' });
  }
  if (user.resetOtpAttempts >= MAX_OTP_ATTEMPTS) {
    return res.status(429).json({ success: false, message: 'Too many incorrect attempts. Request a new code.' });
  }

  if (!matchesOtp(otp, user.resetPasswordToken)) {
    user.resetOtpAttempts += 1;
    await user.save();
    return res.status(400).json({ success: false, message: 'Incorrect code' });
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  user.resetOtpAttempts = 0;
  user.isVerified = true; // they just proved they own this inbox
  await user.save();

  res.status(200).json({ success: true, message: 'Password has been reset successfully' });
});

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  login,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
};
