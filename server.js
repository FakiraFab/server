const express = require("express");
const dotenv = require("dotenv");
const connectDb = require("./config/db");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const inquiryRoutes = require("./routes/inquiryRoutes");
const adminRoutes = require("./routes/adminRoutes");
const subcategoryRoutes = require("./routes/subcategoryRoutes");
const { errorHandler, AppError } = require("./middleware/errorHandler");




// Load environment variables from .env file
dotenv.config();

//Initialize express app
const app = express();

// Connect to the database
connectDb();

const cors = require("cors");

app.use(cors({
  origin: ["http://localhost:5173","http://localhost:5174"],
}));

// Middleware to parse JSON requests
app.use(express.json());

//Routes
// app.use("/api/products", productRoutes);
// app.use("/api/categories",categoryRoutes);
// app.use("/api/inquiry",inquiryRoutes); 
// app.use("/api/admin",adminRoutes);

console.log('Registering route: /api/products');
app.use('/api/products', productRoutes);
console.log('Registering route: /api/categories');
app.use('/api/categories', categoryRoutes);
console.log('Registering route: /api/inquiry');
app.use('/api/inquiry', inquiryRoutes);
console.log('Registering route: /api/admin');
app.use('/api/admin', adminRoutes);
console.log('Registering route: /api/subcategories');
app.use('/api/subcategories', subcategoryRoutes);
// console.log('Registering catch-all route: *');
// app.all('*', (req, res, next) => {
//     // Sanitize the URL to prevent path-to-regexp errors
//     const sanitizedUrl = req.originalUrl.replace(/:/g, '%3A');
//     next(new AppError(`Can't find ${sanitizedUrl} on this server!`, 404));
// });
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
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

// Start the server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', err => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

