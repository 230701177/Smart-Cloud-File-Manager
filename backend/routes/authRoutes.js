const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, changePassword, logoutAll, deleteAccount, toggle2FA, updateSettings } = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', auth, getMe);

router.put('/change-password', auth, changePassword);
router.post('/logout-all', auth, logoutAll);
router.delete('/delete-account', auth, deleteAccount);
router.patch('/toggle-2fa', auth, toggle2FA);
router.patch('/settings', auth, updateSettings);

module.exports = router;
