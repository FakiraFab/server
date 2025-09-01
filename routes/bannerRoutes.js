const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const validate = require('../middleware/validate');
const { createBannerSchema, updateBannerSchema } = require('../schemas/bannerSchema');
const auth = require('../middleware/auth');

// Public routes
router.get('/', bannerController.getBanners);
router.get('/:id', bannerController.getBanner);

// Protected admin routes
router.post('/', auth, validate(createBannerSchema), bannerController.createBanner);
router.patch('/:id', auth, validate(updateBannerSchema), bannerController.updateBanner);
router.delete('/:id', auth, bannerController.deleteBanner);

module.exports = router;
