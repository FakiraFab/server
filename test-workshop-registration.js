const mongoose = require('mongoose');
const Workshop = require('./models/workshop');
const WorkshopRegistration = require('./models/workshopRegistration');

// Connect to MongoDB (update with your connection string)
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/your-database', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test the workshop-registration linking
const testWorkshopRegistration = async () => {
  try {
    console.log('=== Testing Workshop-Registration Linking ===\n');

    // 1. Create a workshop
    console.log('1. Creating a workshop...');
    const workshop = await Workshop.create({
      name: 'Advanced JavaScript Workshop',
      description: 'Learn advanced JavaScript concepts and modern ES6+ features',
      dateTime: new Date('2024-02-15T10:00:00Z'),
      duration: '3 hours',
      maxParticipants: 20,
      price: 99.99,
      location: 'Online via Zoom',
      requirements: 'Basic JavaScript knowledge required',
      status: 'Upcoming'
    });
    console.log('Workshop created:', workshop.name, '(ID:', workshop._id, ')\n');

    // 2. Register users for the workshop
    console.log('2. Registering users for the workshop...');
    const registrations = await Promise.all([
      WorkshopRegistration.create({
        workshopId: workshop._id,
        fullName: 'John Doe',
        age: 22,
        institution: 'Tech University',
        educationLevel: 'University',
        email: 'john@example.com',
        contactNumber: '+1234567890',
        status: 'Confirmed'
      }),
      WorkshopRegistration.create({
        workshopId: workshop._id,
        fullName: 'Jane Smith',
        age: 19,
        institution: 'Community College',
        educationLevel: 'College',
        email: 'jane@example.com',
        contactNumber: '+1987654321',
        status: 'Pending'
      }),
      WorkshopRegistration.create({
        workshopId: workshop._id,
        fullName: 'Mike Johnson',
        age: 25,
        institution: 'State University',
        educationLevel: 'University',
        email: 'mike@example.com',
        contactNumber: '+1122334455',
        status: 'Confirmed'
      })
    ]);
    console.log('Registered', registrations.length, 'users\n');

    // 3. Get workshop with registration count
    console.log('3. Getting workshop with registration details...');
    const workshopWithRegistrations = await Workshop.findById(workshop._id)
      .populate('registrationsCount')
      .lean();
    console.log('Workshop:', workshopWithRegistrations.name);
    console.log('Max participants:', workshopWithRegistrations.maxParticipants);
    console.log('Current registrations:', workshopWithRegistrations.registrationsCount, '\n');

    // 4. Get all registrations for the workshop
    console.log('4. Getting all registrations for the workshop...');
    const workshopRegistrations = await WorkshopRegistration.find({ workshopId: workshop._id })
      .populate('workshopId', 'name dateTime location')
      .lean();
    
    console.log('Registrations for workshop:');
    workshopRegistrations.forEach((reg, index) => {
      console.log(`${index + 1}. ${reg.fullName} (${reg.email}) - Status: ${reg.status}`);
    });
    console.log();

    // 5. Test workshop capacity check
    console.log('5. Testing workshop capacity...');
    const currentRegistrations = await WorkshopRegistration.countDocuments({ 
      workshopId: workshop._id,
      status: { $in: ['Pending', 'Confirmed'] }
    });
    console.log('Current registrations:', currentRegistrations);
    console.log('Available spots:', workshop.maxParticipants - currentRegistrations);
    console.log('Workshop is full:', currentRegistrations >= workshop.maxParticipants, '\n');

    // 6. Test duplicate registration prevention
    console.log('6. Testing duplicate registration prevention...');
    try {
      await WorkshopRegistration.create({
        workshopId: workshop._id,
        fullName: 'John Doe',
        age: 22,
        institution: 'Tech University',
        educationLevel: 'University',
        email: 'john@example.com', // Same email as existing registration
        contactNumber: '+1234567890',
        status: 'Pending'
      });
    } catch (error) {
      console.log('Duplicate registration prevented (expected behavior)');
    }

    console.log('=== Test completed successfully ===');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Clean up test data
    await Workshop.deleteMany({ name: 'Advanced JavaScript Workshop' });
    await WorkshopRegistration.deleteMany({ fullName: { $in: ['John Doe', 'Jane Smith', 'Mike Johnson'] } });
    console.log('Test data cleaned up');
    mongoose.connection.close();
  }
};

// Run the test
connectDB().then(() => {
  testWorkshopRegistration();
}); 