const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const Booking = require('../models/Booking');
const ParkingSlot = require('../models/ParkingSlot');

// @route   GET /api/bookings/my
// @desc    Get user's bookings
// @access  Private
// @route   GET /api/bookings/analytics
// @desc    Get booking analytics
// @access  Private
router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    console.log('=== Analytics Request ===');
    const { range = 'day', date } = req.query;
    console.log('Range:', range, 'Date:', date);

    // Set start and end of the day in IST (UTC+5:30)
    const now = date ? new Date(date) : new Date();
    const startDate = new Date(now);
    const endDate = new Date(now);
    
    // Set start time to 00:00:00 IST (18:30:00 previous day UTC)
    startDate.setUTCHours(18, 30, 0, 0);
    if (now.getUTCHours() < 18) {
      startDate.setUTCDate(startDate.getUTCDate() - 1);
    }
    
    // Set end time to 23:59:59.999 IST (18:29:59.999 next day UTC)
    endDate.setUTCHours(18, 29, 59, 999);
    endDate.setUTCDate(endDate.getUTCDate() + 1);

    console.log('IST Date Range:', {
      start: startDate.toISOString(),
      end: endDate.toISOString()
    });

    // First, get all completed and active bookings in the date range
    const bookings = await Booking.find({
      startTime: { 
        $gte: startDate,
        $lte: endDate
      },
      status: { $in: ['completed', 'active', 'confirmed'] }
    })
    .sort({ startTime: 1 })
    .lean();

    console.log(`Found ${bookings.length} bookings in range`);

    // Calculate analytics
    let totalRevenue = 0;
    let activeBookings = 0;
    const groupedBookings = {};
    const slotOccupancy = {}; // Track slot occupancy for average calculation

    // First pass: calculate totals and group data
    bookings.forEach(booking => {
      // Count active bookings
      if (booking.status === 'active') {
        activeBookings++;
      }
      
      // Add to total revenue
      if (booking.totalPrice) {
        totalRevenue += Number(booking.totalPrice);
      }

      // Track slot occupancy
      const slotId = booking.parkingSlot?.toString() || 'unknown';
      if (!slotOccupancy[slotId]) {
        slotOccupancy[slotId] = 0;
      }
      slotOccupancy[slotId]++;

      // Group bookings by time range
      let key;
      const bookingDate = new Date(booking.startTime);
      
      if (range === 'day') {
        key = bookingDate.toISOString().substring(0, 13); // Group by hour
      } else if (range === 'week') {
        key = bookingDate.toISOString().split('T')[0]; // Group by day
      } else {
        key = bookingDate.toISOString().substring(0, 7); // Group by month
      }
      
      if (!groupedBookings[key]) {
        groupedBookings[key] = {
          date: bookingDate,
          count: 0,
          revenue: 0
        };
      }
      
      groupedBookings[key].count += 1;
      groupedBookings[key].revenue += booking.totalPrice || 0;
    });

    // Calculate average occupancy
    const totalSlots = await ParkingSlot.countDocuments();
    const averageOccupancy = totalSlots > 0 
      ? (Object.keys(slotOccupancy).length / totalSlots) * 100 
      : 0;

    // Calculate metrics
    const totalBookings = bookings.length;
    const averagePrice = totalBookings > 0 
      ? (totalRevenue / totalBookings).toFixed(2) 
      : 0;

    console.log('Calculated metrics:', {
      totalBookings,
      totalRevenue,
      activeBookings,
      averagePrice,
      averageOccupancy,
      totalSlots,
      occupiedSlots: Object.keys(slotOccupancy).length
    });

    // Convert groupedBookings to array for the frontend
    const bookingsArray = Object.entries(groupedBookings).map(([key, value]) => ({
      date: value.date,
      count: value.count,
      revenue: value.revenue
    }));

    // Send response
    res.json({
      success: true,
      bookings: bookingsArray,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalBookings,
      activeBookings,
      averagePrice: Number(averagePrice),
      averageOccupancy: Number(averageOccupancy.toFixed(2))
    });

  } catch (err) {
    console.error('Error in /analytics:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// @route   POST /api/bookings
// @desc    Create a new booking
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      parkingSlotId,
      vehicleNumber,
      vehicleType,
      startTime,
      endTime
    } = req.body;

    // Get parking slot
    const parkingSlot = await ParkingSlot.findById(parkingSlotId);
    if (!parkingSlot) {
      return res.status(404).json({ message: 'Parking slot not found' });
    }

    // Check availability
    if (parkingSlot.availableSlots <= 0) {
      return res.status(400).json({ message: 'No available slots' });
    }

    // Calculate duration and price
    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = Math.ceil((end - start) / (1000 * 60 * 60)); // in hours
    const totalPrice = duration * parkingSlot.pricePerHour;

    // Create booking
    const booking = new Booking({
      user: req.user.userId,
      parkingSlot: parkingSlotId,
      vehicleNumber,
      vehicleType,
      startTime: start,
      endTime: end,
      duration,
      totalPrice,
      status: 'confirmed'
    });

    await booking.save();

    // Update parking slot available slots
    parkingSlot.availableSlots -= 1;
    await parkingSlot.save();

    res.status(201).json({
      message: 'Booking created successfully',
      booking
    });
  } catch (err) {
    console.error('Error creating booking:', err);
    res.status(500).json({ 
      message: 'Failed to create booking',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// @route   PUT /api/bookings/:id/cancel
// @desc    Cancel a booking
// @access  Private
router.put('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('parkingSlot');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is authorized to cancel this booking
    if (booking.user.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    // Update booking status
    booking.status = 'cancelled';
    await booking.save();

    // Update parking slot available slots
    if (booking.parkingSlot) {
      booking.parkingSlot.availableSlots += 1;
      await booking.parkingSlot.save();
    }

    res.json({ 
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (err) {
    console.error('Error cancelling booking:', err);
    res.status(500).json({ 
      message: 'Failed to cancel booking',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// @route   GET /api/bookings/test/all
// @desc    Get all bookings (for testing)
// @access  Public
router.get('/test/all', async (req, res) => {
  try {
    const allBookings = await Booking.find({})
      .populate('parkingSlot user')
      .sort({ createdAt: -1 });
    console.log('All bookings in DB:', allBookings.length);
    res.json(allBookings);
  } catch (err) {
    console.error('Error fetching all bookings:', err);
    res.status(500).json({ error: err.message });
  }
});

// @route   GET /api/bookings/today
// @desc    Get today's bookings
// @access  Private
router.get('/today', authMiddleware, async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    
    const bookings = await Booking.find({
      startTime: { $gte: startOfDay },
      status: { $in: ['confirmed', 'completed', 'active'] }
    })
    .sort({ startTime: -1 })
    .lean();
    
    console.log(`Found ${bookings.length} bookings for today`);
    res.json(bookings);
  } catch (err) {
    console.error('Error fetching today\'s bookings:', err);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Add this after your other routes but before the module.exports line
router.get('/all-bookings', authMiddleware, async (req, res) => {
  try {
    const allBookings = await Booking.find({})
      .populate('parkingSlot', 'name')
      .populate('user', 'name email')
      .sort({ startTime: -1 })
      .lean();
    console.log('All bookings:', JSON.stringify(allBookings, null, 2));
    res.json(allBookings);
  } catch (err) {
    console.error('Error fetching all bookings:', err);
    res.status(500).json({ 
      message: 'Error fetching bookings',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;