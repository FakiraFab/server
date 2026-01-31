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

router.post("/", validate(createReelSchema), reelController.createReel, invalidateCacheMiddleware('reels'));
router.patch("/:id", validate(updateReelSchema), reelController.updateReel, invalidateCacheMiddleware('reels'));
router.patch("/:id/toggle-visibility", reelController.toggleReelVisibility, invalidateCacheMiddleware('reels'));
router.delete("/:id", reelController.deleteReel, invalidateCacheMiddleware('reels'));

module.exports = router;
