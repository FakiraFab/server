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
const { invalidateCacheMiddleware } = require("../utils/cacheInvalidation");

// Public routes
router.get("/", cache({ prefix: 'banners', ttl: 3600, includeParams: ['page', 'limit'] }), bannerController.getBanners);
router.get("/:id", bannerController.getBanner);

// Protected admin routes
router.post(
  "/",
  auth,
  validate(createBannerSchema),
  invalidateCacheMiddleware('banners'),
  bannerController.createBanner,
);
router.patch(
  "/:id",
  auth,
  validate(updateBannerSchema),
  invalidateCacheMiddleware('banners'),
  bannerController.updateBanner,
);
router.delete("/:id", auth, invalidateCacheMiddleware('banners'), bannerController.deleteBanner);

module.exports = router;
