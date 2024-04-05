const commons = require("../commons")
const Chat = require("../model/chat")
const User = require("../model/user")

const chatRouter = require("express").Router()

chatRouter.get("/", async (req, res) => {
  const {user} = req.query
  const { online_users } = commons
  const chats = (await Chat.find({users: user.id}).select("users"))
  .map(c => 
    ({
      chatId:c.id, 
      id: (c.users.filter(u => u.toJSON()!==user.id))[0]
    })
  )
  const online_users_data = await Promise.all(online_users.map(async (u) => {
    const user = await User.findById(u.id)
    const juser = user.toJSON()
    juser.online = true;
    const chat = chats.find(c => c.id.toJSON()===u.id )
    if (chat) juser.chatId=chat.chatId
    delete juser.chats
    return juser;
  }))

  console.log("chats: ", chats)
  const offline_users_data = await Promise.all(
    chats.filter(c => 
      !online_users.map(u=>u.id).includes(c.id.toJSON())
    )
    .map(async (u) => {
    
      const user = await User.findById(u.id)
      const juser = user.toJSON()
      juser.online = false;
      juser.chatId = u.chatId
      delete juser.chats
      return juser;
    })
  )


  res.json(online_users_data.concat(offline_users_data))
})
chatRouter.get("/:id", async (req, res) => {
  const id = req.params.id;
  console.log("chatId: ",id)
  const chat = await Chat.findById(id);
  if (!chat){
    res.status(404).json({error: "Chat no existe xD"})
    return
  }
  console.log(chat)
  const {messages} = chat
  res.json(messages)
})
module.exports = chatRouter
