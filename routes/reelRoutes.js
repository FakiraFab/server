const express = require("express");
const router = express.Router();
const reelController = require("../controllers/reelController");
const validate = require("../middleware/validate");
const { createReelSchema, updateReelSchema } = require("../schemas/reelSchema");
const { auth } = require("../middleware/auth");
const { cache } = require("../middleware/cache");
const { invalidateCacheMiddleware } = require("../utils/cacheInvalidation");

router.get("/", cache({ prefix: 'reels', ttl: 3600, includeParams: ['page', 'limit', 'isActive'] }), reelController.getReels);
router.get("/active", cache({ prefix: 'reels', suffix: 'active', ttl: 3600 }), reelController.getActiveReels);
router.get("/:id", reelController.getReel);

router.post("/", validate(createReelSchema), invalidateCacheMiddleware('reels'), reelController.createReel);
router.patch("/:id", validate(updateReelSchema), invalidateCacheMiddleware('reels'), reelController.updateReel);
router.patch("/:id/toggle-visibility", invalidateCacheMiddleware('reels'), reelController.toggleReelVisibility);
router.delete("/:id", invalidateCacheMiddleware('reels'), reelController.deleteReel);

module.exports = router;
