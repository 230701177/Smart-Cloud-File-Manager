const statsService = require('../services/statsService');

exports.getStorageStats = async (req, res, next) => {
  try {
    const stats = await statsService.getStorageStats(req.user._id);
    res.status(200).json({
      stats: {
        ...stats,
        quota: req.user.storageQuota,
        used: req.user.storageUsed
      }
    });
  } catch (error) {
    next(error);
  }
};
