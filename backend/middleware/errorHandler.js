const errorHandler = (err, req, res, next) => {
  console.error('Error Details:', err.message);
  
  let errorMessage = err.message || 'Server Error';

  // Handle specific technical errors to be more user-friendly
  if (err.message && (err.message.includes('ENOTFOUND') || err.message.includes('ECONNREFUSED'))) {
    errorMessage = 'Database connection failed. Please check your network or database configuration.';
  } else if (err.name === 'ValidationError') {
    errorMessage = Object.values(err.errors).map(val => val.message).join(', ');
    return res.status(400).json({ success: false, error: errorMessage });
  }

  res.status(err.status || 500).json({
    success: false,
    error: errorMessage
  });
};

module.exports = errorHandler;

