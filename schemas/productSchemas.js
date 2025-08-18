const Joi = require('joi');

// Enhanced product schema with better validation
const productSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(100)
    .required()
    .trim()
    .messages({
      'string.empty': 'Product name is required',
      'string.min': 'Product name must be at least 3 characters long',
      'string.max': 'Product name cannot exceed 100 characters',
      'any.required': 'Product name is required'
    }),

  category: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Category must be a valid ObjectId',
      'any.required': 'Category is required'
    }),

  subcategory: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Subcategory must be a valid ObjectId',
      'any.required': 'Subcategory is required'
    }),

  description: Joi.string()
    .min(10)
    .max(500)
    .required()
    .trim()
    .messages({
      'string.empty': 'Description is required',
      'string.min': 'Description must be at least 10 characters long',
      'string.max': 'Description cannot exceed 500 characters',
      'any.required': 'Description is required'
    }),

  fullDescription: Joi.string()
    .max(2000)
    .optional()
    .trim()
    .messages({
      'string.max': 'Full description cannot exceed 2000 characters'
    }),

  price: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.positive': 'Price must be a positive number',
      'any.required': 'Price is required'
    }),

  imageUrl: Joi.string()
    .uri()
    .required()
    .messages({
      'string.uri': 'Primary image URL must be a valid URL',
      'any.required': 'Primary image URL is required'
    }),

  images: Joi.array()
    .items(Joi.string().uri().messages({
      'string.uri': 'Each image URL must be a valid URL'
    }))
    .min(1)
    .optional()
    .messages({
      'array.min': 'At least one image is required'
    }),

  quantity: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
      'number.integer': 'Quantity must be an integer',
      'number.min': 'Quantity cannot be negative',
      'any.required': 'Quantity is required'
    }),

  specifications: Joi.object({
    material: Joi.string()
      .max(50)
      .default('Cotton')
      .trim()
      .messages({
        'string.max': 'Material cannot exceed 50 characters'
      }),

    style: Joi.string()
      .max(50)
      .default('Traditional')
      .trim()
      .messages({
        'string.max': 'Style cannot exceed 50 characters'
      }),

    length: Joi.string()
      .max(20)
      .default('6 meters')
      .trim()
      .messages({
        'string.max': 'Length cannot exceed 20 characters'
      }),

    blousePiece: Joi.string()
      .valid('Yes', 'No')
      .default('Yes')
      .messages({
        'any.only': 'Blouse piece must be either "Yes" or "No"'
      }),

    designNo: Joi.string()
      .max(50)
      .optional()
      .trim()
      .messages({
        'string.max': 'Design number cannot exceed 50 characters'
      })
  }).optional(),

  unit: Joi.string()
    .valid('meter', 'piece')
    .required()
    .messages({
      'string.empty': 'Unit of measurement is required',
      'any.required': 'Unit of measurement is required',
      'any.only': 'Unit must be either meter or piece'
    }),

  options: Joi.array()
    .items(
      Joi.object({
        color: Joi.string()
          .min(2)
          .max(30)
          .required()
          .trim()
          .messages({
            'string.empty': 'Color is required',
            'string.min': 'Color must be at least 2 characters long',
            'string.max': 'Color cannot exceed 30 characters',
            'any.required': 'Color is required'
          }),

        colorCode: Joi.string()
          .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
          .optional()
          .messages({
            'string.pattern.base': 'Color code must be a valid hex color (e.g., #FF0000)'
          }),

        quantity: Joi.number()
          .integer()
          .min(0)
          .required()
          .messages({
            'number.integer': 'Quantity must be an integer',
            'number.min': 'Quantity cannot be negative',
            'any.required': 'Quantity is required'
          }),

        price: Joi.number()
          .positive()
          .precision(2)
          .optional()
          .messages({
            'number.positive': 'Price must be a positive number'
          }),

        imageUrls: Joi.array()
          .items(Joi.string().uri().messages({
            'string.uri': 'Each image URL must be a valid URL'
          }))
          .min(1)
          .required()
          .messages({
            'array.min': 'At least one image is required for each variant',
            'any.required': 'Image URLs are required'
          })
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one product variant is required',
      'any.required': 'Product variants are required'
    }),

  // Additional fields for better product management
  tags: Joi.array()
    .items(Joi.string().max(20).trim())
    .max(10)
    .optional()
    .messages({
      'array.max': 'Maximum 10 tags allowed',
      'string.max': 'Each tag cannot exceed 20 characters'
    }),

  isActive: Joi.boolean()
    .default(true)
    .optional(),

  isFeatured: Joi.boolean()
    .default(false)
    .optional(),

  discount: Joi.object({
    type: Joi.string()
      .valid('percentage', 'fixed')
      .optional(),
    value: Joi.number()
      .min(0)
      .optional(),
    startDate: Joi.date()
      .optional(),
    endDate: Joi.date()
      .greater(Joi.ref('startDate'))
      .optional()
  }).optional(),

  seo: Joi.object({
    metaTitle: Joi.string()
      .max(60)
      .optional()
      .trim()
      .messages({
        'string.max': 'Meta title cannot exceed 60 characters'
      }),

    metaDescription: Joi.string()
      .max(160)
      .optional()
      .trim()
      .messages({
        'string.max': 'Meta description cannot exceed 160 characters'
      }),

    keywords: Joi.array()
      .items(Joi.string().max(30).trim())
      .max(20)
      .optional()
      .messages({
        'array.max': 'Maximum 20 keywords allowed',
        'string.max': 'Each keyword cannot exceed 30 characters'
      })
  }).optional()
});

