# Shiprocket Integration Documentation

## Overview

This document describes the Shiprocket delivery management integration implemented in the backend system. The integration is designed to work seamlessly with existing order, Razorpay payment, and COD flows without breaking any existing functionality.

## Features

### 1. Automatic Shipment Creation
- **Razorpay Orders**: Shipment is created automatically AFTER payment verification and order confirmation
- **COD Orders**: Shipment is created automatically AFTER order is confirmed
- **Non-blocking**: Shiprocket failures never break the user order flow - failures are logged only

### 2. Shipment Tracking
- Orders are tracked via Shiprocket AWB (Airway Bill) codes
- Shipment status updates are webhook-driven (no manual intervention needed)
- Real-time status synchronization between Shiprocket and internal order system

### 3. Shipment Cancellation
- Automatic cancellation in Shiprocket when user cancels order
- Handles edge cases where shipment doesn't exist yet

### 4. Admin Controls
- Admin CANNOT manually mark orders as "shipped" or "delivered"
- These statuses are controlled exclusively by Shiprocket webhook
- This ensures data integrity and prevents status conflicts

## Environment Variables

Add the following to your `.env` file:

```env
SHIPROCKET_EMAIL=your-shiprocket-email@example.com
SHIPROCKET_PASSWORD=your-shiprocket-password
SHIPROCKET_API_URL=https://apiv2.shiprocket.in/v1/external
SHIPROCKET_PICKUP_LOCATION=Primary
```

**Note:** `SHIPROCKET_PICKUP_LOCATION` should match the pickup location name configured in your Shiprocket dashboard.

## Database Schema Changes

### Order Model - New `shipping` Field

```javascript
shipping: {
  provider: String,              // Default: "shiprocket"
  shiprocketOrderId: String,     // Shiprocket order ID
  shipmentId: String,            // Shiprocket shipment ID
  awbCode: String,               // AWB tracking code
  courierName: String,           // Courier company name
  courierCompanyId: Number,      // Courier company ID
  pickupScheduled: Boolean,      // Pickup status
  status: String                 // Shipment status
}
```

#### Shipping Status Values:
- `not_created` - Shipment not yet created in Shiprocket
- `created` - Order created in Shiprocket, awaiting AWB
- `awb_assigned` - AWB assigned to shipment
- `picked` - Package picked up by courier
- `in_transit` - Package in transit
- `delivered` - Package delivered
- `rto` - Return to origin
- `cancelled` - Shipment cancelled

## API Endpoints

### Webhook Endpoint

**POST** `/api/orders/webhooks/shiprocket`

This endpoint receives status updates from Shiprocket. Configure this URL in your Shiprocket dashboard.

**Payload Example:**
```json
{
  "awb": "1234567890",
  "order_id": "ORD-1234567890-1234",
  "current_status": "DELIVERED",
  "courier_name": "Delhivery"
}
```

**Status Mapping:**
- `PICKED UP` / `PICKUP SCHEDULED` → Order: `processing`, Shipping: `picked`
- `IN TRANSIT` / `OUT FOR DELIVERY` → Order: `shipped`, Shipping: `in_transit`
- `DELIVERED` → Order: `delivered`, Shipping: `delivered`
- `RTO` / `RTO DELIVERED` → Order: `returned`, Shipping: `rto`
- `CANCELLED` → Order: `cancelled`, Shipping: `cancelled`

## Order Flow

### Razorpay Payment Flow

1. User creates order → Order created with `status: pending`
2. User completes payment → `verifyPayment` API called
3. Payment verified → Order updated to `status: confirmed`
4. **Shiprocket shipment created automatically** (non-blocking)
5. If Shiprocket succeeds:
   - `order.shipping.shipmentId` set
   - `order.shipping.awbCode` set
   - `order.shipping.status` = `awb_assigned`
6. If Shiprocket fails:
   - Error logged, user order flow continues normally
   - `order.shipping.status` remains `not_created`

### COD Flow

1. User creates COD order → Order immediately confirmed
2. **Shiprocket shipment created automatically** (non-blocking)
3. Same behavior as Razorpay flow for shipment creation

### Order Cancellation Flow

1. User cancels order → `cancelOrder` API called
2. Order marked as cancelled
3. If `order.shipping.shipmentId` exists:
   - Shiprocket cancellation API called
   - If successful: `order.shipping.status` = `cancelled`
   - If fails: Error logged, cancellation continues

## Service Methods

### ShiprocketService

Located at: `/services/shiprocket.service.js`

#### `getToken()`
- Manages authentication with Shiprocket API
- Caches token for reuse (10-day expiry)
- Automatically refreshes when needed

#### `createShipment(order)`
- Creates order in Shiprocket
- Assigns AWB (Airway Bill)
- Updates order with shipment details
- Returns: `{ success, shiprocketOrderId, shipmentId, awbCode }`

#### `cancelShipment(order)`
- Cancels shipment in Shiprocket
- Updates order shipping status
- Returns: `{ success, message }`

#### `trackShipment(shipmentId)`
- Fetches tracking details from Shiprocket
- Returns: Tracking data object

