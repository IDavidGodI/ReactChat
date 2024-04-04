import { io } from "socket.io-client"
import environment from "./utils/environment.js"
import { useDispatch, useSelector } from "react-redux"
import { loadUser, setField, setUser } from "./reducers/userReducer.js"
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
  const messageHistory = useSelector(state => state.chat.messagesHistory)
  const queryClient = useQueryClient()

  const users = queryClient.getQueryData(["chats"])

  return (
    <div>
      {

        messageHistory.map(message => {
          const from_user = users.find(u => u.id === message.from)
          const newMessage = { ...message, from: from_user }
          return (<>
            <Message message={newMessage} />
          </>)
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
  console.log(to)


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
  const queryClient = useQueryClient()
  const chats = useQuery({
    queryKey: ["chats"],
    queryFn: chatService.getChats,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    socket.on("state_change", () => {
      console.log("state")
      chats.refetch()

    })

    socket.on("message", message => {
      console.log("new message")
      dispatch(addMessage(message))
    })
  }, [])

  const handleLogout = () => {
    localStorage.clear()
    dispatch(loadUser())
    dispatch(setMessage(""))
    socket.disconnect()
    navigate("/login")
  }
  useMemo(() => {
    if (chats.isSuccess) {
      const filtered = chats.data.filter(u => u.id !== localUser.id)
      queryClient.setQueryData(["chats"], filtered)

    }
  }, [chats.data])

  console.log(chats.data)
  return (<>
    <button onClick={handleLogout}>Logout</button>
    <div>
      <p>welcome:- {localUser.userName}</p>
    </div>
    <div>
      {chats.isSuccess && chats.data.map(user => <ChatButton key={user.id} user={user} />)
      }
    </div>
    {selectedChat && chats.isSuccess &&
      <Chat key={selectedChat} to={chats.data.find(u => u.id === selectedChat)} user={localUser} />
    }
  </>)
}

const App = () => {
  const user = useSelector(state => state.user.user)
  const dispatch = useDispatch();
  const navigate = useNavigate()
  console.log(user)
  useEffect(() => {
    if (!user) dispatch(loadUser())
    if (user) {
      socket.connect()
      socket.emit("login", user)
      navigate("/chats")
      socket.on("badUser", error => {
        dispatch(setUser(null))
        socket.disconnect()
      })
    }
    return (() => {
      socket.disconnect()
    })
  }, [user])
  return (
    <div>
      <Routes>
        <Route path="/" element={user ? <Navigate replace to="/login" /> : <Navigate replace to="/chats" />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate replace to="/chats" />} />
        <Route path="/chats" element={user ? <ChatPage /> : <Navigate replace to="/login" />} />
      </Routes>
    </div>
  )
}

export default App
