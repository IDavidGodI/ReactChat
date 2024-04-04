const usersRouter = require("express").Router()
const User = require("../model/user")


usersRouter.post("/login", async (req, res) => {
  const { userName } = req.body
  const user = await User.findOne({ userName })
  if (!user) {
    res.status(401).json({ error: "Not a valid user" })
    return

  }
  res.json({ user })
})

module.exports = usersRouter



