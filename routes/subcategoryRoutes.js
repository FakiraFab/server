const express = require('express');
const router = express.Router();
const subcategoryController = require('../controllers/subcategoryController');
const auth = require('../middleware/auth');

// Public routes
router.get('/', subcategoryController.getAllSubcategories);
router.get('/:id', subcategoryController.getSubcategoryById);

// Protected admin routes
router.post('/', auth, subcategoryController.createSubcategory);
router.patch('/:id', auth, subcategoryController.updateSubcategory);
router.delete('/:id', auth, subcategoryController.deleteSubcategory);

module.exports = router; 