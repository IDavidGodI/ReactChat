const socketServer = require("../socket_server")
const mongoose = require("mongoose")
const Chat = require("../model/chat")
const User = require("../model/user")
const {emitToUserSocketsById} = socketServer;

const chatRouter = require("express").Router()

chatRouter.get("/", async (req, res) => {
  const {user} = req.query
  const online_users = socketServer.getOnlineUsers()
  const saved_chats = (await Chat.find({users: user.id}))
  .map(c => 
    {
      const to_user_id = c.users
      .filter(u => u.toJSON()!==user.id)
      .map(id => id.toJSON())[0]
      let to_notify = null, from_notify = null;
      
      const last_message = c.messages[c.messages.length-1]
      const last_activity = last_message.timeStamp
      const new_messages = c.messages.filter(m => m.to===user.id && (m.status==="sent" || m.status==="received"))
      const sent_messages = new_messages.filter(m => m.status==="sent")
      sent_messages.forEach(m => {
        if (!to_notify) to_notify = m.from
        if (!from_notify) from_notify = m.to
        m.status = "received"
      })

      c.save()
      emitToUserSocketsById(to_notify, "message_status", from_notify)
    return ({
      chatId:c.id, 
      id: to_user_id,
      last_activity,
      new_messages: new_messages.length
    })
  }
  )
  const chats_data = saved_chats.map(c => {
    const found = online_users.find(u => c.id===u.id)
    return found? {...c, ...found} : c
  })

  const online_data = online_users.filter(u => !(chats_data.find(c => c.id===u.id)))
  const users_data = await Promise.all(chats_data.concat(online_data).map(async (u) => {
    const user = await User.findById(u.id)
    const juser = user.toJSON()
    juser.online = !!u.online;
    if (u.chatId) {
      juser.chatId=u.chatId
      juser.last_activity = u.last_activity
      juser.new_messages = u.new_messages
    }
    delete juser.chats
    return juser;
  }))
  console.log("users_data: ", online_users)
  res.json(users_data)
})
chatRouter.get("/:id", async (req, res) => {
  const id = req.params.id;
  console.log("chatId: ",id)
  if (!mongoose.isValidObjectId(id)){
    res.status(404).json({error: "No es un chat valido"})
    return
  }
  const chat = await Chat.findById(id);
  if (!chat){
    res.status(404).json({error: "Chat no existe xD"})
    return
  }
  const {messages} = chat
  res.json(messages)
})

chatRouter.post("/:id", async (req, res) => {
  const id = req.params.id;
  if (!mongoose.isValidObjectId(id)){
    res.status(404).json({error: "No es un chat valido"})
    return
  }
  const {messageId, status} = req.body
  const chat = await Chat.findById(id);
  // const message
  if (!chat){
    res.status(404).json({error: "Chat no existe xD"})
    return
  }
  const {messages} = chat
  res.json(messages)
})
module.exports = chatRouter
