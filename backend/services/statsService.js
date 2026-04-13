const File = require('../models/File');
const Chunk = require('../models/Chunk');

const getStorageStats = async (userId) => {
  const activeFileFilter = { userId, inTrash: false };

  const [totalFiles, logicalAggregation, trendAggregation, files] = await Promise.all([
    File.countDocuments(activeFileFilter),
    File.aggregate([
      { $match: activeFileFilter },
      { $group: { _id: null, totalLogicalSize: { $sum: '$size' } } }
    ]),
    File.aggregate([
      {
        $match: {
          ...activeFileFilter,
          createdAt: {
            $gte: new Date(Date.now() - (30 * 24 * 60 * 60 * 1000))
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          uploads: { $sum: 1 },
          size: { $sum: '$size' }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    File.find(activeFileFilter).select('chunkHashes size')
  ]);

  const logicalStorage = logicalAggregation[0]?.totalLogicalSize || 0;
  const uniqueChunkHashes = new Set();

  files.forEach((file) => {
    (file.chunkHashes || []).forEach((hash) => uniqueChunkHashes.add(hash));
  });

  const chunks = uniqueChunkHashes.size > 0
    ? await Chunk.find({ hash: { $in: Array.from(uniqueChunkHashes) } }).select('hash size')
    : [];

  const physicalStorage = chunks.reduce((total, chunk) => total + (chunk.size || 0), 0);
  const deduplicationRatio = physicalStorage > 0 ? logicalStorage / physicalStorage : 0;

  return {
    totalFiles,
    logicalStorage,
    physicalStorage,
    deduplicationRatio,
    uploadTrends: trendAggregation,
    storageQuota: null,
    storageUsed: null
  };
};

module.exports = {
  getStorageStats
};
