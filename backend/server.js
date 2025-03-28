const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const {notFound,errorHandler} = require("./middleware/errorMiddleware");
const cors = require('cors');
const frontendUrl = process.env.FRONTEND_URL;

dotenv.config();        
connectDB();
const app = express();



app.use(cors({
    origin: 'https://chat-app-backend-uoec.onrender.com',  // Allow frontend to access
    // methods: 'GET,POST,PUT,DELETE,OPTIONS',
    // allowedHeaders: 'Content-Type,Authorization'
}));
// app.use(cors({
//     origin: frontendUrl,
//     credentials: true,
//   }));
  
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// app.get("/",(req,res) => {
//     res.send("Api is running");
// });

app.use("/api/user",userRoutes);
app.use("/api/chat",chatRoutes);
app.use("/api/message",messageRoutes);

app.use(notFound);
app.use(errorHandler);

const port=process.env.PORT || 5000;
const server = app.listen(port, console.log(`server running on PORT : ${port}`));

const io = require("socket.io")(server,{
    pingTimeout: 60000,
    cors: {
        origin: 'https://chat-app-backend-uoec.onrender.com', 
        credentials: true
    }
});

io.on("connection", (socket) => {
    console.log("Connected to socket.io");
    socket.on("setup", (userData) => {
        socket.join(userData._id);
        socket.emit("connected");
    });

    socket.on("join chat",(room) => {
        socket.join(room);
        console.log("User Joined Room: "+room); 
    });

    socket.on("typing", (room) => socket.in(room).emit("typing"));
    socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));
    socket.on("new message", (newMessageReceived) => {
        var chat = newMessageReceived.chat;
        if(!chat.users) return console.log("chat.users not defined");
        
        chat.users.forEach((user) => {
            if (user._id === newMessageReceived.sender._id) return;

            socket.in(user._id).emit("message received",newMessageReceived);
        });
    });

    socket.on("message reaction", ({ messageId, reactions }) => {
        socket.in(messageId).emit("message reaction received", { messageId, reactions });
    });

    socket.on("message edited", (editedMessage) => {
        socket.in(editedMessage.chat._id).emit("message edited received", editedMessage);
    });

    socket.on("message forwarded", (forwardedMessage) => {
        socket.in(forwardedMessage.chat._id).emit("message forwarded received", forwardedMessage);
    });

    socket.on("message pinned", (pinnedMessage) => {
        socket.in(pinnedMessage.chat._id).emit("message pinned received", pinnedMessage);
    });

    socket.on("message read", ({ messageId, readBy }) => {
        socket.in(messageId).emit("message read received", { messageId, readBy });
    });

    socket.off("setup",() => {
        console.log("USER DISCONNECTED");
        socket.leave(userData._id);
    })
});
