const express = require('express');
const router = express.Router();
const subcategoryController = require('../controllers/subcategoryController');
// Add authentication/authorization middleware if needed

router.post('/', subcategoryController.createSubcategory);
router.get('/', subcategoryController.getAllSubcategories);
router.get('/:id', subcategoryController.getSubcategoryById);
router.patch('/:id', subcategoryController.updateSubcategory);
router.delete('/:id', subcategoryController.deleteSubcategory);

module.exports = router; 