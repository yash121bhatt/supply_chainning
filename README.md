# Supply Chain Management Platform

An AI-enabled supply chain management platform connecting Shippers, Carriers, and Drivers for efficient logistics operations.

## Features

### Shipper (Client)
- Register/Login with secure authentication
- Create and manage shipments
- View available carriers and assign loads
- Real-time shipment tracking
- Payment management
- Shipment history & analytics dashboard

### Carrier (Transport Company)
- Register/Login & company profile setup
- Manage fleet (vehicles, capacity, documents)
- Accept/Reject shipment requests
- Assign drivers to shipments
- Track all active shipments
- Earnings dashboard & reports

### Driver
- Register/Login with KYC verification
- View assigned shipments
- Navigation support (Google Maps integration)
- Update shipment status (pickup, in transit, delivered)
- Upload proof of delivery (image/signature)
- Earnings & trip history

## Tech Stack

**Frontend:**
- React.js with Vite
- React Router
- Tailwind CSS
- Zustand (state management)
- Axios
- React Hot Toast

**Backend:**
- Node.js + Express.js
- MongoDB with Mongoose
- JWT Authentication
- Express Validator
- Multer (file uploads)

**Integrations:**
- Razorpay (payments)
- Google Maps API (tracking)
- Nodemailer (email)
- Socket.io (real-time)
- AWS S3 (file storage)

## Project Structure

```
suply-chain-usa/
├── backend/
│   ├── config/          # Database and configuration
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Auth and validation middleware
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── services/        # Business logic services
│   ├── utils/           # Utility functions
│   └── server.js        # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── context/     # React context
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   └── utils/       # Helper functions
│   └── public/
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Razorpay Account
- Google Maps API Key

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd suply-chain-usa
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/supply-chain

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d

# Razorpay
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# Google Maps
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Frontend URL
CLIENT_URL=http://localhost:5173
```

4. Start MongoDB
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or start MongoDB service locally
mongod
```

5. Run the development servers
```bash
# Start both backend and frontend
npm run dev

# Or start individually
npm run dev:backend  # Backend on http://localhost:5000
npm run dev:frontend # Frontend on http://localhost:5173
```

### Database Models

- **User**: Stores user information for all roles (shipper, carrier, driver)
- **Shipment**: Manages shipment details, status, and tracking
- **Vehicle**: Stores vehicle information for carriers
- **Chat**: Handles in-app messaging
- **Notification**: Manages user notifications
- **Transaction**: Tracks payment transactions

### API Endpoints

**Authentication:**
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user
- POST `/api/auth/logout` - Logout user
- GET `/api/auth/me` - Get current user

**Shipments:**
- POST `/api/shipments` - Create shipment (shipper)
- GET `/api/shipments/my-shipments` - Get shipper's shipments
- GET `/api/shipments/available/list` - Get available shipments (carrier)
- PUT `/api/shipments/:id/accept` - Accept shipment (carrier)
- PUT `/api/shipments/:id/status` - Update status (driver)
- GET `/api/shipments/:id` - Get shipment details

**Carriers:**
- GET `/api/carriers/vehicles` - Get carrier's vehicles
- POST `/api/carriers/vehicles` - Add vehicle
- GET `/api/carriers/dashboard` - Get carrier dashboard stats

**Drivers:**
- GET `/api/drivers/dashboard` - Get driver dashboard
- GET `/api/drivers/active-shipments` - Get active shipments
- GET `/api/drivers/profile` - Get driver profile

## Deployment

### Backend Deployment (Render/Heroku/AWS)
1. Set environment variables
2. Connect MongoDB Atlas
3. Deploy using `npm start`

### Frontend Deployment (Vercel/Netlify)
1. Build with `npm run build`
2. Set `VITE_API_URL` to production backend URL
3. Deploy the `dist` folder

## Development

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests (if added)
cd frontend
npm test
```

### Code Style
This project uses ESLint for code linting. Run:
```bash
npm run lint
```

## License

MIT License

## Support

For issues and questions, please open an issue on the repository.