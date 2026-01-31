Fakira-Fab — Feature Status (Server)

Last audited: 2026-01-20

Summary
- Purpose: JSON REST API powering the public storefront, admin operations, content (blogs, reels), banners, product/catalog management and enquiry/workshop lead capture. Current sales flow: enquiries/registrations (no direct checkout).

Completed (backend)
- HTTP server foundation
  - `server.js`: Express app, CORS, JSON body parser, central request logging, global error handler and graceful process handling for uncaught exceptions & unhandled rejections.
- Database & configuration
  - `config/db.js` connection helper and environment-driven config via `dotenv`.
  - `config/cloudinary.js`, `config/msg91.js` for media and SMS integrations.
- Core models & schemas
  - Data models in `models/`: `product`, `category`, `subcategory`, `banner`, `blog`, `reel`, `inquiry`, `workshop`, `workshopRegistration`.
  - Validation schemas in `schemas/` corresponding to those models.
- Routes & controllers (resource-based)
  - Routes in `routes/` and matching controllers in `controllers/` for products, categories, subcategories, banners, reels, blogs, inquiries and workshop registrations.
  - `adminRoutes` and `adminController` present (admin-related actions likely for content/product management).
- Middleware & utils
  - Middleware: `auth.js` (exists but review needed for full auth), `validate.js`, `validateParams.js`, `errorHandler.js`.
  - Utilities: `utils/logger.js`, `responseHandler.js`, `catchAsync.js`, `whatsApp.js`, `errorMessages.js`.
- Third-party integrations
  - Cloudinary integration present for media uploads.
  - `msg91` config present for SMS (OTP/notifications potential).
- Misc
  - `seed-blogs.js` to pre-populate blog data.
  - Logging folder `logs/` with `error.log` present.

Existing API coverage (observed)
- Product & catalog: `/api/products`, category/subcategory endpoints.
- Content & marketing: `/api/banners`, `/api/reels`, `/api/blogs`.
- Lead capture & events: `/api/inquiry`, `/api/workshop`.
- Admin routes: `/api/admin` (functionality to inspect in controller).

Missing / Phase Two scope (high-level)
- Authentication & user accounts (signup/login/password reset/refresh tokens).
- Persistent carts & wishlist endpoints and models.
- Orders & payments (Razorpay integration), payments verification and webhook handling.
- Addresses & delivery/shipping models and endpoints.
- Order lifecycle + admin order management (list, update status, tracking ids).
- Transactional email/SMS (order confirmations, receipts) hooks beyond Msg91 config.
- Security: rate-limiting, CSRF protections where relevant, stronger auth middleware, password hashing if not present.
- Tests, CI/CD, API docs (OpenAPI) and monitoring (Sentry / logs aggregation).

Notes & assumptions
- Repo contains `auth.js` middleware but no user model or auth routes were obvious in the top-level structure — verify `auth.js` to confirm whether it provides full JWT/session flow or only guards admin endpoints.
- No `orders`, `cart`, `user`, `address` models found in `models/` — Phase Two will need those.
- `msg91` and `cloudinary` indicate readiness for notifications and media workflows but the transactional/email system (SMTP) is not obvious.

Next immediate backend steps (short)
1. Confirm `auth.js` implementation and whether an existing `users` model/stub exists in other folders.
2. Add `users`, `addresses`, `carts`/`cart_items`, `orders`/`order_items`, `payments` models and basic migrations.
3. Scaffold OpenAPI spec for new Phase Two endpoints and add endpoint stubs for auth, cart, orders, and payments.

Environment & secrets (suggested)
- `DATABASE_URL` / DB connection params
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- `CLOUDINARY_URL` (or cloud name/api key/secret)
- `MSG91_API_KEY`
