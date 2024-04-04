const commons = require("../commons")
const User = require("../model/user")

const chatRouter = require("express").Router()

chatRouter.get("/", async (req, res) => {
  const { online_users } = commons
  const online_users_data = await Promise.all(online_users.map(async (u) => {
    const user = await User.findById(u.id)
    const juser = user.toJSON()
    juser.online = true;
    return juser;
  }))
  res.json(online_users_data)
})

module.exports = chatRouter
