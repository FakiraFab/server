const Inquiry = require("../models/inquiry");
const Product = require("../models/product");
const { createInquirySchema, updateInquirySchema } = require("../schemas/inquirySchema");
const whatsAppService = require("../utils/whatsApp");
const mongoose = require("mongoose");

const createInquiry = async (req, res, next) => {
  try {
    // Validate request body
    const { error } = createInquirySchema.validate(req.body);
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

     if (variant) {
      // Check if variant matches default color or exists in options array
      const isValidVariant = productExists.color === variant || 
        (productExists.options && productExists.options.some(v => v.color === variant));
      
      if (!isValidVariant) {
        return res.status(404).json({ 
          success: false, 
          message: "Selected color variant does not exist for this product" 
        });
      }
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
      variant: variant || productExists.color || "", // Set default color if variant not provided
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
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const updateData = { ...req.body };
    if (updateData.buyOption !== 'Wholesale' && updateData.companyName === '') {
      delete updateData.companyName;
    }
    delete updateData._id;

    const { error } = updateInquirySchema.validate(updateData, {
      allowUnknown: true,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const inquiry = await Inquiry.findById(req.params.id).session(session);

    if (!inquiry) {
      await session.abortTransaction();
      await session.endSession();
      return res.status(404).json({ success: false, message: "Inquiry not found" });
    }

    // Check if status is being updated to Completed
    if (updateData.status === 'Completed' && inquiry.status !== 'Completed') {
      const product = await Product.findById(inquiry.product).session(session);
      
      if (!product) {
        await session.abortTransaction();
        await session.endSession();
        return res.status(404).json({ success: false, message: "Product not found" });
      }

      // Check if variant matches primary product color or exists in options
      const isMainProduct = product.color === inquiry.variant;
      const variantOption = product.options?.find(opt => opt.color === inquiry.variant);

      if (isMainProduct) {
        // Handle primary product quantity
        if (product.quantity < inquiry.quantity) {
          await session.abortTransaction();
          await session.endSession();
          return res.status(400).json({
            success: false,
            message: "Insufficient product quantity available"
          });
        }
        product.quantity -= inquiry.quantity;
      } else if (variantOption) {
        // Handle variant quantity
        if (variantOption.quantity < inquiry.quantity) {
          await session.abortTransaction();
          await session.endSession();
          return res.status(400).json({
            success: false,
            message: `Insufficient quantity available for ${inquiry.variant} variant`
          });
        }
        variantOption.quantity -= inquiry.quantity;
      } else {
        await session.abortTransaction();
        await session.endSession();
        return res.status(404).json({ 
          success: false, 
          message: "Invalid product variant" 
        });
      }

      await product.save({ session });
    }

    // Update the inquiry
    Object.assign(inquiry, updateData);
    await inquiry.save({ session });

    await session.commitTransaction();
    await session.endSession();

    res.status(200).json({
      success: true,
      data: inquiry,
    });
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
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