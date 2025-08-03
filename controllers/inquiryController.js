const Inquiry = require("../models/inquiry");
const Product = require("../models/product");
const inquirySchema = require("../schemas/inquirySchema");
const whatsAppService = require("../utils/whatsApp");

const createInquiry = async (req, res, next) => {
  try {
    // Validate request body
    const { error } = inquirySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const {
      userName,
      userEmail,
      whatsappNumber,
      buyOption,
      location,
      quantity,
      companyName,
      productId,
      productName,
      productImage,
      variant,
      message,
    } = req.body;

    // Validate product exists
    const productExists = await Product.findById(productId);
    if (!productExists) {
      return res.status(404).json({ success: false, message: "Product does not exist" });
    }

    // Validate variant if provided
    if (variant && productExists.options && !productExists.options.some(v => v.color === variant)) {
      return res.status(404).json({ success: false, message: "Variant does not exist" });
    }

    // Create inquiry
    const inquiry = await Inquiry.create({
      userName,
      userEmail,
      whatsappNumber,
      buyOption,
      location,
      quantity,
      companyName: buyOption === "Wholesale" ? companyName : undefined,
      product: productId,
      productName,
      productImage,
      variant: variant || "",
      message,
    });

    // Send WhatsApp message asynchronously (don't block the response)
    try {
      await whatsAppService.sendInquiryThankYouMessage(inquiry, productExists);
    } catch (whatsappError) {
      console.error('WhatsApp message sending failed:', whatsappError);
      // Don't fail the inquiry creation if WhatsApp fails
    }

    res.status(201).json({
      success: true,
      data: inquiry,
      message: "Inquiry created successfully. You will receive a WhatsApp message shortly."
    });
  } catch (error) {
    next(error);
  }
};

const getInquiries = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, product, sort = "-createdAt" } = req.query;

    const skip = (page - 1) * limit;
    const filter = {};

    if (status) filter.status = status;
    if (product) filter.product = product;

    const inquiries = await Inquiry.find(filter)
      .populate("product", "name imageUrl")
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sort)
      .select("userName userEmail whatsappNumber buyOption location quantity companyName product productName productImage variant message status createdAt")
      .lean();

    const total = await Inquiry.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: inquiries,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateInquiry = async (req, res, next) => {
  try {
    const updates = {};
    const allowedFields = ["status", "adminNotes"];

    const updateData = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = req.body[key];
      }
    });

    const { error } = inquirySchema.validate(updateData, {
      allowUnknown: true,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const inquiry = await Inquiry.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!inquiry) {
      return res.status(404).json({ success: false, message: "Inquiry not found" });
    }

    res.status(200).json({
      success: true,
      data: inquiry,
    });
  } catch (error) {
    next(error);
  }
};

const deleteInquiry = async (req, res, next) => {
  try {
    const inquiry = await Inquiry.findByIdAndDelete(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ success: false, message: "Inquiry not found" });
    }
    res.status(200).json({ success: true, data: inquiry });
  } catch (error) {
    next(error);
  }
};

// Test WhatsApp integration
const testWhatsApp = async (req, res, next) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ 
        success: false, 
        message: "Phone number is required for testing" 
      });
    }

    const result = await whatsAppService.testConfiguration(phoneNumber);
    
    res.status(200).json({
      success: true,
      message: "WhatsApp test completed",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { 
  createInquiry, 
  getInquiries, 
  updateInquiry, 
  deleteInquiry,
  testWhatsApp
};