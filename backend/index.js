const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const userRoutes = require('./routes/userRoute');
const saleRoutes= require('./routes/salesRoute');
const customerRoutes = require('./routes/customer');
const inventoryRoutes = require('./routes/Inventories');
const cashRoutes = require('./routes/cash');
const ledgerRoutes = require('./routes/ledger');
const incomeRoutes = require('./routes/income');
const reportsRoute = require('./routes/reports');
const jwt = require('jsonwebtoken');

const connectDB = require('./config/db');
require('dotenv').config();

const app = express();

app.use(cors());

// const allowedOrigin = process.env.FRONTEND_URL;

// app.use(cors({
//   origin: function (origin, callback) {
//     if (!origin || origin === allowedOrigin) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   credentials: true
// }));

// // Preflight handling
// app.options('*', cors({
//   origin: allowedOrigin,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   credentials: true
// }));

app.use(express.json()); // Must be before routes
// Middleware to parse JSON request bodies
app.use(bodyParser.json());

// JWT authentication middleware
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// Use the user routes (login route should be public)
app.use('/api/users', userRoutes);
// Protect all other routes with JWT
app.use(authenticateJWT);
app.use('/api/sales', saleRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/cash', cashRoutes);
app.use('/api/ledger', ledgerRoutes); 
app.use('/api/income', incomeRoutes);
app.use('/api/reports', reportsRoute);

// Connect to MongoDB
connectDB();

// Start the server
app.listen(5000, () => {
  console.log('Server running on port 5000');
});
