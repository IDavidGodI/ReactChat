import axios from "axios"
import environment from "../utils/environment"
const login = async (userName) => {
  const res = await axios.post(`${environment.server}/user/login`, { userName })
  return res.data
}

export default { login }
