const WorkshopRegistration = require("../models/workshopRegistration");
const Workshop = require("../models/workshop");
const { workshopRegistrationSchema, workshopRegistrationUpdateSchema } = require("../schemas/workshopRegistrationSchema");
const workshopSchema = require("../schemas/workshopSchema");

// Get Workshop by ID
const getWorkshopById = async (req, res, next) => {
  try {
    const workshop = await Workshop.findById(req.params.id)
      .populate('registrationsCount')
      .lean();

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
    // Check if there are any registrations for this workshop
    const registrationsCount = await WorkshopRegistration.countDocuments({ workshopId: req.params.id });
    
    if (registrationsCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete workshop. There are ${registrationsCount} registrations associated with this workshop.` 
      });
    }

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
            .populate('registrationsCount')
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

    // Check if workshop exists
    const workshop = await Workshop.findById(req.body.workshopId);
    if (!workshop) {
      return res.status(404).json({ success: false, message: "Workshop not found" });
    }

    // Check if workshop is full
    const registrationsCount = await WorkshopRegistration.countDocuments({ 
      workshopId: req.body.workshopId,
      status: { $in: ['Pending', 'Confirmed'] }
    });

    if (registrationsCount >= workshop.maxParticipants) {
      return res.status(400).json({ 
        success: false, 
        message: "Workshop is full. No more registrations can be accepted." 
      });
    }

    // Check if user is already registered for this workshop
    const existingRegistration = await WorkshopRegistration.findOne({
      workshopId: req.body.workshopId,
      email: req.body.email
    });

    if (existingRegistration) {
      return res.status(400).json({ 
        success: false, 
        message: "You are already registered for this workshop." 
      });
    }

    // Populate workshop name from the workshop
    const registrationData = {
      ...req.body,
      workshopName: workshop.name
    };

    // Create registration
    const registration = await WorkshopRegistration.create(registrationData);

    res.status(201).json({
      success: true,
      data: registration,
    });
  } catch (error) {
    next(error);
  }
};

// Get registrations for a specific workshop
const getRegistrationsByWorkshop = async (req, res, next) => {
  try {
    const { workshopId } = req.params;
    const { page = 1, limit = 10, status, sort = "-createdAt" } = req.query;

    // Check if workshop exists
    const workshop = await Workshop.findById(workshopId);
    if (!workshop) {
      return res.status(404).json({ success: false, message: "Workshop not found" });
    }

    const skip = (page - 1) * limit;
    const filter = { workshopId };

    if (status) filter.status = status;

    const registrations = await WorkshopRegistration.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sort)
      .lean();

    const total = await WorkshopRegistration.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: registrations,
      workshop: {
        id: workshop._id,
        name: workshop.name,
        maxParticipants: workshop.maxParticipants,
        currentRegistrations: total
      },
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

const getRegistrations = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, workshopName, workshopId, sort = "-createdAt" } = req.query;

    const skip = (page - 1) * limit;
    const filter = {};

    if (status) filter.status = status;
    if (workshopName) filter.workshopName = workshopName;
    if (workshopId) filter.workshopId = workshopId;

    const registrations = await WorkshopRegistration.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sort)
      .populate('workshopId', 'name dateTime location')
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
    console.log('Registration ID:', req.params.id);
    console.log('Request body:', req.body);
    
    const allowedFields = ["status", "specialRequirements"];
    const updateData = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = req.body[key];
      }
    });
    
    console.log('Update data:', updateData);

    const { error } = workshopRegistrationUpdateSchema.validate(updateData, {
      allowUnknown: true,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    // Update by registration ID (from URL parameter)
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
  getRegistrationsByWorkshop,
  updateRegistration, 
  deleteRegistration,
  getAllWorkshops,
  getWorkshopById,
  updateWorkshop,
  deleteWorkshop
};
