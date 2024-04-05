const mongoose = require("mongoose")

const chatSchema = new mongoose.Schema({
  users: [{
    type: mongoose.Types.ObjectId,
    ref: "User"
  }],
  messages: [{
    id: {type: mongoose.Types.ObjectId},
    from: {type: String},
    to: {type: String},
    content: {type: String},
    timeStamp: {type: Date},
    status: {type: String, enum: ["sent", "received", "read"], default: "sent"}
  }],
  chatType: {type: String, enum: ["direct", "group"], default: "direct"}
})

chatSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();

    delete returnedObject._id;
    delete returnedObject.__v;
    delete returnedObject.passwordHash;
  }
})


const Chat = mongoose.model("Chat", chatSchema)


module.exports = Chat;
