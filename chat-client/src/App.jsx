import { io } from "socket.io-client"
import environment from "./utils/environment.js"
import { useDispatch, useSelector } from "react-redux"
import { loadUser, setField, setLoggedIn, setUser } from "./reducers/userReducer.js"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import usersService from "./services/usersService.js"
import { useEffect } from "react"
import { addMessage, setMessage, setSelectedChat } from "./reducers/chatReducer.js"

import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom"
import chatService from "./services/chatService.js"
import { useMemo } from "react"

const socket = io(environment.server, { autoConnect: false })


const Login = () => {

  useEffect(() => {
    socket.disconnect();
  }, [])

  const dispatch = useDispatch()
  const user = useSelector(state => state.user.field)
  const userMutation = useMutation({
    mutationFn: () => usersService.login(user),
    onSuccess: res => {
      dispatch(setUser(res.user))
      dispatch(setField(""))

    },
    onError: error => { console.log(error) }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    userMutation.mutate(user)
  }


  return (
    <form onSubmit={handleSubmit}>
      <input name="userName" value={user} onChange={e => dispatch(setField(e.target.value))} placeholder="Username" />
      <input type="submit" />
    </form>
  )
}

const ChatButton = ({ user }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const handleSelection = () => {
    dispatch(setSelectedChat(user.id))
  }
  return (
    <div className="chat-button" onClick={handleSelection}>
      <h5 style={{ marginBottom: "1px" }}>{user.userName}</h5>
      <p className={`user_status ${user.online ? "online" : ""}`} >{user.online ? "online" : "offline"}</p>
    </div >
  )
}

const Message = ({ message }) => {
  return (
    <div>
      {message.from.userName}: {message.content}
    </div>
  )
}
const MessagesDisplay = () => {
  const {messageHistory, selectedChat} = useSelector(state => state.chat)
  const queryClient = useQueryClient()
  const users = queryClient.getQueryData(["chats"])
  const selectedUser = users.find(u => u.id === selectedChat)
  const messages = useQuery({
    queryKey: ["messagesHistory"],
    queryFn: () => chatService.getMessages(selectedUser.chatId)
  })

  return (
    <div>
      {
        messages.isSuccess &&
        messages.data.map(message => {
          const from_user = users.find(u => u.id === message.from)
          console.log("from: ", from_user)
          const newMessage = { ...message, from: from_user }
          return (
            <Message key={newMessage.timeStamp} message={newMessage} />)
        })
      }
    </div>
  )
}

const MessageBox = ({ user }) => {
  const dispatch = useDispatch()
  const { selectedChat, messageBox } = useSelector(state => state.chat)
  const handleSend = (e) => {
    e.preventDefault()
    const timeStamp = new Date()

    socket.emit("message", {
      from: user.id,
      to: selectedChat,
      content: messageBox,
      timeStamp: timeStamp.toString()
    })
  }
  return (
    <form onSubmit={handleSend}>
      <input placeholder="Your message here..."
        value={messageBox}
        onChange={(e) => dispatch(setMessage(e.target.value))}
      />
      <input type="submit" value="Send" />
    </form>
  )
}
const Chat = ({ to, user }) => {
  console.log("to: ",to)


  return (
    <div>
      <div>
        <h3>{to.userName}</h3>
      </div>
      <MessagesDisplay />
      <MessageBox user={user} />
    </div>
  )
}



const ChatPage = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const localUser = useSelector(state => state.user.user)
  const selectedChat = useSelector(state => state.chat.selectedChat)
  const chats = useQuery({
    queryKey: ["chats"],
    queryFn: () => chatService.getChats(localUser),
    refetchOnWindowFocus: false,
  })
  const queryClient = useQueryClient()
  useEffect(() => {
    socket.on("state_change", () => {
      chats.refetch()

    })

    socket.on("message", message => {
      console.log("new message", message)
      const messagesHistory = queryClient.getQueryData(["messagesHistory"])
      if (messagesHistory)
      queryClient.setQueryData(["messagesHistory"], messagesHistory.concat(message))
    })
  }, [])

  const handleLogout = () => {
    localStorage.clear()
    dispatch(loadUser())
    dispatch(setLoggedIn(false))
    dispatch(setMessage(""))
    socket.disconnect()
    navigate("/login")
  }
  let chat_list 
  if (chats.isSuccess){
    console.log("query usuarios: ", chats.data)
    chat_list = chats.data.filter(u => u.id!==localUser.id)
  }
  return (<>
    <button onClick={handleLogout}>Logout</button>
    <div>
      <p>welcome:- {localUser.userName}</p>
    </div>
    <div>
      {chats.isSuccess && chat_list.map(user => <ChatButton key={user.id} user={user} />)
      }
    </div>
    {selectedChat && chats.isSuccess &&
      <Chat key={selectedChat} to={chat_list.find(u => u.id === selectedChat)} user={localUser} />
    }
  </>)
}

const App = () => {
  const {user, loggedin} = useSelector(state => state.user)
  const dispatch = useDispatch();
  const navigate = useNavigate()
  useEffect(() => {
    if (!user) {
      dispatch(loadUser())
      console.log("not user")
    }
    if (user) {
      console.log("userrrr")
      socket.connect()
      socket.emit("login", user)
      // socket.on("badUser", error => {
      //   dispatch(setUser(null))
      //   socket.disconnect()
      // })
      socket.once("login", res => {
        console.log("logiando")
        dispatch(setLoggedIn(true))
        navigate("/chats")
      })
    }
    return (() => {
      console.log("cerrando conexion")
      socket.disconnect()
    })
  }, [user])
  console.log("rendering")
  return (
    <div>
      <Routes>
        <Route path="/" element={loggedin ? <Navigate replace to="/login" /> : <Navigate replace to="/chats" />} />
        <Route path="/login" element={!loggedin ? <Login /> : <Navigate replace to="/chats" />} />
        <Route path="/chats" element={loggedin ? <ChatPage /> : <Navigate replace to="/login" />} />
      </Routes>
    </div>
  )
}

export default App
