# Fakira Fab E-commerce API - Phase Two Implementation

## Overview
Complete e-commerce backend implementation with authentication, cart, wishlist, orders, and Razorpay payment integration.

## Table of Contents
- [Setup](#setup)
- [Environment Variables](#environment-variables)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
  - [Auth Endpoints](#auth-endpoints)
  - [Address Endpoints](#address-endpoints)
  - [Cart Endpoints](#cart-endpoints)
  - [Wishlist Endpoints](#wishlist-endpoints)
  - [Order Endpoints](#order-endpoints)
  - [Webhook Endpoints](#webhook-endpoints)

## Setup

### Installation
```bash
npm install
```

### Required Dependencies
- bcryptjs - Password hashing
- jsonwebtoken - JWT authentication
- razorpay - Payment gateway
- nodemailer - Email service
- mongoose - MongoDB ORM
- express - Web framework
- joi - Validation

### Environment Setup
Copy `.env.example` to `.env` and update with your credentials:
```bash
cp .env.example .env
```

### Start Server
```bash
# Development
npm run dev

# Production
npm start
```

## Environment Variables

See `.env.example` for all required environment variables.

Key variables:
- `JWT_SECRET` - Secret key for access tokens
- `JWT_REFRESH_SECRET` - Secret key for refresh tokens
- `RAZORPAY_KEY_ID` - Razorpay API key ID
- `RAZORPAY_KEY_SECRET` - Razorpay API secret
- `RAZORPAY_WEBHOOK_SECRET` - Razorpay webhook secret
- `SMTP_*` - Email configuration
- `FRONTEND_URL` - Frontend URL for email links

## Authentication

Most endpoints require authentication via Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

Admin endpoints require admin role.

## API Endpoints

### Auth Endpoints

#### POST /api/auth/signup
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123",
  "name": "John Doe",
  "phone": "9876543210"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "...",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user",
      "isVerified": false
    },
    "tokens": {
      "accessToken": "...",
      "refreshToken": "..."
    }
  }
}
```

#### POST /api/auth/login
Login existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

#### POST /api/auth/refresh
Refresh access token.

**Request Body:**
```json
{
  "refreshToken": "..."
}
```

#### POST /api/auth/forgot-password
Request password reset.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

#### POST /api/auth/reset-password
Reset password with token.

**Request Body:**
```json
{
  "token": "...",
  "password": "NewPassword123",
  "confirmPassword": "NewPassword123"
}
```

#### POST /api/auth/verify-email
Verify email address.

**Request Body:**
```json
{
  "token": "..."
}
```

#### POST /api/auth/logout
Logout user (requires auth).

**Request Body:**
```json
{
  "refreshToken": "..."
}
```

#### GET /api/auth/me
Get current user profile (requires auth).

#### POST /api/auth/otp/send
Send OTP to phone.

**Request Body:**
```json
{
  "phone": "9876543210"
}
```

#### POST /api/auth/otp/verify
Verify OTP and login.

**Request Body:**
```json
{
  "phone": "9876543210",
  "otp": "123456"
}
```

### Address Endpoints

All address endpoints require authentication.

#### GET /api/addresses
Get all user addresses.

#### POST /api/addresses
Create new address.

**Request Body:**
```json
{
  "fullName": "John Doe",
  "phone": "9876543210",
  "addressLine1": "123 Main St",
  "addressLine2": "Apt 4B",
  "city": "Mumbai",
  "state": "Maharashtra",
  "country": "India",
  "postalCode": "400001",
  "addressType": "home",
  "isDefault": true
}
```

#### GET /api/addresses/:id
Get specific address.

#### PATCH /api/addresses/:id
Update address.

#### DELETE /api/addresses/:id
Delete address.

#### PATCH /api/addresses/:id/set-default
Set address as default.

### Cart Endpoints

All cart endpoints require authentication.

#### GET /api/cart
Get user's cart.

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "totalPrice": 5000,
    "totalItems": 3
  }
}
```

#### POST /api/cart
Add item to cart.

**Request Body:**
```json
{
  "productId": "...",
  "quantity": 2,
  "selectedOption": {
    "color": "Red"
  }
}
```

#### PATCH /api/cart/items/:productId
Update cart item quantity.

**Request Body:**
```json
{
  "quantity": 3,
  "selectedOption": {
    "color": "Red"
  }
}
```

#### DELETE /api/cart/items/:productId
Remove item from cart.

#### DELETE /api/cart
Clear entire cart.

### Wishlist Endpoints

All wishlist endpoints require authentication.

#### GET /api/wishlist
Get user's wishlist.

#### POST /api/wishlist
Add product to wishlist.

**Request Body:**
```json
{
  "productId": "..."
}
```

#### DELETE /api/wishlist/:productId
Remove product from wishlist.

#### POST /api/wishlist/:productId/move-to-cart
Move product from wishlist to cart.

### Order Endpoints

#### POST /api/orders/create
Create new order (requires auth).

**Request Body:**
```json
{
  "shippingAddressId": "...",
  "billingAddressId": "...",
  "paymentMethod": "razorpay",
  "couponCode": "SAVE10"
}
```

**Response (Razorpay):**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "...",
      "orderNumber": "ORD-1234567890-1234",
      "totalAmount": 5590,
      "currency": "INR"
    },
    "razorpay": {
      "orderId": "order_...",
      "amount": 559000,
      "currency": "INR",
      "keyId": "rzp_test_..."
    }
  }
}
```

#### POST /api/orders/verify-payment
Verify Razorpay payment (requires auth).

**Request Body:**
```json
{
  "razorpay_order_id": "order_...",
  "razorpay_payment_id": "pay_...",
  "razorpay_signature": "..."
}
```

#### GET /api/orders
Get user's orders (requires auth).

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `status` - Filter by order status

#### GET /api/orders/:id
Get specific order (requires auth).

#### POST /api/orders/:id/cancel
Cancel order (requires auth).

**Request Body:**
```json
{
  "reason": "Changed my mind about the purchase"
}
```

#### GET /api/orders/admin/all
Get all orders - admin only (requires auth + admin).

**Query Parameters:**
- `page` - Page number
- `limit` - Items per page
- `status` - Filter by order status
- `paymentStatus` - Filter by payment status
- `orderNumber` - Search by order number
- `startDate` - Filter by start date
- `endDate` - Filter by end date

#### PATCH /api/orders/admin/:id/status
Update order status - admin only (requires auth + admin).

**Request Body:**
```json
{
  "status": "shipped",
  "note": "Order dispatched",
  "trackingNumber": "TRK123456",
  "shippingProvider": "BlueDart"
}
```

### Webhook Endpoints

#### POST /api/orders/webhooks/razorpay
Razorpay webhook handler (no auth, signature verified).

Handles events:
- `payment.captured` - Payment successful
- `payment.failed` - Payment failed
- `refund.created` - Refund processed

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Success message",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message"
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "Success message",
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "pages": 10,
    "limit": 10
  }
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## Order Status Flow

1. **pending** - Order created, awaiting payment
2. **confirmed** - Payment received
3. **processing** - Order being prepared
4. **shipped** - Order dispatched
5. **delivered** - Order delivered
6. **cancelled** - Order cancelled
7. **returned** - Order returned

## Payment Status Flow

1. **pending** - Payment not yet received
2. **paid** - Payment successful
3. **failed** - Payment failed
4. **refunded** - Payment refunded

## Security Notes

- All passwords hashed with bcrypt (12 rounds)
- JWT tokens for authentication
- Razorpay signature verification on payments and webhooks
- Admin role required for admin endpoints
- HTTPS required in production
- Rate limiting recommended on auth endpoints
- Never log sensitive data (passwords, tokens, card details)

## Testing

### Test User Registration
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234",
    "name": "Test User",
    "phone": "9876543210"
  }'
```

### Test Order Creation
```bash
curl -X POST http://localhost:5000/api/orders/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "shippingAddressId": "ADDRESS_ID",
    "paymentMethod": "razorpay"
  }'
```

## Support

For issues or questions, please contact the development team or create an issue in the repository.

## License

Proprietary - All rights reserved
