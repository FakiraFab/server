const axios = require('axios');
const logger = require('../utils/logger');

class ShiprocketService {
  constructor() {
    this.baseURL = process.env.SHIPROCKET_API_URL || 'https://apiv2.shiprocket.in/v1/external';
    this.email = process.env.SHIPROCKET_EMAIL;
    this.password = process.env.SHIPROCKET_PASSWORD;
    this.token = null;
    this.tokenExpiry = null;
  }

  /**
   * Get authentication token (login and reuse)
   */
  async getToken() {
    try {
      // Return cached token if still valid (with 5 min buffer)
      if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry - 5 * 60 * 1000) {
        return this.token;
      }

      // Login to get new token
      const response = await axios.post(`${this.baseURL}/auth/login`, {
        email: this.email,
        password: this.password
      });

      this.token = response.data.token;
      // Shiprocket tokens typically expire in 10 days, set expiry
      this.tokenExpiry = Date.now() + 10 * 24 * 60 * 60 * 1000;

      logger.info('Shiprocket token obtained successfully');
      return this.token;
    } catch (error) {
      logger.error('Failed to get Shiprocket token', {
        error: error.message,
        response: error.response?.data
      });
      throw error;
    }
  }

  /**
   * Create shipment for an order
   * @param {Object} order - Order object from database
   * @returns {Object} Shipment details
   */
  async createShipment(order) {
    try {
      const token = await this.getToken();

      // Prepare order items for Shiprocket
      const orderItems = order.items.map(item => ({
        name: item.productName,
        sku: item.productId?.toString() || 'SKU-DEFAULT',
        units: item.quantity,
        selling_price: item.unitPrice,
        discount: 0,
        tax: 0,
        hsn: 0
      }));

      // Calculate dimensions and weight (defaults if not available)
      const totalWeight = order.items.reduce((sum, item) => sum + (item.quantity * 0.5), 0); // Default 0.5 kg per item

      // Prepare Shiprocket order payload
      const payload = {
        order_id: order.orderNumber,
        order_date: order.createdAt.toISOString().split('T')[0],
        pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary', // Configurable pickup location
        channel_id: '',
        comment: `Order ${order.orderNumber}`,
        billing_customer_name: order.billingAddress.fullName,
        billing_last_name: '',
        billing_address: order.billingAddress.addressLine1,
        billing_address_2: order.billingAddress.addressLine2 || '',
        billing_city: order.billingAddress.city,
        billing_pincode: order.billingAddress.postalCode,
        billing_state: order.billingAddress.state,
        billing_country: order.billingAddress.country || 'India',
        billing_email: '', // Email not available in address
        billing_phone: order.billingAddress.phone,
        shipping_is_billing: true,
        shipping_customer_name: order.shippingAddress.fullName,
        shipping_last_name: '',
        shipping_address: order.shippingAddress.addressLine1,
        shipping_address_2: order.shippingAddress.addressLine2 || '',
        shipping_city: order.shippingAddress.city,
        shipping_pincode: order.shippingAddress.postalCode,
        shipping_country: order.shippingAddress.country || 'India',
        shipping_state: order.shippingAddress.state,
        shipping_email: '',
        shipping_phone: order.shippingAddress.phone,
        order_items: orderItems,
        payment_method: order.paymentMethod === 'cod' ? 'COD' : 'Prepaid',
        shipping_charges: order.shippingCharges || 0,
        giftwrap_charges: 0,
        transaction_charges: 0,
        total_discount: order.discount || 0,
        sub_total: order.subtotal,
        length: 10, // Default dimensions in cm
        breadth: 10,
        height: 10,
        weight: totalWeight
      };

      // Create order in Shiprocket
      const response = await axios.post(
        `${this.baseURL}/orders/create/adhoc`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const shiprocketOrderId = response.data.order_id;
      const shipmentId = response.data.shipment_id;

      logger.info('Shiprocket order created', {
        orderNumber: order.orderNumber,
        shiprocketOrderId,
        shipmentId
      });

      // Now assign AWB (Airway Bill) to the shipment
      let awbData = null;
      try {
        awbData = await this.assignAWB(shipmentId, token);
      } catch (awbError) {
        logger.warn('Failed to assign AWB, shipment created without AWB', {
          orderNumber: order.orderNumber,
          shipmentId,
          error: awbError.message
        });
        // Note: AWB assignment can be retried later or done manually in Shiprocket dashboard
      }

      // Update order with shipment details
      if (!order.shipping) {
        order.shipping = {};
      }
      
      order.shipping.provider = 'shiprocket';
      order.shipping.shiprocketOrderId = shiprocketOrderId;
      order.shipping.shipmentId = shipmentId;
      order.shipping.status = awbData ? 'awb_assigned' : 'created';
      
      if (awbData) {
        order.shipping.awbCode = awbData.awb_code;
        order.shipping.courierName = awbData.courier_name;
        order.shipping.courierCompanyId = awbData.courier_company_id;
        order.trackingNumber = awbData.awb_code;
        order.shippingProvider = awbData.courier_name;
      }

      await order.save();

      logger.info('Order updated with Shiprocket details', {
        orderNumber: order.orderNumber,
        shipmentId,
        awbCode: awbData?.awb_code
      });

      return {
        success: true,
        shiprocketOrderId,
        shipmentId,
        awbCode: awbData?.awb_code
      };
    } catch (error) {
      logger.error('Failed to create Shiprocket shipment', {
        orderNumber: order.orderNumber,
        error: error.message,
        response: error.response?.data
      });
      
      // Update shipping status to indicate failure
      if (!order.shipping) {
        order.shipping = {};
      }
      order.shipping.status = 'not_created';
      await order.save();

      throw error;
    }
  }

  /**
   * Assign AWB (Airway Bill) to shipment
   * @param {String} shipmentId - Shipment ID from Shiprocket
   * @param {String} token - Auth token
   * @returns {Object} AWB details
   */
  async assignAWB(shipmentId, token) {
    try {
      const response = await axios.post(
        `${this.baseURL}/courier/assign/awb`,
        {
          shipment_id: shipmentId
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      logger.info('AWB assigned successfully', {
        shipmentId,
        awbCode: response.data.response.data.awb_code
      });

      return {
        awb_code: response.data.response.data.awb_code,
        courier_company_id: response.data.response.data.courier_company_id,
        courier_name: response.data.response.data.courier_name
      };
    } catch (error) {
      logger.error('Failed to assign AWB', {
        shipmentId,
        error: error.message,
        response: error.response?.data
      });
      throw error;
    }
  }

  /**
   * Cancel shipment
   * @param {Object} order - Order object with shipping details
   * @returns {Object} Cancellation result
   */
  async cancelShipment(order) {
    try {
      if (!order.shipping?.shipmentId) {
        logger.warn('Cannot cancel shipment - no shipmentId found', {
          orderNumber: order.orderNumber
        });
        return { success: false, message: 'No shipment to cancel' };
      }

      const token = await this.getToken();

      // Cancel shipment in Shiprocket
      const response = await axios.post(
        `${this.baseURL}/orders/cancel`,
        {
          ids: [order.shipping.shiprocketOrderId]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Update order shipping status
      order.shipping.status = 'cancelled';
      await order.save();

      logger.info('Shiprocket shipment cancelled', {
        orderNumber: order.orderNumber,
        shipmentId: order.shipping.shipmentId
      });

      return {
        success: true,
        message: 'Shipment cancelled successfully'
      };
    } catch (error) {
      logger.error('Failed to cancel Shiprocket shipment', {
        orderNumber: order.orderNumber,
        error: error.message,
        response: error.response?.data
      });
      throw error;
    }
  }

  /**
   * Track shipment
   * @param {String} shipmentId - Shipment ID
   * @returns {Object} Tracking details
   */
  async trackShipment(shipmentId) {
    try {
      const token = await this.getToken();

      const response = await axios.get(
        `${this.baseURL}/courier/track/shipment/${shipmentId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      logger.info('Shipment tracked successfully', {
        shipmentId,
        status: response.data.tracking_data?.shipment_status
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to track shipment', {
        shipmentId,
        error: error.message,
        response: error.response?.data
      });
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new ShiprocketService();
