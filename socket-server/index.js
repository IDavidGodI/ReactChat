const express = require("express")
require("dotenv").config()
const { Server: SocketServer } = require("socket.io")
const usersRouter = require("./controllers/user")
const app = express()
const cors = require("cors")
const mongoose = require("mongoose")
const User = require("./model/user")
const commons = require("./commons")
const chatRouter = require("./controllers/chat")

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
  console.log(online_users)
})

const server = app.listen(process.env.PORT, () => {
  console.log("Server running", process.env.PORT)

})

const io = new SocketServer(server, {
  cors: {
    origin: "*"
  }
})

const getSocketById = (id) => {
  return io.sockets.sockets.get(id)
}

io.on("connection", socket => {
  socket.on("disconnect", async () => {
    const user = commons.online_users.find(
      u =>
        !!u.sockets.find(s => socket.id === s)

    )
    if (!user) return
    console.log("disconnecting: ", (await User.findById(user.id)).toJSON())

    user.sockets = user.sockets.filter(s => s !== socket.id);
    console.log("clearing user: ", user)
    if (user.sockets.length === 0) {
      commons.online_users = commons.online_users.filter(u => u.id !== user.id)
      console.log(commons.online_users)
      socket.broadcast.emit("state_change")
    }
  })
  socket.on("login", user => {
    const { online_users } = commons
    if (!user || !user.id || !user.userName) {
      socket.emit("badUser", { error: "no user" })
      return
    }
    const dbuser = User.findById(user.id)
    const online_user = online_users.find(u => user.id === u.id)

    if (online_user) {
      online_user.sockets.push(socket.id)
      return
    }
    if (!!dbuser) {
      online_users.push({ id: user.id, sockets: [socket.id] })
      socket.broadcast.emit("state_change")
    }

    socket.on("message", message => {
      const from_user = online_users.find(u => message.from === u.id)
      const to_user = online_users.find(u => message.to === u.id)

      if (from_user) {
        if (to_user) {
          const to_sockets = to_user.sockets.map(s => getSocketById(s))

          to_sockets.forEach(s => {
            s.emit("message", message)
          });

        }
      }

    })

  })
})



