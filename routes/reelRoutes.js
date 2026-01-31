const express = require('express');
const router = express.Router();
const reelController = require('../controllers/reelController');
const validate = require('../middleware/validate');
const { createReelSchema, updateReelSchema } = require('../schemas/reelSchema');
const auth = require('../middleware/auth');

router.get('/', reelController.getReels);
router.get('/active', reelController.getActiveReels);
router.get('/:id', reelController.getReel);

router.post('/', validate(createReelSchema), reelController.createReel);
router.patch('/:id', validate(updateReelSchema), reelController.updateReel);
router.patch('/:id/toggle-visibility', reelController.toggleReelVisibility);
router.delete('/:id', reelController.deleteReel);

module.exports = router; 