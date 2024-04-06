// const mongoose = require("mongoose")
const User = require("./model/user")
const Chat = require("./model/chat")
let io
let online_users = []

const getSocketById = (id) => {
  return io.sockets.sockets.get(id)
}

const getUserSockets = (user) => {
  return user.sockets.map(s => getSocketById(s))
}

const findUserOnline = (id) => {
  return online_users.find(u => id === u.id)
}
const getUserSocketsById = (userId) => {
  const user = findUserOnline(userId)

  return user?.sockets.map(s => getSocketById(s))
}

const getUsersDirectChat = (u1, u2) => {
  return Chat.findOne({$and:[{users: u1}, {users: u2}], chatType: "direct"})
}

const emitToUserSockets = (user, event, payload) => {
  const sockets = getUserSockets(user)
  sockets.forEach((s)=>{
    s.emit(event, payload)
  })
}

const emitToUserSocketsById = (user, event, payload) => {
  const sockets = getUserSocketsById(user)
  sockets?.forEach((s)=>{
    s.emit(event, payload)
  })
}

const init = (server) => {
  if (!!io) return
  io = server
  
  io.on("connection", socket => {
    socket.on("disconnect", async () => {
      const user = online_users.find(
        u =>
          !!u.sockets.find(s => socket.id === s)
  
      )
      if (!user) return
  
      user.sockets = user.sockets.filter(s => s !== socket.id);
      if (user.sockets.length === 0) {
        console.log("clearing user: ", user)
        online_users = online_users.filter(u => u.id !== user.id)
        socket.broadcast.emit("state_change")
      }
    })
    socket.on("login", user => {
      if (!user || !user.id || !user.userName) {
        socket.emit("badUser", { error: "no user" })
        return
      }
      const dbuser = User.findById(user.id)
      const online_user = findUserOnline(user.id)
      console.log("Login usuario")
      if (online_user) {
        online_user.sockets.push(socket.id)
  
      }else {
        if (!!dbuser) {
          console.log("Notificando conexion")
          online_users.push({ id: user.id, sockets: [socket.id], online: true })
          socket.broadcast.emit("state_change")
        }
      }
      socket.emit("login")
    })
    socket.on("message", async (message) => {
      const from_user = findUserOnline(message.from)
      const to_user = findUserOnline(message.to)
      
      if (from_user) {
        let chat = await getUsersDirectChat(message.from, message.to)
        const chatCreated = !chat
        if (chatCreated){
          const users = await User.find({$or: [{_id: message.from},{_id: message.to}]})
          const newChat = new Chat({users})
          chat = await newChat.save()
        }
        
        
        chat.messages = chat.messages.concat(message)
        chat = await chat.save()
        const db_message = chat.messages[chat.messages.length-1]
        let to_notify = []
        const from_sockets = getUserSockets(from_user)
        to_notify = to_notify.concat(from_sockets)
        if (to_user) {
          const to_sockets = getUserSockets(to_user)
          to_notify = to_notify.concat(to_sockets)
        }
        to_notify.forEach(s => {
          s.emit("message", {...db_message.toJSON(), chatCreated})
        });
      }
  
    })
  
    socket.on("message_status", async (payload) => {
      const chat = await getUsersDirectChat(...payload.users)
      if (!chat) return
      if (payload.messageId){
        const message = chat.messages.find(m => payload.messageId===m._id.toJSON())
        message.status = payload.status
      }
      if (payload.toAllMessages){
        const message = chat.messages
        .filter(m => m.status!==payload.status && payload.users[0]===m.from)
        message.forEach(m => {
          m.status = payload.status
        })

      }
      await chat.save()
      const user = findUserOnline(payload.users[0])
      if (user){
        console.log("notificando recibido")
        emitToUserSockets(user, "message_status", payload.users[1])
      }
      // socket.emit("message_status")
    })
  })
}

const getOnlineUsers = () => {
  return online_users
}

module.exports = {
  getSocketById,
  getUserSockets,
  findUserOnline,
  getUserSocketsById,
  getUsersDirectChat,
  emitToUserSockets,
  emitToUserSocketsById,
  init,
  getOnlineUsers
}


