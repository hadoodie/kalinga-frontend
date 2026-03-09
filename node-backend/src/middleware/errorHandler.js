import morgan from 'morgan';

/**
 * Central error-handling middleware.
 * Must be registered AFTER all routes in server.js.
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}`, err);

  // Supabase / PostgreSQL errors
  if (err.code && err.code.startsWith('2') || err.code === 'PGRST') {
    return res.status(400).json({
      success: false,
      message: 'Database error.',
      error: process.env.NODE_ENV === 'development' ? err.message : 'DB error',
    });
  }

  // Validation errors from express-validator
  if (err.type === 'validation') {
    return res.status(422).json({
      success: false,
      message: 'Validation failed.',
      errors: err.errors,
    });
  }

  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error.';

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * 404 handler — must be registered BEFORE errorHandler and AFTER all routes.
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

/**
 * HTTP request logger (dev mode).
 */
const requestLogger = morgan('dev');

export { errorHandler, notFound, requestLogger };
