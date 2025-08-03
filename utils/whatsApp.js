const msg91Config = require('../config/msg91');

/**
 * MSG91 WhatsApp Service
 * Handles sending WhatsApp messages using MSG91 API
 */
class WhatsAppService {
  constructor() {
    this.config = msg91Config;
    this.validateConfig();
  }

  /**
   * Validate MSG91 configuration
   */
  validateConfig() {
    console.log('=== WhatsApp Service Configuration ===');
    console.log('authKey configured:', !!this.config.authKey);
    console.log('integratedNumber configured:', !!this.config.integratedNumber);
    console.log('templateName configured:', !!this.config.templateName);
    console.log('namespace configured:', !!this.config.namespace);
    console.log('=====================================');
    
    if (!this.config.authKey) {
      console.warn('AuthKey is not configured. WhatsApp messages will not be sent.');
    }
    if (!this.config.integratedNumber) {
      console.warn('MSG91_INTEGRATED_NUMBER is not configured.');
    }
  }

  /**
   * Format phone number for MSG91 API
   * @param {string} phoneNumber - Phone number to format
   * @returns {string} Formatted phone number
   */
  formatPhoneNumber(phoneNumber) {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // If number starts with 91 and is 12 digits, return as is
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      return cleaned;
    }
    
    // If number is 10 digits, add 91 prefix
    if (cleaned.length === 10) {
      return `91${cleaned}`;
    }
    
    // If number is 12 digits without 91 prefix, add it
    if (cleaned.length === 12 && !cleaned.startsWith('91')) {
      return `91${cleaned}`;
    }
    
    // Return as is if it's already in international format
    return cleaned;
  }

  /**
   * Send product inquiry thank you message
   * @param {Object} inquiryData - Inquiry data
   * @param {Object} productData - Product data
   * @returns {Promise<Object>} API response
   */
  async sendInquiryThankYouMessage(inquiryData, productData) {
    try {
      // Validate required configuration
      if (!this.config.authKey) {
        throw new Error('AuthKey is not configured');
      }

      // Format phone number
      const formattedPhone = this.formatPhoneNumber(inquiryData.whatsappNumber);
      
      // Prepare message components
      const components = this.prepareMessageComponents(inquiryData, productData);
      
      // Prepare request payload
      const payload = {
        integrated_number: this.config.integratedNumber,
        content_type: "template",
        payload: {
          messaging_product: "whatsapp",
          type: "template",
          template: {
            name: this.config.templateName,
            language: {
              code: "en",
              policy: "deterministic"
            },
            namespace: this.config.namespace,
            to_and_components: [
              {
                to: [formattedPhone],
                components: components
              }
            ]
          }
        }
      };

      // Send request to MSG91 API
      const response = await this.sendRequest(payload);
      
      console.log('WhatsApp message sent successfully:', {
        inquiryId: inquiryData._id,
        phoneNumber: formattedPhone,
        productName: productData.name
      });

      return response;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }

  /**
   * Prepare message components for the template
   * @param {Object} inquiryData - Inquiry data
   * @param {Object} productData - Product data
   * @returns {Object} Message components
   */
  prepareMessageComponents(inquiryData, productData) {
    // Get product price - use variant price if available, otherwise use base price
    let productPrice = productData.price;
    if (inquiryData.variant && productData.options) {
      const variant = productData.options.find(opt => opt.color === inquiryData.variant);
      if (variant && variant.price) {
        productPrice = variant.price;
      }
    }

    // Format price with Indian Rupee symbol
    const formattedPrice = `₹${productPrice?.toLocaleString('en-IN') || 'Contact for price'}`;

    return {
      header_1: {
        type: "image",
        value: inquiryData.productImage || "https://via.placeholder.com/800x600" // Fallback image if none provided
      },
      body_1: {
        type: "text",
        value: inquiryData.userName || "Valued Customer"
      },
      body_2: {
        type: "text",
        value: productData.name || "Product"
      },
      body_3: {
        type: "text",
        value: formattedPrice
      },
      body_4: {
        type: "text",
        value: this.config.upiId
      }
    };
  }

  /**
   * Send HTTP request to MSG91 API
   * @param {Object} payload - Request payload
   * @returns {Promise<Object>} API response
   */
  async sendRequest(payload) {
    const headers = {
      'Content-Type': 'application/json',
      'authkey': this.config.authKey
    };

    const requestOptions = {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
      redirect: 'follow'
    };

    try {
      const response = await fetch(this.config.apiUrl, requestOptions);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`MSG91 API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      // Check for MSG91 specific error responses
      if (result.type === 'error') {
        throw new Error(`MSG91 API error: ${result.message || 'Unknown error'}`);
      }

      return result;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to MSG91 API');
      }
      throw error;
    }
  }

  /**
   * Send bulk messages
   * @param {Array} messages - Array of message objects
   * @returns {Promise<Object>} API response
   */
  async sendBulkMessages(messages) {
    try {
      if (!this.config.authKey) {
        throw new Error('AuthKey is not configured');
      }

      const formattedMessages = messages.map(msg => ({
        to: [this.formatPhoneNumber(msg.phoneNumber)],
        components: msg.components
      }));

      const payload = {
        integrated_number: this.config.integratedNumber,
        content_type: "template",
        payload: {
          messaging_product: "whatsapp",
          type: "template",
          template: {
            name: this.config.templateName,
            language: {
              code: "en",
              policy: "deterministic"
            },
            namespace: this.config.namespace,
            to_and_components: formattedMessages
          }
        }
      };

      return await this.sendRequest(payload);
    } catch (error) {
      console.error('Error sending bulk WhatsApp messages:', error);
      throw error;
    }
  }

  /**
   * Test the MSG91 configuration
   * @param {string} testPhoneNumber - Phone number to test with
   * @returns {Promise<Object>} Test result
   */
  async testConfiguration(testPhoneNumber) {
    try {
      const testInquiry = {
        userName: "Test User",
        whatsappNumber: testPhoneNumber,
        variant: "Red",
        productImage: "https://via.placeholder.com/800x600"
      };

      const testProduct = {
        name: "Test Product",
        price: 999
      };

      const result = await this.sendInquiryThankYouMessage(testInquiry, testProduct);
      
      return {
        success: true,
        message: 'MSG91 configuration is working correctly',
        result
      };
    } catch (error) {
      return {
        success: false,
        message: 'MSG91 configuration test failed',
        error: error.message
      };
    }
  }
}

// Create singleton instance
const whatsAppService = new WhatsAppService();

module.exports = whatsAppService;