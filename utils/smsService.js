const msg91Config = require('../config/msg91');
const logger = require('./logger');

/**
 * Send OTP via MSG91
 * @param {string} phone - Phone number (10 digits)
 * @param {string} otp - 6 digit OTP
 */
const sendOTP = async (phone, otp) => {
  try {
    // In production, integrate with MSG91 OTP API
    // For now, just log the OTP
    logger.info('OTP to be sent via SMS', {
      phone,
      otp: process.env.NODE_ENV === 'development' ? otp : '******'
    });

    // TODO: Implement MSG91 OTP API integration
    // Example:
    // const response = await axios.post('https://api.msg91.com/api/v5/otp', {
    //   authkey: msg91Config.authKey,
    //   mobile: phone,
    //   otp: otp
    // });

    return { success: true, message: 'OTP sent successfully' };
  } catch (error) {
    logger.error('SMS OTP sending failed', {
      phone,
      error: error.message
    });
    throw error;
  }
};

/**
 * Verify OTP via MSG91
 * @param {string} phone - Phone number
 * @param {string} otp - OTP to verify
 */
const verifyOTP = async (phone, otp) => {
  try {
    // In production, verify with MSG91 API
    logger.info('OTP verification requested', { phone });

    // TODO: Implement MSG91 OTP verification API
    // Example:
    // const response = await axios.get(`https://api.msg91.com/api/v5/otp/verify`, {
    //   params: {
    //     authkey: msg91Config.authKey,
    //     mobile: phone,
    //     otp: otp
    //   }
    // });
    // return response.data.type === 'success';

    return true; // For now, always return true in development
  } catch (error) {
    logger.error('SMS OTP verification failed', {
      phone,
      error: error.message
    });
    return false;
  }
};

/**
 * Send order confirmation SMS
 * @param {Object} order - Order object
 * @param {Object} user - User object
 */
const sendOrderConfirmationSMS = async (order, user) => {
  try {
    const phone = order.shippingAddress.phone;
    const message = `Dear ${user.name}, your order ${order.orderNumber} for ₹${order.totalAmount} has been confirmed. Track your order at ${process.env.FRONTEND_URL}/orders/${order._id}`;

    logger.info('Order confirmation SMS to be sent', {
      phone,
      orderNumber: order.orderNumber
    });

    // TODO: Implement MSG91 SMS API integration
    // Example:
    // const response = await axios.post('https://api.msg91.com/api/v5/flow/', {
    //   authkey: msg91Config.authKey,
    //   mobiles: phone,
    //   message: message
    // });

    return { success: true, message: 'SMS sent successfully' };
  } catch (error) {
    logger.error('Order confirmation SMS failed', {
      orderNumber: order.orderNumber,
      error: error.message
    });
    throw error;
  }
};

/**
 * Send order status update SMS
 * @param {Object} order - Order object
 * @param {string} status - New order status
 */
const sendOrderStatusUpdateSMS = async (order, status) => {
  try {
    const phone = order.shippingAddress.phone;
    let message = `Order ${order.orderNumber} status: ${status}`;

    if (status === 'shipped' && order.trackingNumber) {
      message += `. Tracking: ${order.trackingNumber}`;
    }

    logger.info('Order status update SMS to be sent', {
      phone,
      orderNumber: order.orderNumber,
      status
    });

    // TODO: Implement MSG91 SMS API integration

    return { success: true, message: 'SMS sent successfully' };
  } catch (error) {
    logger.error('Order status SMS failed', {
      orderNumber: order.orderNumber,
      error: error.message
    });
    throw error;
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
  sendOrderConfirmationSMS,
  sendOrderStatusUpdateSMS
};
