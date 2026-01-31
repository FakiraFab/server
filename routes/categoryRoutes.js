const express = require("express");
const { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory } = require("../controllers/categoryController");
const validateParams = require("../middleware/validateParams");
const auth = require('../middleware/auth');
const router = express.Router();

// Public routes
router.get("/", getCategories);
router.get("/:id", validateParams(), getCategoryById);

// Protected admin routes
router.post("/", auth, createCategory);
router.patch("/:id", auth, validateParams(), updateCategory);
router.delete("/:id", auth, validateParams(), deleteCategory);

module.exports = router;