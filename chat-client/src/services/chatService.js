import axios from "axios"
import environment from "../utils/environment"

const getChats = async (user) => {
  const res = await axios.get(`${environment.server}/chats`, {params: {user}})
  return res.data
}

const getMessages = async (chatId) => {
  const res = await axios.get(`${environment.server}/chats/${chatId}`)
  return res.data
}

const updateMessagesStatus = async (chatId,messageId, status) => {
  const res = await axios.post(`${environment.server}/chats/${chatId}`, {messageId, status})
  return res.data
}
export default { getChats, getMessages }
