const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const validate = require('../middleware/validate');
const { createBannerSchema, updateBannerSchema } = require('../schemas/bannerSchema');
const auth = require('../middleware/auth');

router.get('/', bannerController.getBanners);
router.get('/:id', bannerController.getBanner);

router.post('/', validate(createBannerSchema), bannerController.createBanner);
router.patch('/:id', validate(updateBannerSchema), bannerController.updateBanner);
router.delete('/:id', bannerController.deleteBanner);

module.exports = router;
