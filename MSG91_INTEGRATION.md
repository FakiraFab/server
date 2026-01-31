# MSG91 WhatsApp Integration

This document describes the MSG91 WhatsApp integration for sending automated messages when users make product inquiries.

## Overview

The integration automatically sends a thank you message via WhatsApp whenever a user submits a product inquiry. The message includes:
- Personalized greeting with user's name
- Product details and pricing
- UPI payment information
- Instructions for payment confirmation

## Files Created/Modified

### New Files
- `config/msg91.js` - MSG91 configuration
- `utils/whatsApp.js` - WhatsApp service implementation
- `MSG91_INTEGRATION.md` - This documentation

### Modified Files
- `controllers/inquiryController.js` - Added WhatsApp integration to inquiry creation
- `routes/inquiryRoutes.js` - Added test route for WhatsApp functionality

## Environment Variables

Add the following environment variables to your `.env` file:

```env
# MSG91 Configuration
AuthKey=your_AuthKey_here
MSG91_INTEGRATED_NUMBER=919909252577
MSG91_TEMPLATE_NAME=product_enquiry_thankyou
MSG91_NAMESPACE=988d9f52_3fde_4101_aa3b_e0298511d9d5

# UPI Configuration
UPI_ID=your-upi-id@bank
```

## Configuration

### MSG91 Setup
1. Get your MSG91 Auth Key from the MSG91 dashboard
2. Configure your WhatsApp Business API
3. Create a template with the following variables:
   - `{{1}}` - Customer name
   - `{{2}}` - Product name
   - `{{3}}` - Product price
   - `{{4}}` - UPI ID

### Template Message Format
```
Hello {{1}}, 👋

Thanks a lot for your interest in our product **{{2}}**! 💫
You're going to love it — handcrafted with care and currently priced at just ₹{{3}}.

✨ Key Highlights:
- High-quality materials
- Limited stock available
- Fast shipping available across India

Our sales executive will call you shortly to help with your order and answer any queries.

🟢 *Want to buy it right now?*
You can make an instant payment using the details below:

👉 UPI ID: **{{4}}**
📷 Scan the QR code above for quick payment.

Once the payment is done, just reply to this message with your *payment screenshot* , and we'll prioritize your dispatch. 📦✅

Looking forward to serving you!
```

## API Endpoints

### Create Inquiry (with WhatsApp)
**POST** `/api/inquiries`

Creates a new inquiry and automatically sends a WhatsApp message.

**Request Body:**
```json
{
  "userName": "John Doe",
  "userEmail": "john@example.com",
  "whatsappNumber": "9876543210",
  "buyOption": "Personal",
  "location": "Mumbai, Maharashtra",
  "quantity": 2,
  "productId": "product_id_here",
  "productName": "Designer Saree",
  "productImage": "https://example.com/image.jpg",
  "variant": "Red",
  "message": "Interested in bulk purchase"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "inquiry_id",
    "userName": "John Doe",
    "whatsappNumber": "9876543210",
    // ... other fields
  },
  "message": "Inquiry created successfully. You will receive a WhatsApp message shortly."
}
```

### Test WhatsApp Integration
**POST** `/api/inquiries/test-whatsapp`

Tests the WhatsApp integration with a provided phone number.

**Request Body:**
```json
{
  "phoneNumber": "9876543210"
}
```

**Response:**
```json
{
  "success": true,
  "message": "WhatsApp test completed",
  "data": {
    "success": true,
    "message": "MSG91 configuration is working correctly",
    "result": {
      // MSG91 API response
    }
  }
}
```

## Features

### Phone Number Formatting
The service automatically formats phone numbers for MSG91 API:
- Removes all non-digit characters
- Adds country code (91) if missing
- Handles various input formats

### Error Handling
- Graceful handling of MSG91 API errors
- Inquiry creation continues even if WhatsApp fails
- Comprehensive error logging

### Price Formatting
- Automatically formats prices with Indian Rupee symbol
- Uses variant-specific pricing when available
- Falls back to base product price

### Configuration Validation
- Validates MSG91 configuration on startup
- Warns about missing environment variables
- Provides helpful error messages

## Usage Examples

### Basic Inquiry Creation
```javascript
const response = await fetch('/api/inquiries', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userName: "Jane Doe",
    userEmail: "jane@example.com",
    whatsappNumber: "9876543210",
    buyOption: "Personal",
    location: "Delhi",
    quantity: 1,
    productId: "64f8a1b2c3d4e5f6a7b8c9d0",
    productName: "Silk Saree",
    variant: "Blue"
  })
});
```

### Testing WhatsApp Integration
```javascript
const testResponse = await fetch('/api/inquiries/test-whatsapp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    phoneNumber: "9876543210"
  })
});
```

## Troubleshooting

### Common Issues

1. **AuthKey not configured**
   - Solution: Add your MSG91 auth key to environment variables

2. **Phone number format issues**
   - Solution: The service automatically formats numbers, but ensure input is valid

3. **Template not found**
   - Solution: Verify template name and namespace in MSG91 dashboard

4. **API rate limits**
   - Solution: MSG91 has rate limits; check your plan and usage

### Debug Mode
Enable debug logging by setting:
```env
NODE_ENV=development
```

### Testing
Use the test endpoint to verify your configuration:
```bash
curl -X POST http://localhost:3000/api/inquiries/test-whatsapp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "9876543210"}'
```

## Security Considerations

1. **Environment Variables**: Never commit auth keys to version control
2. **Phone Number Validation**: Input is validated before processing
3. **Error Handling**: Sensitive information is not exposed in error messages
4. **Rate Limiting**: Consider implementing rate limiting for inquiry creation

## Future Enhancements

1. **Message Templates**: Support for multiple message templates
2. **Bulk Messaging**: Send messages to multiple recipients
3. **Message Status Tracking**: Track delivery and read status
4. **Custom Variables**: Support for additional template variables
5. **Retry Logic**: Automatic retry for failed messages

## Support

For issues related to:
- MSG91 API: Contact MSG91 support
- Integration: Check the application logs
- Configuration: Verify environment variables 