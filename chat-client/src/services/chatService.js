import axios from "axios"
import environment from "../utils/environment"

const getChats = async () => {
  const res = await axios.get(`${environment.server}/chats`)
  return res.data
}

export default { getChats }
