const express = require("express")
require("dotenv").config()
const { Server: SocketServer } = require("socket.io")
const usersRouter = require("./controllers/user")
const app = express()
const cors = require("cors")
const mongoose = require("mongoose")
const User = require("./model/user")
const socketServer = require("./socket_server")
require("express-async-errors")
const chatRouter = require("./controllers/chat")
const Chat = require("./model/chat")


mongoose.set("strictQuery", false)

mongoose.connect(`mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PSWD}@cluster0.hfxufys.mongodb.net/JoseDB?retryWrites=true&w=majority&appName=Cluster0`)
  .then(() => {
    console.log("Connected to mongoDB")
  })
  .catch((error) => {
    console.log("Error connecting to MongoDB", error.message)
  })

app.use(cors())

app.use(express.json())
app.use("/user", usersRouter)
app.use("/chats", chatRouter)

app.get("/", async (req, res) => {
  const users = await User.find({})
  const user = users[0]?.toJSON();
  
  res.send(";)")
})

app.post("/:user", async (req, res) => {
  const saved = await User.create({userName: req.params.user})
  
  res.json(saved)
})

app.use((error, req, res, next) => {
  console.log(error)
  next(error)
})

const server = app.listen(process.env.PORT, () => {
  console.log("Server running", process.env.PORT)

})

socketServer.init(
  new SocketServer(server, {
    cors: {
      origin: "*"
    }
  })
)
