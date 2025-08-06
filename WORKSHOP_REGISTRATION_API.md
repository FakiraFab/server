# Workshop Registration API

This API provides functionality to create workshops and allow users to register for them. The system links workshops with registrations to provide a complete workshop management solution.

## Features

- ✅ Create and manage workshops
- ✅ Register users for specific workshops
- ✅ Prevent duplicate registrations
- ✅ Check workshop capacity limits
- ✅ Get registration counts for workshops
- ✅ Prevent workshop deletion if registrations exist
- ✅ Filter registrations by workshop, status, etc.

## API Endpoints

### Workshop Management

#### Create Workshop
```
POST /api/workshop-registrations/create
```

**Request Body:**
```json
{
  "name": "Advanced JavaScript Workshop",
  "description": "Learn advanced JavaScript concepts and modern ES6+ features",
  "dateTime": "2024-02-15T10:00:00Z",
  "duration": "3 hours",
  "maxParticipants": 20,
  "price": 99.99,
  "location": "Online via Zoom",
  "requirements": "Basic JavaScript knowledge required",
  "status": "Upcoming"
}
```

#### Get All Workshops
```
GET /api/workshop-registrations/workshops?page=1&limit=10&sort=-createdAt
```

**Response includes registration count:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "workshop_id",
      "name": "Advanced JavaScript Workshop",
      "registrationsCount": 5,
      "maxParticipants": 20,
      // ... other workshop fields
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "pages": 1
  }
}
```

#### Get Workshop by ID
```
GET /api/workshop-registrations/workshops/:id
```

#### Update Workshop
```
PATCH /api/workshop-registrations/workshops/:id
```

#### Delete Workshop
```
DELETE /api/workshop-registrations/workshops/:id
```
*Note: Cannot delete workshop if registrations exist*

### Registration Management

#### Register for Workshop
```
POST /api/workshop-registrations
```

**Request Body:**
```json
{
  "workshopId": "workshop_id_here",
  "fullName": "John Doe",
  "age": 22,
  "institution": "Tech University",
  "educationLevel": "University",
  "email": "john@example.com",
  "contactNumber": "+1234567890",
  "specialRequirements": "Need closed captions"
}
```

**Validation Checks:**
- Workshop must exist
- Workshop must not be full
- User must not already be registered for this workshop
- Workshop name is automatically populated from workshop

#### Get All Registrations
```
GET /api/workshop-registrations?page=1&limit=10&status=Confirmed&workshopId=workshop_id
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Filter by status (Pending, Confirmed, Cancelled)
- `workshopId`: Filter by workshop ID
- `workshopName`: Filter by workshop name
- `sort`: Sort order (default: -createdAt)

#### Get Registrations for Specific Workshop
```
GET /api/workshop-registrations/workshops/:workshopId/registrations?page=1&limit=10&status=Confirmed
```

**Response includes workshop details:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "registration_id",
      "fullName": "John Doe",
      "email": "john@example.com",
      "status": "Confirmed",
      // ... other registration fields
    }
  ],
  "workshop": {
    "id": "workshop_id",
    "name": "Advanced JavaScript Workshop",
    "maxParticipants": 20,
    "currentRegistrations": 5
  },
  "pagination": {
    "total": 5,
    "page": 1,
    "pages": 1
  }
}
```

#### Update Registration
```
PATCH /api/workshop-registrations/:id
```

**Allowed fields to update:**
- `status`: Pending, Confirmed, Cancelled
- `specialRequirements`: String

#### Delete Registration
```
DELETE /api/workshop-registrations/:id
```

## Database Schema

### Workshop Model
```javascript
{
  name: String (required, max 200 chars),
  description: String (required, max 1000 chars),
  dateTime: Date (required),
  duration: String (required, max 50 chars),
  maxParticipants: Number (required, min 1),
  price: Number (required, min 0),
  location: String (required, max 200 chars),
  requirements: String (optional, max 1000 chars),
  status: String (enum: Upcoming, Ongoing, Completed, Cancelled),
  createdAt: Date,
  updatedAt: Date
}
```

### Workshop Registration Model
```javascript
{
  workshopId: ObjectId (required, ref: Workshop),
  fullName: String (required, max 100 chars),
  age: Number (required, 10-30),
  institution: String (required, max 200 chars),
  educationLevel: String (enum: School, College, University),
  email: String (required, valid email),
  contactNumber: String (required, valid phone),
  workshopName: String (auto-populated),
  status: String (enum: Pending, Confirmed, Cancelled),
  specialRequirements: String (optional, max 500 chars),
  createdAt: Date,
  updatedAt: Date
}
```

## Business Logic

### Registration Validation
1. **Workshop Existence**: Workshop must exist in database
2. **Capacity Check**: Workshop must not be full (current registrations < maxParticipants)
3. **Duplicate Prevention**: User (by email) cannot register for the same workshop twice
4. **Auto-population**: Workshop name is automatically set from the workshop reference

### Workshop Deletion Protection
- Workshops with existing registrations cannot be deleted
- This prevents data integrity issues

### Registration Status Management
- **Pending**: Default status for new registrations
- **Confirmed**: Approved registrations
- **Cancelled**: Cancelled registrations

## Error Handling

### Common Error Responses

**Workshop Not Found:**
```json
{
  "success": false,
  "message": "Workshop not found"
}
```

**Workshop Full:**
```json
{
  "success": false,
  "message": "Workshop is full. No more registrations can be accepted."
}
```

**Duplicate Registration:**
```json
{
  "success": false,
  "message": "You are already registered for this workshop."
}
```

**Cannot Delete Workshop:**
```json
{
  "success": false,
  "message": "Cannot delete workshop. There are X registrations associated with this workshop."
}
```

## Testing

Run the test file to see the workshop-registration linking in action:

```bash
node test-workshop-registration.js
```

This will demonstrate:
- Creating workshops
- Registering users
- Capacity checking
- Duplicate prevention
- Registration counting
- Data cleanup

## Usage Examples

### Frontend Integration

```javascript
// Get available workshops
const workshops = await fetch('/api/workshop-registrations/workshops');
const workshopsData = await workshops.json();

// Register for a workshop
const registration = await fetch('/api/workshop-registrations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    workshopId: 'workshop_id_here',
    fullName: 'John Doe',
    age: 22,
    institution: 'Tech University',
    educationLevel: 'University',
    email: 'john@example.com',
    contactNumber: '+1234567890'
  })
});

// Get registrations for a specific workshop
const registrations = await fetch('/api/workshop-registrations/workshops/workshop_id/registrations');
```

This API provides a complete solution for workshop management with user registration capabilities, ensuring data integrity and preventing common issues like duplicate registrations and overbooking. 