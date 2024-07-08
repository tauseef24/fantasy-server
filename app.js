const express = require('express');
const http = require('http');
const { Server:SocketServer }= require("socket.io")
const mongoose = require('mongoose');
const cors = require('cors');
const adminRoutes = require('./routes/fantasy-admin.js');
const userRoutes = require('./routes/fantasy-users.js');
const userAuthRoutes = require('./routes/fantasy-users-auth.js')

require('dotenv').config();

const app = express();
const server = http.createServer(app);

const io = new SocketServer(server, {
    cors: {
        origin: ["http://localhost:5173", "http://localhost:5174"], // Array of allowed origins
        methods: ["GET", "POST"] // Allowed methods
    }
});



app.use(cors());

// Socket connection
io.on('connection', (socket) => {
    console.log('A user connected');
});

try {
    mongoose.connect("mongodb://localhost:27017/fantacy-11");
    console.log("connected to db");
} catch (error) {
    console.log('unhandledRejection', error.message);   
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/admin", adminRoutes(io));
app.use("/user", userRoutes);
app.use("/", userAuthRoutes);

server.listen(process.env.PORT || 8000, () => {
    console.log("Server is live on port 8000");
});
