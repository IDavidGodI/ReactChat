import { io } from "socket.io-client"
import environment from "./utils/environment.js"
import { useDispatch, useSelector } from "react-redux"
import { loadUser, setField, setLoggedIn, setUser } from "./reducers/userReducer.js"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import usersService from "./services/usersService.js"
import { useEffect } from "react"
import { setMessage, setSelectedChat } from "./reducers/chatReducer.js"

import { Routes, Route, Navigate, useNavigate } from "react-router-dom"
import chatService from "./services/chatService.js"
import { useMemo } from "react"
import store from "./store.js"
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
  const {selectedChat} = useSelector(state => state.chat)
  const handleSelection = () => {
    if (selectedChat===user.id) dispatch(setSelectedChat(null))
    else dispatch(setSelectedChat(user.id))
    dispatch(setMessage(""))
  }
  return (
    <div className="chat-button" onClick={handleSelection}>
      <h5 style={{ marginBottom: "1px" }}>{user.userName} ({user.new_messages && user.new_messages})</h5>
      <p className={`user_status ${user.online ? "online" : ""}`} >{user.online ? "online" : "offline"}</p>
    </div >
  )
}

const Message = ({ message }) => {

  return (
    <div>
      {message.from}: {message.content} ({message.status})
    </div>
  )
}
const MessagesDisplay = ({user}) => {
  const {selectedChat} = useSelector(state => state.chat)
  const queryClient = useQueryClient()
  const users = queryClient.getQueryData(["chats"])
  const selectedUser = users.find(u => u.id === selectedChat)
  const messages = useQuery({
    queryKey: ["messagesHistory"],
    queryFn: async () => {
      return chatService.getMessages(selectedUser.chatId)
    },
    initialData: [],
    refetchOnWindowFocus: false,
    retry: 0
  })
  useEffect(()=> {
    if (selectedChat){
      messages.refetch()
    }
  }, [selectedChat])

  useMemo(()=>{
    const not_read = messages.data.find(m => m.status!=="read" && m.to===user.id)
    if (selectedChat && messages.data.length>0 && !!not_read){
      
      socket.emit("message_status", {
        users: [selectedChat, user.id],
        toAllMessages: true,
        status: "read"
      })
    }
  }, [messages])


  if (messages.isError){
    queryClient.refetchQueries({exact:["chats"]})
  }
  return (
    <div>
      {
        messages.isSuccess &&
        messages.data.map(message => <Message key={message._id} message={message} />)
      }
    </div>
  )
}

const MessageBox = ({ user }) => {
  const dispatch = useDispatch()
  const { selectedChat, messageBox } = useSelector(state => state.chat)
  const queryClient = useQueryClient()
  const handleSend = (e) => {
    e.preventDefault()
    const timeStamp = new Date()
    dispatch(setMessage(""))
    socket.emit("message", {
      from: user.id,
      to: selectedChat,
      content: messageBox,
      timeStamp: timeStamp
    })
    console.log("emitiendo")
    const chats = [...queryClient.getQueryData(["chats"])]
    const updateChat = chats.findIndex(c => c.id === selectedChat)
    chats[updateChat] = {...chats[updateChat], last_activity: timeStamp}
    queryClient.setQueryData(["chats"], chats)
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
  const queryClient = useQueryClient();
  const {selectedChat} = useSelector(state => state.chat)
  useEffect(()=>{
    return ()=>{
      queryClient.setQueryData(["messagesHistory"], [])
    }
  },[])


  return (
    <div>
      <div>
        <h3>{to.userName}</h3>
      </div>
      <MessagesDisplay user={user}/>
      <MessageBox user={user} />
    </div>
  )
}



const ChatPage = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const localUser = useSelector(state => state.user.user)
  const {selectedChat} = useSelector(state => state.chat)
  const chats = useQuery({
    queryKey: ["chats"],
    queryFn: () => chatService.getChats(localUser),
    refetchOnWindowFocus: false,
    initialData: []
  })
  const queryClient = useQueryClient()


  useEffect(() => {
    socket.on("state_change", async () => {
      const {selectedChat} = store.getState().chat
      const res = await chatService.getChats(localUser)
      const { data } = await chats.refetch()
      const selectedUser = data.find(d => d.id===selectedChat)
      console.log("estado cambiado")
      if (!selectedUser) dispatch(setSelectedChat(null))
    })

    socket.on("message", message => {
      const messagesHistory = queryClient.getQueryData(["messagesHistory"])
      const { selectedChat } = store.getState().chat
      const isChat = selectedChat===message.from || localUser.id===message.from
      if (message.from!==localUser.id)
        socket.emit("message_status", {
          users: [message.from, message.to],
          messageId: message._id,
          status: isChat? "read" : "received"
        })
      if (isChat){
        console.log("nuevo mensaje renderizado")

        queryClient.setQueryData(["messagesHistory"], messagesHistory.concat(message))
        return
      }
      
        console.log("nuevo mensaje a parte")
      
      queryClient.refetchQueries({exact: ["chats"]})
    })
    socket.on("message_status", (from) => {
      const { selectedChat } = store.getState().chat
      if (selectedChat!==from){return}
      queryClient.refetchQueries({exact: ["messagesHistory"]})
    })
    return () => {
      dispatch(setSelectedChat(null))
      queryClient.setQueryData(["chats"], [])
    }
  }, [])
  useEffect(()=>{
    queryClient.setQueryData(["messagesHistory"],[])
  }, [selectedChat])
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
    chat_list = [...chats.data]
    .filter(u => u.id!==localUser.id)
    .sort(
      (a,b) => 
        new Date(b.last_activity) - new Date(a.last_activity)
    )
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
      <Chat to={chat_list.find(u => u.id === selectedChat)} user={localUser} />
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
    }
    if (user) {
      socket.connect()
      socket.emit("login", user)
      socket.on("badUser", error => {
        dispatch(setUser(null))
        socket.disconnect()
        socket.removeAllListeners()
      })
      socket.once("login", res => {
        dispatch(setLoggedIn(true))
        navigate("/chats")
      })
    }
    return (() => {
      console.log("cerrando conexion")
      socket.disconnect()
      socket.removeAllListeners()
    })
  }, [user])
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
