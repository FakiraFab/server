const Inquiry = require("../models/inquiry");
const Product = require("../models/product");
const inquirySchema = require("../schemas/inquirySchema");

const createInquiry = async(req,res,next)=>{
        try {
            const { error } = inquirySchema.validate(req.body);
            if (error) {
                return res.status(400).json({ success: false, message: error.details[0].message });
            }

            const { product, variant } = req.body;
            const productExists = await Product.findById(product);
            if (!productExists) {
                return res.status(404).json({ success: false, message: 'Product does not exist' });
            }

            if (variant && !productExists.options.some(option => option.color === variant)) {
                return res.status(404).json({ success: false, message: 'Variant does not exist' });
            }

            const inquiry = await Inquiry.create(req.body);
            res.status(201).json({
                success: true,
                data: inquiry
            })
            
        } catch (error) {
            next(error);
        }

}


const getInquiries = async(req,res,next)=>{
    try {
        const {page= 1,limit = 10,status,product,sort = "-createdAt"} = req.query;

        //explanation here :-
        //page is the current page number
        //limit is the number of items per page
        //status is the status of the inquiry
        //product is the product of the inquiry
        //sort is the sort order of the inquiries


        //for example if the page is 3rd then skip the first 20 items
        //and get the 3rd page of 10 items
        const skip = (page-1)*limit;
        const filter = {};


        //explanation here :-
        //if status is present in query params then add it to filter
        //if product is present in query params then add it to filter
        //if sort is present in query params then add it to filter
        if(status)filter.status = status;
        if(product)filter.product = product;


      const inquiries = await Inquiry.find(filter)
      .populate('product', 'name imageUrl')
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sort)
      .select('fullName phoneNumber buyOption status product variant quantity createdAt')
      .lean();
      const total = await Inquiry.countDocuments(filter);
      res.status(200).json({
        success:true,
        data:inquiries,
        pagination:{
            total,
            page: parseInt(page),
            pages:Math.ceil(total/limit)
        }
      });     
    } catch (error) {
        next(error);
    }
}

// const getInquiryById = async(req,res,next)=>{}

const updateInquiry = async(req,res,next)=>{
    try {
        const updates = {};
        const allowedFields = ['status', 'adminNotes'];

        // Only validate allowed fields
        const updateData = {};
        Object.keys(req.body).forEach(key => {
            if (allowedFields.includes(key)) {
                updateData[key] = req.body[key];
            }
        });

        const { error } = inquirySchema.validate(updateData, { 
            allowUnknown: true,
            stripUnknown: true
        });

        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        const inquiry = await Inquiry.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true
        });
        if(!inquiry){
            return res.status(404).json({success:false,message:'Inquiry not found'});
        }
        res.status(200).json({
            success:true,
            data:inquiry
        })
        
    } catch (error) {
        next(error);
    }
}

const deleteInquiry = async(req,res,next)=>{
    try {
        const inquiry =  await Inquiry.findByIdAndDelete(req.params.id);
        if(!inquiry){
            return res.status(404).json({success:false,message:'Inquiry not found'})
        }
        res.status(200).json({success:true,data:inquiry});
        
    } catch (error) {
        next(error);
    }
}


module.exports = {createInquiry,getInquiries,updateInquiry,deleteInquiry}