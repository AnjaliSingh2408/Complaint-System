import 'dotenv/config'
import {app} from './app.js'
import { setIO } from './utils/socket.js';

const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
setIO(io);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('User connected: ', socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);
    console.log("User with ID: ", userId, "joined room: ", userId);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected: ", socket.id);
  });
});

dotenv.config({
    path:'./.env'
});

connectDB()
.then(()=>{
    port=process.env.port||3000
    app.listen(port, ()=>{
        console.log(`Server is Listening on port ${port}`)
    })
})
.catch((err)=>{
    console.log(`DB Connection Failed: ${err.message}`)
})