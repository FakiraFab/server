Phase Two — Backend Implementation Plan (Auth, Cart, Orders, Payments)

Last updated: 2026-01-20

Goal
- Move from enquiry-only backend to full order-capable API: user auth, persistent carts/wishlists, checkout with Razorpay, delivery/address management, admin order workflows, and transactional notifications.

Priority & MVP definition
- MVP (minimum to accept payments & create orders):
  1. User Authentication (signup, login with JWT, refresh tokens, password reset).
  2. Persistent Cart endpoints (user-scoped CRUD for cart items).
 3. Checkout endpoints + Razorpay order creation and verification.
 4. Order model and status lifecycle (pending, paid, shipped, cancelled).
 5. Address management API for shipping addresses.

Phase plan (milestones)
- Sprint 1 — Auth & User model (2 weeks)
  - Models: `User` with hashed password (bcrypt/argon2), `Role` if needed.
  - Endpoints: POST `/api/auth/signup`, POST `/api/auth/login`, POST `/api/auth/refresh`, POST `/api/auth/forgot`, POST `/api/auth/reset`.
  - Middleware: strengthen `auth.js` to verify JWT, add `requireAuth` and `requireAdmin` helpers.
  - Tests: unit tests for signup/login and password reset flows.

- Sprint 2 — Cart & Wishlist (1.5 weeks)
  - Models: `Cart` (or `cart_items`) tied to `user_id` (nullable for guests), `Wishlist`.
  - Endpoints: GET/POST/PUT/DELETE `/api/cart`, GET/POST/DELETE `/api/wishlist`.
  - Behavior: merge guest cart into user cart at login, validate stock and prices on add/update.

- Sprint 3 — Orders & Razorpay Payments (2 weeks)
  - Models: `Order`, `OrderItem`, `Payment` record.
  - Endpoints:
    - POST `/api/orders/create` — create provisional order, calculate totals, create Razorpay order and return `order_id`.
    - POST `/api/orders/verify` — verify payment response from frontend (signature verification) and finalize order.
    - POST `/api/payments/webhook` — secure webhook to receive async events (capture, failed).
  - Security: secure webhook endpoint, verify Razorpay signature on both frontend confirm and webhook.

- Sprint 4 — Delivery & Admin Order Workflows (1.5 weeks)
  - Models: `Address`, shipping metadata, `Shipment`/tracking optional.
  - Endpoints: GET/PUT `/api/users/:id/addresses`, GET `/api/admin/orders`, PATCH `/api/admin/orders/:id/status`.
  - Notifications: trigger emails/SMS on order creation and on status change.

- Sprint 5 — Polish, Tests, CI & Monitoring (1 week)
  - End-to-end tests for auth → cart → checkout.
  - Add OpenAPI spec, CI pipeline (GitHub Actions), and production-ready env/secrets guidance.
  - Add monitoring (Sentry) and improved logging for payment flows.

Backend data models (recommended)
- `users`:
  - id, email, password_hash, name, phone, roles, created_at, updated_at
- `addresses`:
  - id, user_id, label, street, city, state, country, postal_code, phone, is_default
- `products`:
  - (existing) sku, name, price, stock, attrs
- `cart_items`:
  - id, user_id (nullable), product_id, qty, price_at_add, metadata
- `wishlists`:
  - id, user_id, product_id, created_at
- `orders` and `order_items`:
  - orders: id, user_id, amount, currency, status, payment_id, shipping_address_id, created_at
  - order_items: order_id, product_id, qty, unit_price
- `payments`:
  - id, order_id, provider, provider_payment_id, status, payload, created_at

API endpoints (minimum)
- Auth: POST `/api/auth/signup`, POST `/api/auth/login`, POST `/api/auth/refresh`, POST `/api/auth/forgot`, POST `/api/auth/reset`.
- Cart: GET/POST/PUT/DELETE `/api/cart` (user-scoped).
- Wishlist: GET/POST/DELETE `/api/wishlist`.
- Orders: POST `/api/orders/create`, POST `/api/orders/verify`, GET `/api/orders/:id`, GET `/api/orders` (user), GET `/api/admin/orders`.
- Payments: POST `/api/payments/razorpay/create-order` (could be same as `/api/orders/create`), POST `/api/payments/razorpay/webhook`.

Razorpay integration notes
- Create a Razorpay order server-side with amount in paise and the correct currency; return `order_id` to frontend.
- Frontend opens Razorpay checkout with `order_id`; on success, send Razorpay payment payload to server for signature verification (HMAC-SHA256).
- Server verifies signature using `RAZORPAY_KEY_SECRET` and updates order/payment records.
- Implement webhook endpoint to receive `payment.captured`, `payment.failed` events and reconcile state.

Security & operations
- Hash passwords (bcrypt/argon2) and store salts securely.
- Protect auth endpoints with rate-limiting and input validation.
- Validate and re-check product pricing/stock on order create to prevent client-side tampering.
- Use HTTPS in production; secure webhook URL and rotate keys as needed.

Estimates & timeline (MVP rollout)
- Rough estimate for 1 backend + 1 frontend developer: 6–8 weeks to reach MVP. Timeline depends on DB migrations and frontend integration parallelism.

Next immediate backend tasks I can do now
1. Inspect `auth.js` to confirm current auth capabilities and list gaps.
2. Scaffold `User`, `Address`, `CartItem`, `Order`, `OrderItem`, `Payment` models and add simple migrations.
3. Create OpenAPI draft for the endpoints above and minimal endpoint stubs for auth and `/api/orders/create`.

Environment & secrets (required)
- `DATABASE_URL` or DB config
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (or transactional provider keys)
- `CLOUDINARY_URL`
- `MSG91_API_KEY`
