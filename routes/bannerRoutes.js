const express = require("express");
const router = express.Router();
const bannerController = require("../controllers/bannerController");
const validate = require("../middleware/validate");
const {
  createBannerSchema,
  updateBannerSchema,
} = require("../schemas/bannerSchema");
const { auth } = require("../middleware/auth");
const { cache } = require("../middleware/cache");

// Public routes
router.get("/", cache({ prefix: 'banners', ttl: 3600, includeParams: ['page', 'limit'] }), bannerController.getBanners);
router.get("/:id", bannerController.getBanner);

const { invalidateCacheMiddleware } = require("../utils/cacheInvalidation");

// Protected admin routes
router.post(
  "/",
  auth,
  validate(createBannerSchema),
  bannerController.createBanner,
  invalidateCacheMiddleware('banners'),
);
router.patch(
  "/:id",
  auth,
  validate(updateBannerSchema),
  bannerController.updateBanner,
  invalidateCacheMiddleware('banners'),
);
router.delete("/:id", auth, bannerController.deleteBanner, invalidateCacheMiddleware('banners'));

module.exports = router;
