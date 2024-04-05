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
export default { getChats, getMessages }
