const express = require("express");
const { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory } = require("../controllers/categoryController");
const validateParams = require("../middleware/validateParams");
const router = express.Router();

router.get("/", getCategories);
router.get("/:id", validateParams(), getCategoryById);
router.post("/", createCategory);
router.patch("/:id", validateParams(), updateCategory);
router.delete("/:id", validateParams(), deleteCategory);

module.exports = router;