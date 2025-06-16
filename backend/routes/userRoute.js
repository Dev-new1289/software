const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Path to your User model
require('dotenv').config();

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

// User Registration Route
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({ email, password: hashedPassword });

    // Save the user to the database
    await newUser.save();

    // Send response
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// User Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log("Login request received", req.body);
  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare the password with the hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
    // Send response with the token
    res.status(200).json({ message: 'Login successful', token });
    
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

module.exports = router;
