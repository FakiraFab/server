const nodemailer = require('nodemailer');
const logger = require('./logger');

// Create transporter with SMTP configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML body
 * @param {string} options.text - Plain text body (optional)
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Fakira Fab'}" <${process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text: text || '' // Use provided text or empty string (HTML will be used for display)
    };

    const info = await transporter.sendMail(mailOptions);

    logger.info('Email sent successfully', {
      to,
      subject,
      messageId: info.messageId
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Email sending failed', {
      to,
      subject,
      error: error.message
    });
    throw error;
  }
};

/**
 * Send order confirmation email
 * @param {Object} order - Order object
 * @param {Object} user - User object
 */
const sendOrderConfirmationEmail = async (order, user) => {
  const subject = `Order Confirmation - ${order.orderNumber}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .order-details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 8px; border-bottom: 1px solid #ddd; }
        .total { font-weight: bold; font-size: 18px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Confirmed! 🎉</h1>
        </div>
        <div class="content">
          <p>Hi ${user.name},</p>
          <p>Thank you for your order! Your order has been confirmed and will be processed soon.</p>
          
          <div class="order-details">
            <h3>Order Details</h3>
            <table>
              <tr>
                <td>Order Number:</td>
                <td><strong>${order.orderNumber}</strong></td>
              </tr>
              <tr>
                <td>Order Date:</td>
                <td>${new Date(order.createdAt).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td>Payment Method:</td>
                <td>${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</td>
              </tr>
              <tr>
                <td>Payment Status:</td>
                <td>${order.paymentStatus}</td>
              </tr>
            </table>
            
            <h4>Items Ordered:</h4>
            <table>
              ${order.items.map(item => `
                <tr>
                  <td>${item.productName}</td>
                  <td>Qty: ${item.quantity}</td>
                  <td>₹${item.totalPrice}</td>
                </tr>
              `).join('')}
            </table>
            
            <table style="margin-top: 15px;">
              <tr>
                <td>Subtotal:</td>
                <td>₹${order.subtotal}</td>
              </tr>
              <tr>
                <td>Shipping:</td>
                <td>₹${order.shippingCharges}</td>
              </tr>
              <tr>
                <td>Tax (GST):</td>
                <td>₹${order.tax}</td>
              </tr>
              <tr class="total">
                <td>Total:</td>
                <td>₹${order.totalAmount}</td>
              </tr>
            </table>
            
            <h4>Shipping Address:</h4>
            <p>
              ${order.shippingAddress.fullName}<br>
              ${order.shippingAddress.addressLine1}<br>
              ${order.shippingAddress.addressLine2 ? order.shippingAddress.addressLine2 + '<br>' : ''}
              ${order.shippingAddress.city}, ${order.shippingAddress.state}<br>
              ${order.shippingAddress.country} - ${order.shippingAddress.postalCode}<br>
              Phone: ${order.shippingAddress.phone}
            </p>
          </div>
          
          <p>You can track your order status by logging into your account.</p>
          <p>If you have any questions, please don't hesitate to contact us.</p>
        </div>
        <div class="footer">
          <p>Thank you for shopping with Fakira Fab!</p>
          <p>© ${new Date().getFullYear()} Fakira Fab. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: user.email,
    subject,
    html
  });
};

/**
 * Send password reset email
 * @param {Object} user - User object
 * @param {string} resetToken - Password reset token
 */
const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const subject = 'Password Reset Request';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hi ${user.name},</p>
          <p>You requested to reset your password. Click the button below to reset it:</p>
          <a href="${resetUrl}" class="button">Reset Password</a>
          <p>This link will expire in 10 minutes.</p>
          <p>If you didn't request a password reset, please ignore this email.</p>
          <p>For security reasons, this link can only be used once.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Fakira Fab. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: user.email,
    subject,
    html
  });
};

/**
 * Send email verification email
 * @param {Object} user - User object
 * @param {string} verificationToken - Email verification token
 */
const sendEmailVerificationEmail = async (user, verificationToken) => {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
  const subject = 'Verify Your Email Address';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Fakira Fab! 👋</h1>
        </div>
        <div class="content">
          <p>Hi ${user.name},</p>
          <p>Thank you for registering with Fakira Fab! Please verify your email address to activate your account.</p>
          <a href="${verifyUrl}" class="button">Verify Email</a>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Fakira Fab. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: user.email,
    subject,
    html
  });
};

module.exports = {
  sendEmail,
  sendOrderConfirmationEmail,
  sendPasswordResetEmail,
  sendEmailVerificationEmail
};
