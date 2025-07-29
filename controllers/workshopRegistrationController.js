const WorkshopRegistration = require("../models/workshopRegistration");
const Workshop = require("../models/workshop");
const workshopRegistrationSchema = require("../schemas/workshopRegistrationSchema");
const workshopSchema = require("../schemas/workshopSchema");




// Get Workshop by ID
const getWorkshopById = async (req, res, next) => {
  try {
    const workshop = await Workshop.findById(req.params.id).lean();

    if (!workshop) {
      return res.status(404).json({ success: false, message: "Workshop not found" });
    }

    res.status(200).json({ success: true, data: workshop });
  } catch (error) {
    next(error);
  }
};

// Update/Edit Workshop
const updateWorkshop = async (req, res, next) => {
  try {
    // Validate update fields
    const { error } = workshopSchema.validate(req.body, {
      allowUnknown: true,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const workshop = await Workshop.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!workshop) {
      return res.status(404).json({ success: false, message: "Workshop not found" });
    }

    res.status(200).json({ success: true, data: workshop });
  } catch (error) {
    next(error);
  }
};

// Delete Workshop
const deleteWorkshop = async (req, res, next) => {
  try {
    const workshop = await Workshop.findByIdAndDelete(req.params.id);

    if (!workshop) {
      return res.status(404).json({ success: false, message: "Workshop not found" });
    }

    res.status(200).json({ success: true, data: workshop });
  } catch (error) {
    next(error);
  }
};









//getAll workshops

const getAllWorkshops = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, sort = "-createdAt" } = req.query;
        const skip = (page - 1) * limit;
        const workshops = await Workshop.find()
            .skip(skip)
            .limit(parseInt(limit))
            .sort(sort)
            .lean();
        const total = await Workshop.countDocuments();
        res.status(200).json({
            success: true,
            data: workshops,
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





const createWorkshop = async (req, res, next) => {
  try {
    // Validate request body
    const { error } = workshopSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    // Create workshop
    const workshop = await Workshop.create(req.body);

    res.status(201).json({
      success: true,
      data: workshop,
    });
  } catch (error) {
    next(error);
  }
};

const createRegistration = async (req, res, next) => {
  try {
    // Validate request body
    const { error } = workshopRegistrationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    // Create registration
    const registration = await WorkshopRegistration.create(req.body);

    res.status(201).json({
      success: true,
      data: registration,
    });
  } catch (error) {
    next(error);
  }
};

const getRegistrations = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, workshopName, sort = "-createdAt" } = req.query;

    const skip = (page - 1) * limit;
    const filter = {};

    if (status) filter.status = status;
    if (workshopName) filter.workshopName = workshopName;

    const registrations = await WorkshopRegistration.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sort)
      .lean();

    const total = await WorkshopRegistration.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: registrations,
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

const updateRegistration = async (req, res, next) => {
  try {
    const updates = {};
    const allowedFields = ["status", "specialRequirements"];

    const updateData = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = req.body[key];
      }
    });

    const { error } = workshopRegistrationSchema.validate(updateData, {
      allowUnknown: true,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const registration = await WorkshopRegistration.findByIdAndUpdate(
      req.params.id, 
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!registration) {
      return res.status(404).json({ success: false, message: "Registration not found" });
    }

    res.status(200).json({
      success: true,
      data: registration,
    });
  } catch (error) {
    next(error);
  }
};

const deleteRegistration = async (req, res, next) => {
  try {
    const registration = await WorkshopRegistration.findByIdAndDelete(req.params.id);
    if (!registration) {
      return res.status(404).json({ success: false, message: "Registration not found" });
    }
    res.status(200).json({ success: true, data: registration });
  } catch (error) {
    next(error);
  }
};

module.exports = { 
  createWorkshop,
  createRegistration, 
  getRegistrations, 
  updateRegistration, 
  deleteRegistration,
  getAllWorkshops,
  getWorkshopById,
  updateWorkshop,
  deleteWorkshop
   
};
