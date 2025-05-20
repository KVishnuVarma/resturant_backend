// server/controllers/deliveryBoyController.js

const DeliveryBoy = require('../models/DeliveryBoy.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const socketManager = require('../utils/socketManager');

// Helper function to generate JWT token
const generateToken = (deliveryBoy) => {
  return jwt.sign(
    { id: deliveryBoy._id, role: 'delivery' },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};
// const User = require('../models/User'); // Add this line

const createDeliveryBoy = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validate required fields
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ 
        message: 'All fields are required',
        required: ['name', 'email', 'password', 'phone']
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if delivery boy already exists
    const existingDeliveryBoy = await DeliveryBoy.findOne({ email: email.toLowerCase() });
    if (existingDeliveryBoy) {
      return res.status(400).json({ message: 'Delivery boy already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new delivery boy
    const deliveryBoy = new DeliveryBoy({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone
    });

    await deliveryBoy.save();

    // Generate token
    const token = jwt.sign(
      { id: deliveryBoy._id, role: 'delivery' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({
      token,
      deliveryBoy: {
        id: deliveryBoy._id,
        name: deliveryBoy.name,
        email: deliveryBoy.email,
        status: deliveryBoy.status
      }
    });
  } catch (err) {
    console.error('Error creating delivery boy:', err);
    res.status(500).json({ message: 'Failed to create delivery boy' });
  }
};

const loginDeliveryBoy = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find delivery boy
    const deliveryBoy = await DeliveryBoy.findOne({ email: email.toLowerCase() });
    if (!deliveryBoy) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    if (!deliveryBoy.password || !password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, deliveryBoy.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: deliveryBoy._id, role: 'delivery' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' } // Extended token expiry for testing
    );

    res.json({
      token,
      deliveryBoy: {
        id: deliveryBoy._id,
        name: deliveryBoy.name,
        email: deliveryBoy.email,
        status: deliveryBoy.status,
        phone: deliveryBoy.phone
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login failed' });
  }
};

const getAllDeliveryBoys = async (req, res) => {
  try {
    const boys = await DeliveryBoy.find().select('-password');
    res.json(boys);
  } catch (err) {
    console.error('Error fetching delivery boys:', err);
    res.status(500).json({ message: 'Failed to fetch delivery boys' });
  }
};

const updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const boy = await DeliveryBoy.findById(id);
    if (!boy) {
      return res.status(404).json({ message: 'Delivery boy not found' });
    }

    // Only allow the delivery boy to update their own status
    if (req.user.role === 'delivery' && req.user.id !== id) {
      return res.status(403).json({ message: 'Not authorized to update other delivery boy status' });
    }

    boy.status = status;
    await boy.save();
    
    res.json(boy);
  } catch (err) {
    console.error('Error updating status:', err);
    res.status(500).json({ message: 'Failed to update status' });
  }
};

const getAvailableDeliveryBoys = async (req, res) => {
  try {
    // Find all users with role 'delivery' and not busy
    const availableDeliveryBoys = await User.find({
      role: 'delivery',
      // You might want to add additional filters here
    }).select('_id name email phone');

    res.json({
      count: availableDeliveryBoys.length,
      deliveryBoys: availableDeliveryBoys.map(boy => ({
        id: boy._id,
        name: boy.name,
        email: boy.email,
        phone: boy.phone
      }))
    });
  } catch (err) {
    console.error('Error fetching available delivery boys:', err);
    res.status(500).json({ message: 'Failed to fetch available delivery boys' });
  }
};

const getDeliveryBoyDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // Find delivery boy by ID
    const deliveryBoy = await DeliveryBoy.findById(id)
      .select('-password') // Exclude password
      .populate({
        path: 'deliveries.order',
        select: 'status totalAmount createdAt deliveredAt'
      });

    if (!deliveryBoy) {
      return res.status(404).json({ message: 'Delivery boy not found' });
    }

    // Check authorization - only admin or the delivery boy themselves can view details
    if (req.user.role === 'delivery' && req.user._id.toString() !== id) {
      return res.status(403).json({ message: 'Not authorized to view other delivery boy details' });
    }

    res.json({
      id: deliveryBoy._id,
      name: deliveryBoy.name,
      email: deliveryBoy.email,
      phone: deliveryBoy.phone,
      status: deliveryBoy.status,
      statistics: {
        earnings: deliveryBoy.earnings,
        ratings: deliveryBoy.ratings,
        performance: deliveryBoy.performance
      },
      recentDeliveries: deliveryBoy.deliveries
        .sort((a, b) => b.deliveredAt - a.deliveredAt)
        .slice(0, 10) // Get last 10 deliveries
    });
  } catch (err) {
    console.error('Error fetching delivery boy details:', err);
    res.status(500).json({ message: 'Failed to fetch delivery boy details' });
  }
};

const updateLocation = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { latitude, longitude } = req.body;

    // Validate location data
    if (!latitude || !longitude) {
      return res.status(400).json({ 
        message: 'Location coordinates are required',
        required: ['latitude', 'longitude']
      });
    }

    // Find active order
    const order = await Order.findById(orderId)
      .populate('user', 'name email')
      .populate('assignedTo', 'name');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify delivery boy assignment
    if (order.assignedTo._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this order\'s location' });
    }

    // Broadcast location update
    socketManager.handleDeliveryLocationUpdate({
      orderId: order._id,
      location: { latitude, longitude },
      deliveryBoyId: req.user._id,
      userId: order.user._id
    });

    res.json({ 
      message: 'Location updated successfully',
      location: { latitude, longitude }
    });
  } catch (err) {
    console.error('Error updating location:', err);
    res.status(500).json({ message: 'Failed to update location' });
  }
};

// Export controller functions
module.exports = {
  createDeliveryBoy,
  loginDeliveryBoy,
  getAllDeliveryBoys,
  updateStatus,
  getAvailableDeliveryBoys,
  getDeliveryBoyDetails,
  updateLocation // Add new export
};