// Schema for updating products (all fields optional except ID)
const updateProductSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(100)
    .optional()
    .trim()
    .messages({
      'string.min': 'Product name must be at least 3 characters long',
      'string.max': 'Product name cannot exceed 100 characters'
    }),

  category: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Category must be a valid ObjectId'
    }),

  subcategory: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Subcategory must be a valid ObjectId'
    }),

  description: Joi.string()
    .min(10)
    .max(500)
    .optional()
    .trim()
    .messages({
      'string.min': 'Description must be at least 10 characters long',
      'string.max': 'Description cannot exceed 500 characters'
    }),

  fullDescription: Joi.string()
    .max(2000)
    .optional()
    .trim()
    .messages({
      'string.max': 'Full description cannot exceed 2000 characters'
    }),

  price: Joi.number()
    .positive()
    .precision(2)
    .optional()
    .messages({
      'number.positive': 'Price must be a positive number'
    }),

  imageUrl: Joi.string()
    .uri()
    .optional()
    .messages({
      'string.uri': 'Primary image URL must be a valid URL'
    }),

  images: Joi.array()
    .items(Joi.string().uri().messages({
      'string.uri': 'Each image URL must be a valid URL'
    }))
    .optional(),

  quantity: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.integer': 'Quantity must be an integer',
      'number.min': 'Quantity cannot be negative'
    }),

  specifications: Joi.object({
    material: Joi.string().max(50).optional().trim(),
    style: Joi.string().max(50).optional().trim(),
    length: Joi.string().max(20).optional().trim(),
    blousePiece: Joi.string().valid('Yes', 'No').optional(),
    designNo: Joi.string().max(50).optional().trim()
  }).optional(),

  unit: Joi.string()
    .valid('meter', 'piece')
    .optional()
    .messages({
      'any.only': 'Unit must be either meter or piece'
    }),

  options: Joi.array()
    .items(
      Joi.object({
        color: Joi.string().min(2).max(30).required().trim(),
        colorCode: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
        quantity: Joi.number().integer().min(0).required(),
        price: Joi.number().positive().precision(2).optional(),
        imageUrls: Joi.array().items(Joi.string().uri()).min(1).required()
      })
    )
    .min(1)
    .optional(),

  tags: Joi.array()
    .items(Joi.string().max(20).trim())
    .max(10)
    .optional(),

  isActive: Joi.boolean().optional(),
  isFeatured: Joi.boolean().optional(),
  discount: Joi.object({
    type: Joi.string().valid('percentage', 'fixed').optional(),
    value: Joi.number().min(0).optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().greater(Joi.ref('startDate')).optional()
  }).optional(),

  seo: Joi.object({
    metaTitle: Joi.string().max(60).optional().trim(),
    metaDescription: Joi.string().max(160).optional().trim(),
    keywords: Joi.array().items(Joi.string().max(30).trim()).max(20).optional()
  }).optional()
});

// Schema for bulk update operations
const bulkUpdateSchema = Joi.object({
  products: Joi.array()
    .items(
      Joi.object({
        id: Joi.string()
          .pattern(/^[0-9a-fA-F]{24}$/)
          .required()
          .messages({
            'string.pattern.base': 'Product ID must be a valid ObjectId',
            'any.required': 'Product ID is required'
          })
      }).concat(updateProductSchema)
    )
    .min(1)
    .max(100)
    .required()
    .messages({
      'array.min': 'At least one product is required',
      'array.max': 'Maximum 100 products can be updated at once',
      'any.required': 'Products array is required'
    })
});

module.exports = {
  productSchema,
  updateProductSchema,
  bulkUpdateSchema
};