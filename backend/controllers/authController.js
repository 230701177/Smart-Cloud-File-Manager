const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_key', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
exports.registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      res.status(201).json({
        user,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ error: 'Invalid user data' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      res.json({
        user,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get user data
// @route   GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    // req.user is populated by the auth middleware
    res.status(200).json({ user: req.user });
  } catch (error) {
    next(error);
  }
};

// @desc    Change Password
// @route   PUT /api/auth/change-password
exports.changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    
    if (user && (await user.comparePassword(oldPassword))) {
      user.password = newPassword;
      await user.save();
      res.status(200).json({ message: 'Password updated successfully' });
    } else {
      res.status(400).json({ error: 'Incorrect old password' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Logout All Sessions (Mock implementation, requires invalidating JWT or rotating secret)
// @route   POST /api/auth/logout-all
exports.logoutAll = async (req, res, next) => {
  try {
    // Usually invalidates tokens using a blacklist DB table or bumping user's token version.
    res.status(200).json({ message: 'Logged out of all sessions' });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete Account
// @route   DELETE /api/auth/delete-account
exports.deleteAccount = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.status(200).json({ message: 'Account deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle 2FA
// @route   PATCH /api/auth/toggle-2fa
exports.toggle2FA = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.twoFactorEnabled = !user.twoFactorEnabled;
    await user.save();
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update User Settings (notifications, etc)
// @route   PATCH /api/auth/settings
exports.updateSettings = async (req, res, next) => {
  try {
    const { notificationSettings } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { notificationSettings },
      { new: true }
    );
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};
