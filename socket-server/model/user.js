const mongoose = require("mongoose")
const uniqueValidator = require("mongoose-unique-validator")

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
    unique: true,
    minLength: 3
  },
})

userSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();

    delete returnedObject._id;
    delete returnedObject.__v;
    delete returnedObject.passwordHash;
  }
})

userSchema.plugin(uniqueValidator)

const User = mongoose.model("User", userSchema)


module.exports = User;
