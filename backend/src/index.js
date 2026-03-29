import 'dotenv/config'
import { app } from './app.js'
import { setIO } from './utils/socket.js'
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './db/database.js';
import { Message } from './models/message.models.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = http.createServer(app);
const io = new Server(server);

setIO(io);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);
    console.log("User joined:", userId);
  });

  socket.on("join_complaint_room", ({ complaintId, userId }) => {
    socket.join(complaintId);
    console.log(`User ${userId} joined room for complaint: ${complaintId}`);
  });

  socket.on("send_message", async ({ complaintId, senderId, text }) => {
    try {
      const newMessage = await Message.create({
          complaintId,
          senderId,
          text
      });

      io.to(complaintId).emit("receive_message", newMessage);
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

connectDB()
  .then(() => {
    const port = process.env.PORT || 3000;

    server.listen(port, () => {
      console.log(`Server is listening on port ${port}`);
    });

  })
  .catch((err) => {
    console.log(`DB Connection Failed: ${err.message}`);
  });