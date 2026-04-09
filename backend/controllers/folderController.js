const Folder = require('../models/Folder');

// @desc    Create a new folder
// @route   POST /api/folders
exports.createFolder = async (req, res, next) => {
  try {
    const { name, parentId, color } = req.body;
    
    const folder = await Folder.create({
      name,
      parentId: parentId || null,
      color: color || '#4285f4',
      userId: req.user._id
    });
    
    res.status(201).json({ folder });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's folders
// @route   GET /api/folders
exports.getFolders = async (req, res, next) => {
  try {
    const folders = await Folder.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ folders });
  } catch (error) {
    next(error);
  }
};

// @desc    Rename/update a folder
// @route   PUT /api/folders/:folderId
exports.updateFolder = async (req, res, next) => {
  try {
    const { folderId } = req.params;
    const { name, color } = req.body;
    
    const folder = await Folder.findOneAndUpdate(
      { folderId, userId: req.user._id },
      { name, color },
      { new: true }
    );
    
    if (!folder) return res.status(404).json({ error: 'Folder not found' });
    
    res.status(200).json({ folder });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a folder
// @route   DELETE /api/folders/:folderId
exports.deleteFolder = async (req, res, next) => {
  try {
    const { folderId } = req.params;
    
    // In a real app, we should also delete or move children files/folders
    const folder = await Folder.findOneAndDelete({ folderId, userId: req.user._id });
    
    if (!folder) return res.status(404).json({ error: 'Folder not found' });
    
    res.status(200).json({ message: 'Folder deleted successfully' });
  } catch (error) {
    next(error);
  }
};
