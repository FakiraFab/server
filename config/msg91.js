const msg91Config = {
  authKey: process.env.AuthKey||"461333Ac4MGF9Fh688da2a8P1",
  integratedNumber: process.env.MSG91_INTEGRATED_NUMBER || "919909252577",
  templateName: process.env.MSG91_TEMPLATE_NAME || "product_enquiry_thankyou",
  namespace: process.env.MSG91_NAMESPACE || "988d9f52_3fde_4101_aa3b_e0298511d9d5",
  apiUrl: "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/",
  upiId: process.env.UPI_ID || "your-upi-id@bank"
};



module.exports = msg91Config; 