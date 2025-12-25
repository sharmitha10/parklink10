require('dotenv').config();

// Debugging: Check if the environment variable is loaded
console.log('MONGODB_URI:', process.env.MONGODB_URI);
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');

const app = express();
const server = http.createServer(app);

const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:5000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

const io = socketIo(server, {
  cors: corsOptions
});

// Middleware
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to database
connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/parking', require('./routes/parking'));
app.use('/api/bookings', require('./routes/bookings'));

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Parking Management API is running' });
});

// New health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

const net = require('net');

// Function to check if a port is available
const isPortAvailable = (port) => {
  return new Promise((resolve) => {
    const server = net.createServer()
      .once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          resolve(false);
        } else {
          resolve(true);
        }
      })
      .once('listening', () => {
        server.once('close', () => {
          resolve(true);
        }).close();
      })
      .listen(port);
  });
};

// Function to find the next available port
const findAvailablePort = async (startPort) => {
  let port = startPort;
  while (port < 6000) { // Try ports up to 6000
    const available = await isPortAvailable(port);
    if (available) return port;
    port++;
  }
  throw new Error('No available ports found');
};

// Start the server
const startServer = async () => {
  try {
    // Use port 5002 by default to avoid conflicts
    const PORT = process.env.PORT || 5002;
    const availablePort = await findAvailablePort(Number(PORT));
    
    // If the port is different from the default, log a message
    if (availablePort !== Number(PORT)) {
      console.log(`Port ${PORT} is in use, using port ${availablePort} instead`);
    }
    
    server.listen(availablePort, () => {
      console.log(`Server is running on port ${availablePort}`);
      console.log(`Socket.io is ready for real-time updates`);
      console.log(`http://localhost:${availablePort}`);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
