const express = require('express');
const {
  getAddresses,
  createAddress,
  getAddressById,
  updateAddress,
  deleteAddress,
  setDefaultAddress
} = require('../controllers/addressController');
const { requireAuth } = require('../middleware/auth');
const validateParams = require('../middleware/validateParams');

const router = express.Router();

// All address routes require authentication
router.use(requireAuth);

// Address CRUD operations
router.get('/', getAddresses);
router.post('/', createAddress);
router.get('/:id', validateParams(), getAddressById);
router.patch('/:id', validateParams(), updateAddress);
router.delete('/:id', validateParams(), deleteAddress);

// Set default address
router.patch('/:id/set-default', validateParams(), setDefaultAddress);

module.exports = router;
