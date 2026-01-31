const express = require('express');
const router = express.Router();
const validateParams = require('../middleware/validateParams');
const auth = require('../middleware/auth');
const { 
  createWorkshop,
  createRegistration,
  getAllWorkshops, 
  getRegistrations, 
  getRegistrationsByWorkshop,
  updateRegistration, 
  deleteRegistration,
  getWorkshopById,
  updateWorkshop,
  deleteWorkshop 
} = require('../controllers/workshopRegistrationController');

// Public routes
router.get('/', getRegistrations);
router.post('/', createRegistration); // Keep registration public for users
router.get('/workshops', getAllWorkshops);
router.get('/workshops/:id', validateParams(), getWorkshopById);
router.get('/workshops/:workshopId/registrations', validateParams(), getRegistrationsByWorkshop);

// Protected admin routes
router.patch('/:id', auth, validateParams(), updateRegistration);
router.delete('/:id', auth, validateParams(), deleteRegistration);

// Protected workshop management routes
router.post('/create', auth, createWorkshop);
router.patch('/workshops/:id', auth, validateParams(), updateWorkshop);
router.delete('/workshops/:id', auth, validateParams(), deleteWorkshop);

module.exports = router;
