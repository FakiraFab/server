const express = require('express');
const router = express.Router();
const validateParams = require('../middleware/validateParams');
const { createInquiry, getInquiries, updateInquiry, deleteInquiry, testWhatsApp } = require('../controllers/inquiryController');

router.get('/', getInquiries);
router.post('/', createInquiry);
router.patch('/:id', validateParams(), updateInquiry);
router.delete('/:id', validateParams(), deleteInquiry);
router.post('/test-whatsapp', testWhatsApp);

module.exports = router;