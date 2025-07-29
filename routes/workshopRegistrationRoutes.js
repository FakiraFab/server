const express = require('express');
const router = express.Router();
const validateParams = require('../middleware/validateParams');
const { 
  createWorkshop,
  createRegistration,
  getAllWorkshops, 
  getRegistrations, 
  updateRegistration, 
  deleteRegistration,
  getWorkshopById,
  updateWorkshop,
  deleteWorkshop 
  

} = require('../controllers/workshopRegistrationController');

router.get('/', getRegistrations);
router.post('/', createRegistration);
router.patch('/:id', validateParams(), updateRegistration);
router.delete('/:id', validateParams(), deleteRegistration);


router.post('/create', createWorkshop);
router.get('/workshops', getAllWorkshops);
router.get('/workshops/:id', validateParams(), getWorkshopById);
router.patch('/workshops/:id', validateParams(), updateWorkshop);
router.delete('/workshops/:id', validateParams(), deleteWorkshop);


module.exports = router;
