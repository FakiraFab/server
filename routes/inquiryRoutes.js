const express = require('express');
const router = express.Router();
const validateParams = require('../middleware/validateParams');
const { createInquiry, getInquiries, updateInquiry, deleteInquiry } = require('../controllers/inquiryController');

router.get('/', getInquiries);
router.post('/', createInquiry);
router.put('/:id', validateParams(), updateInquiry);
router.delete('/:id', validateParams(), deleteInquiry);

module.exports = router;