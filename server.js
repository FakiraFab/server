const express = require("express");
const dotenv = require("dotenv");
const connectDb = require("./config/db");
const logger = require('./utils/logger');
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const inquiryRoutes = require("./routes/inquiryRoutes");
const adminRoutes = require("./routes/adminRoutes");
const subcategoryRoutes = require("./routes/subcategoryRoutes");
const workshopRegistrationRoutes = require("./routes/workshopRegistrationRoutes");
const bannerRoutes = require("./routes/bannerRoutes");
const reelRoutes = require("./routes/reelRoutes");
const { errorHandler, AppError } = require("./middleware/errorHandler");




// Load environment variables from .env file
dotenv.config();

//Initialize express app
const app = express();

// Connect to the database
connectDb();

const cors = require("cors");
app.use(cors());

// app.use(cors({
//   origin: ["http://localhost:5173","http://localhost:5174"],
// }));

// Middleware to parse JSON requests
app.use(express.json());

// Lightweight request logging to stdout (captured by Render)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info('HTTP request', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - start
    });
  });
  next();
});


// console.log('Registering route: /api/products');
app.use('/api/products', productRoutes);
// console.log('Registering route: /api/categories');
app.use('/api/categories', categoryRoutes);
// console.log('Registering route: /api/inquiry');
app.use('/api/inquiry', inquiryRoutes);
// console.log('Registering route: /api/admin');
app.use('/api/admin', adminRoutes);
// console.log('Registering route: /api/subcategories');
app.use('/api/subcategories', subcategoryRoutes);
// console.log('Registering route: /api/workshop');
app.use('/api/workshop', workshopRegistrationRoutes);
// console.log('Registering route: /api/banners');
app.use('/api/banners', bannerRoutes);
// console.log('Registering route: /api/reels');
app.use('/api/reels', reelRoutes);


// Welcome route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Handle undefined routes
// app.all('*', (req, res, next) => {
//   next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
// });

// Global error handling middleware
app.use(errorHandler);

// Handle uncaught exceptions
process.on('uncaughtException', err => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', {
    name: err.name,
    message: err.message,
    stack: err.stack
  });
  process.exit(1);
});

// Start the server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info('Server started', { env: process.env.NODE_ENV, port: PORT });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', err => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...', {
    name: err.name,
    message: err.message
  });
  server.close(() => {
    process.exit(1);
  });
});

