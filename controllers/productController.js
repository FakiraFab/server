const Product = require('../models/product');
const Category = require('../models/category');
const productSchema = require('../schemas/productSchemas');

const getProducts = async(req,res,next)=>{
    try {

        const {page = 1,limit = 10,category,sort = "name"} = req.query;
        const skip = (page-1)*limit; // Calculate the number of documents to skip for example if page is 2 and limit is 10, skip will be 10
        
        // Create a filter based on the category if provided
        //example: if category is 'electronics', filter will be { category: 'electronics' }
        // If no category is provided, filter will be an empty object

        const filter = category ? { category} :{};
        const products = await Product.find(filter)
        .populate('category', 'name')
        .skip(skip)
        .limit(parseInt(limit))
        .sort(sort)
        .lean('name price imageurl quantity options');
        const total = await Product.countDocuments(filter);

        res.status(200).json({
            success: true,
            data:products,
            total,
            pagination:{
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
            }

        });   
    } catch (error) {
        next(error);
        
    }
}

const getProductById  = async(req,res,next)=>{
    try {
        const {id} = req.params;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }
        const product = await Product.findById(id)
            .populate('category', 'name description')
            .lean();

        if (!product) {
        
            return res.status(404).json({success: false, message: 'Product not found' });
        }
        res.status(200).json({
            success:true,
            data:product
        })

        
    } catch (error) {
        next(error);
        
    }
}

const createProduct = async(req,res,next)=>{
    try {
        const { error } = productSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        const { category } = req.body;
        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
            return res.status(400).json({ success: false, message: 'Category does not exist' });
        }

        const product = await Product.create(req.body);
        res.status(201).json({
            success: true,
            data: product
        })
        
    } catch (error) {
        next(error);
        
    }
}

const updateProduct = async(req,res,next)=>{
    try {
        const { error } = productSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        const { category } = req.body;
        if (category) {
            const categoryExists = await Category.findById(category);
            if (!categoryExists) {
                return res.status(404).json({ success: false, message: 'Category does not exist' });
            }
        }

        const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.status(200).json({
            success: true,
            data: product
        });
        
    } catch (error) {
        next(error);
    }
}


const deleteProduct = async(req,res,next)=>{
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if(!product){
            return res.status(404).json({success:false,message:
                'Product not found'
            })
        }
        res.status(200).json({
            success:true,
            message:'Product deleted successfully'
        })
        
    } catch (error) {
        next(error);
        
    }
}


module.exports = { getProducts ,getProductById , createProduct, updateProduct,deleteProduct };