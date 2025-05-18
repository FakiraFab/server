const express = require("express");
const dotenv = require("dotenv");
const connectDb = require("./config/db");
const productRoutes = require("./routes/productRoutes");
const errorHandler = require("./middleware/errorHandler");

// Load environment variables from .env file
dotenv.config();

//Initialize express app
const app = express();

// Connect to the database
//connectDb();

// Middleware to parse JSON requests
app.use(express.json());

//Routes
//app.use("/api/products", productRoutes);

// Error handling middleware
//app.use(errorHandler);

app.get("/", (req, res) => {
  res.send("API is running...");
});

// Start the server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`
  );
});
