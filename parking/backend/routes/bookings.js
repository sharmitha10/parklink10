const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const User = require('../models/User');
const ParkingSlot = require('../models/ParkingSlot');
const { authMiddleware } = require('../middleware/auth'); // Make sure this is destructured if needed

// @route   GET /api/bookings/analytics
// @desc    Get booking analytics
// @access  Private
// In backend/routes/bookings.js
// In backend/routes/bookings.js - Update the analytics endpoint
router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const { range = 'day', date } = req.query;
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get all parking slots owned by this admin
    const adminSlots = await ParkingSlot.find({ owner: user._id });
    const slotIds = adminSlots.map(slot => slot._id);

    // Set up date range
    let startDate, endDate;
    const now = date ? new Date(date) : new Date();
    
    if (range === 'day') {
      startDate = new Date(now);
      startDate.setUTCHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setUTCHours(23, 59, 59, 999);
    } else if (range === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay()); // Start of week
      startDate.setUTCHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6); // End of week
      endDate.setUTCHours(23, 59, 59, 999);
    } else { // month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setUTCHours(0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endDate.setUTCHours(23, 59, 59, 999);
    }

    // Get all bookings for admin's slots in the date range
    const bookings = await Booking.find({
      parkingSlot: { $in: slotIds },
      status: { $in: ['confirmed', 'active', 'completed'] },
      startTime: { $lte: endDate },
      endTime: { $gte: startDate }
    }).populate('parkingSlot', 'pricePerHour');

    // Initialize data structures
    let chartData = [];
    let totalBookings = 0;
    let totalRevenue = 0;
    let activeBookings = 0;
    const nowTime = new Date();

    if (range === 'day') {
  // For day view, show hourly data
  const hourlyBookings = Array(24).fill(0);
  const hourlyRevenue = Array(24).fill(0);
  const nowTime = new Date();
  const today = new Date(nowTime);
  today.setHours(0, 0, 0, 0);

  bookings.forEach(booking => {
    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);
    
    // Only process if booking is for today
    if (start.toDateString() === today.toDateString()) {
      // Count as active if booking spans current time
      if (start <= nowTime && end >= nowTime) {
        activeBookings++;
      }

      // Calculate booking duration in hours
      const durationHours = (end - start) / (1000 * 60 * 60);
      const pricePerHour = booking.parkingSlot?.pricePerHour || 0;
      const bookingRevenue = durationHours * pricePerHour;
      totalRevenue += bookingRevenue;
      totalBookings++;

      // Get the hour of the booking start time
      const startHour = start.getHours();
      const endHour = Math.min(end.getHours(), 23); // Cap at 23:59
      
      // Distribute booking across hours
      for (let hour = startHour; hour <= endHour; hour++) {
        hourlyBookings[hour]++;
        // Calculate revenue for this hour (proportional if booking spans multiple hours)
        const hourEnd = Math.min(hour + 1, 24);
        const hourStart = Math.max(hour, start.getHours());
        const hourDuration = Math.min(hourEnd, end.getHours() + (end.getMinutes() / 60)) - 
                           Math.max(hourStart, start.getHours() + (start.getMinutes() / 60));
        hourlyRevenue[hour] += (hourDuration * pricePerHour);
      }
    }
  });

  // Format chart data
  chartData = Array(24).fill().map((_, hour) => {
    const hourStr = hour.toString().padStart(2, '0') + ':00';
    return {
      name: hourStr,
      bookings: hourlyBookings[hour],
      revenue: Math.round(hourlyRevenue[hour] * 100) / 100
    };
  });
}

     else if (range === 'week') {
      // For week view, show daily data
      const dailyBookings = Array(7).fill(0);
      const dailyRevenue = Array(7).fill(0);
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      bookings.forEach(booking => {
        const start = new Date(booking.startTime);
        const end = new Date(booking.endTime);
        
        if (start <= nowTime && end >= nowTime) {
          activeBookings++;
        }

        const durationHours = (end - start) / (1000 * 60 * 60);
        const pricePerHour = booking.parkingSlot?.pricePerHour || 0;
        const bookingRevenue = durationHours * pricePerHour;
        totalRevenue += bookingRevenue;
        totalBookings++;

        const dayOfWeek = start.getDay();
        dailyBookings[dayOfWeek]++;
        dailyRevenue[dayOfWeek] += bookingRevenue;
      });

      chartData = Array(7).fill().map((_, day) => ({
        name: dayNames[day],
        bookings: dailyBookings[day],
        revenue: Number(dailyRevenue[day].toFixed(2))
      }));

    }else if (range === 'month') {
  // For month view, show weekly data
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  // Calculate the number of weeks in the month
  const firstWeekDay = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysInMonth = lastDay.getDate();
  const weeksInMonth = Math.ceil((firstWeekDay + daysInMonth) / 7);
  
  const weeklyBookings = Array(weeksInMonth).fill(0);
  const weeklyRevenue = Array(weeksInMonth).fill(0);
  const weekStarts = Array(weeksInMonth).fill().map((_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth(), 1 + (i * 7) - firstWeekDay);
    return date;
  });
  bookings.forEach(booking => {
    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);
    
    // Count as active if booking spans current time
    if (start <= nowTime && end >= nowTime) {
      activeBookings++;
    }
    // Calculate booking duration in hours
    const durationHours = (end - start) / (1000 * 60 * 60);
    const pricePerHour = booking.parkingSlot?.pricePerHour || 0;
    const bookingRevenue = durationHours * pricePerHour;
    totalRevenue += bookingRevenue;
    totalBookings++;
    // Find which week this booking belongs to
    const bookingDate = new Date(booking.startTime);
    const weekOfMonth = Math.floor((bookingDate.getDate() + firstWeekDay - 1) / 7);
    const weekIndex = Math.min(weekOfMonth, weeksInMonth - 1);
    
    weeklyBookings[weekIndex]++;
    weeklyRevenue[weekIndex] += bookingRevenue;
  });
  // Format chart data
  chartData = Array(weeksInMonth).fill().map((_, week) => {
    const startDate = new Date(weekStarts[week]);
    const endDate = new Date(weekStarts[Math.min(week + 1, weeksInMonth - 1)]);
    
    return {
      name: `Week ${week + 1} (${startDate.getDate()}/${startDate.getMonth() + 1} - ${endDate.getDate()}/${endDate.getMonth() + 1})`,
      bookings: weeklyBookings[week],
      revenue: Math.round(weeklyRevenue[week] * 100) / 100
    };
  });
}

    // Calculate statistics
    const averagePrice = totalBookings > 0 
      ? Number((totalRevenue / totalBookings).toFixed(2))
      : 0;

    const currentOccupancy = slotIds.length > 0
      ? Math.min(100, Math.round((activeBookings / slotIds.length) * 100))
      : 0;

    res.json({
      success: true,
      data: {
        chartData,
        stats: {
          totalBookings,
          totalRevenue: Number(totalRevenue.toFixed(2)),
          activeBookings,
          averagePrice,
          currentOccupancy
        }
      }
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

    console.log('Creating booking with:', {
      parkingSlotId,
      pricePerHour: parkingSlot.pricePerHour,
      duration,
      totalPrice
    });

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
// @route   GET /api/bookings/my
// @desc    Get user's bookings
// @access  Private
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.userId })
      .populate('parkingSlot', 'name address location pricePerHour')
      .sort({ startTime: -1 });
    
    res.json(bookings);
  } catch (err) {
    console.error('Error fetching user bookings:', err);
    res.status(500).json({ 
      message: 'Failed to fetch bookings',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;