const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = {
    message: err.message || 'Internal Server Error',
    status: err.status || 500
  };

  // Joi validation errors
  if (err.isJoi) {
    error.status = 400;
    error.message = 'Validation Error';
    error.details = err.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
  }

  // AstraDB specific errors
  if (err.message && err.message.includes('AstraDB')) {
    error.status = 503;
    error.message = 'Database service unavailable';
  }

  // Duplicate key errors
  if (err.code === 11000) {
    error.status = 409;
    error.message = 'Duplicate entry found';
  }

  // Cast errors (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    error.status = 400;
    error.message = 'Invalid data format';
  }

  // Token/Auth errors
  if (err.message && (err.message.includes('token') || err.message.includes('auth'))) {
    error.status = 401;
    error.message = 'Authentication failed';
  }

  // Rate limiting errors
  if (err.status === 429) {
    error.message = 'Too many requests, please try again later';
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && error.status === 500) {
    error.message = 'Internal Server Error';
    delete error.stack;
  } else {
    error.stack = err.stack;
  }

  res.status(error.status).json({
    success: false,
    error: error.message,
    ...(error.details && { details: error.details }),
    ...(error.stack && process.env.NODE_ENV !== 'production' && { stack: error.stack }),
    timestamp: new Date().toISOString()
  });
};

module.exports = errorHandler;