## Error Handling

### Principles
1. **Never block user flow**: Shiprocket errors are logged but never thrown to users
2. **Graceful degradation**: Orders proceed normally even if Shiprocket fails
3. **Comprehensive logging**: All Shiprocket operations logged for debugging

### Example Error Handling

```javascript
try {
  await shiprocketService.createShipment(order);
  logger.info('Shiprocket shipment created', { orderNumber: order.orderNumber });
} catch (shiprocketError) {
  logger.error('Failed to create Shiprocket shipment (non-blocking)', {
    orderNumber: order.orderNumber,
    error: shiprocketError.message
  });
  // Continue without throwing - user order flow unaffected
}
```

## Admin Restrictions

### Manual Status Updates

The following restrictions are in place for admin order status updates:

**Restricted Statuses:**
- ❌ `shipped` - Cannot be set manually
- ❌ `delivered` - Cannot be set manually

**Allowed Statuses:**
- ✅ `pending`
- ✅ `confirmed`
- ✅ `processing`
- ✅ `cancelled`
- ✅ `returned`

When admin tries to manually set `shipped` or `delivered`:
```json
{
  "error": "Cannot manually set order to shipped or delivered. These statuses are controlled by Shiprocket webhook."
}
```

## Testing

### Manual Testing Checklist

1. **Razorpay Flow:**
   - [ ] Create order with Razorpay payment method
   - [ ] Complete payment
   - [ ] Verify shipment created in Shiprocket
   - [ ] Check order.shipping fields populated

2. **COD Flow:**
   - [ ] Create order with COD payment method
   - [ ] Verify shipment created immediately
   - [ ] Check order.shipping fields populated

3. **Cancellation:**
   - [ ] Create and cancel order
   - [ ] Verify Shiprocket shipment cancelled
   - [ ] Check order.shipping.status = 'cancelled'

4. **Webhook:**
   - [ ] Trigger test webhook from Shiprocket
   - [ ] Verify order status updated correctly
   - [ ] Verify shipping status updated

5. **Error Scenarios:**
   - [ ] Test with invalid Shiprocket credentials
   - [ ] Verify order still proceeds normally
   - [ ] Check logs for error messages

6. **Admin Restrictions:**
   - [ ] Try to manually set order to "shipped"
   - [ ] Verify error returned
   - [ ] Try to manually set order to "delivered"
   - [ ] Verify error returned

## Shiprocket Dashboard Configuration

1. Login to Shiprocket dashboard
2. Go to Settings → API
3. Set webhook URL: `https://your-domain.com/api/orders/webhooks/shiprocket`
4. Enable webhook for status updates
5. Save configuration

## Troubleshooting

### Shipment Not Created

**Symptoms:** Order confirmed but no `shipping.shipmentId`

**Possible Causes:**
1. Invalid Shiprocket credentials
2. Network issues
3. Invalid shipping address
4. Insufficient pickup location setup in Shiprocket

**Solution:**
- Check logs for error messages
- Verify Shiprocket credentials in `.env`
- Ensure pickup location configured in Shiprocket dashboard
- Manually create shipment from admin panel if needed

### Webhook Not Working

**Symptoms:** Order status not updating from Shiprocket

**Possible Causes:**
1. Webhook URL not configured in Shiprocket
2. Webhook endpoint not accessible
3. AWB/Order ID mismatch

**Solution:**
- Verify webhook URL in Shiprocket dashboard
- Test webhook endpoint with curl/Postman
- Check server logs for incoming webhook requests

### AWB Not Assigned

**Symptoms:** Shipment created but no AWB code

**Possible Causes:**
1. Courier not available for pincode
2. Insufficient courier account balance
3. API rate limiting

**Solution:**
- Check Shiprocket dashboard for shipment status
- Verify courier serviceability for destination pincode
- Check account balance in Shiprocket

## Security Considerations

1. **Credentials:** Store Shiprocket credentials in environment variables
2. **Webhook Validation:** Consider adding signature validation for webhooks in production
3. **Rate Limiting:** Webhook endpoints currently don't have rate limiting. For production, consider:
   - IP whitelisting for Shiprocket IPs
   - Request signature verification
   - General rate limiting at infrastructure level
4. **Logging:** Ensure sensitive data not logged (passwords, tokens)

## Dependencies

- `axios`: ^1.7.9 - HTTP client for API calls
- All existing dependencies remain unchanged

## Backward Compatibility

✅ **Fully Backward Compatible**
- Existing order flows work unchanged
- No breaking changes to API contracts
- New fields are optional
- Graceful degradation if Shiprocket unavailable

## Future Enhancements

1. Retry mechanism for failed Shiprocket operations
2. Bulk shipment creation for admin
3. Custom courier selection
4. Estimated delivery date calculation
5. Shipment tracking page for customers
6. Email/SMS notifications on status updates
7. Shiprocket webhook signature verification
8. Rate limiting for Shiprocket API calls

## Support

For issues or questions:
1. Check logs in application logs
2. Review Shiprocket API documentation
3. Contact Shiprocket support for API-related issues
