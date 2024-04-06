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
    <div className="flex w-14 flex-col justify-center items-center">
      <h1 className="text-6xl text-wrap text-center m-4">Welcome to the ReactiveChat</h1>
      <form className="flex flex-col bg-teal-900 p-10  rounded " onSubmit={handleSubmit}>
        <input 
          className="
            flex-row w-80 bg-teal-100 mb-2 text-teal-900 focus focus:outline-teal-400 focus:outline focus:outline-1 placeholder-gray-600 rounded p-1"
            name="userName"
            value={user}
            onChange={e => dispatch(setField(e.target.value))} placeholder="Username" 
        />

        <input className="bg-amber-400 hover:bg-amber-300 p-2 px-4 rounded" value="Login" type="submit" />
      </form>
    </div>
  )
}

const ChatButton = ({ user }) => {
  const dispatch = useDispatch()
  const {selectedChat} = useSelector(state => state.chat)
  const notification = user.new_messages>0
  const handleSelection = () => {
    if (selectedChat===user.id) dispatch(setSelectedChat(null))
    else dispatch(setSelectedChat(user.id))
    if (notification)

    dispatch(setMessage(""))
  }
  const ligth = user.online? 
    600 : notification? 
      700 : 800
  return (
    <div className={`flex flex-row h-50 bg-teal-${user.online? 800 : 900} w-full hover:bg-teal-950 justify-center border-teal-${user.online? 600 : 700} border-b-2 `}>

      <div className={`flex flex-col p-4 w-full `} onClick={handleSelection}>
          <h5 className="text-xl text-teal-300">{user.userName}</h5>
        <p className={`text-teal-${ligth-100}`} >{user.online ? "online" : "offline"}</p>
      </div >
      {notification && 
      <div className="flex items-center p-2">

        <div className="flex items-center justify-center px-3 p-1 bg-teal-500 rounded-full">
          <p className="font-bold text-teal-800">{user.new_messages}</p>
        </div>
      </div>
      }
    </div>
  )
}

const Message = ({ message, person }) => {
  const fromOther = person===message.from
  const colors = {
    messageBg: fromOther? 
      "bg-gray-800" : "bg-teal-800",
    position: fromOther?
      "": "ml-auto",
    timeColor: fromOther?
      "text-gray-600" : "text-teal-600"
  }
  const messageTime = new Date(message.timeStamp)

  let icon = fromOther?
    null :
    message.status==="sent"? 
      (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>

      ):
    message.status==="received"? 
    (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
      </svg>
    ):
    message.status==="read"? 
      (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className=" text-yellow-100 w-3 h-3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>




      ): null

  return (
    <div className={`rounded w-2/5 p-3 shadow-xl mb-2 ${colors.messageBg} ${colors.position}`}>
      <div className="px-2">
        <p>{message.content}</p>
      </div>
      <div className="flex justify-end w-full">
        <p className={`text-sm ${colors.timeColor}`}>{`${messageTime.getHours()}:${messageTime.getMinutes()}`}</p>
        {
          !fromOther &&
          <div className="flex flex-col justify-end m-1 ">

            {icon}
          </div>
        }
      </div>
      
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
  }, [selectedChat, users])

  useMemo(()=>{
    const not_read = messages.data.find(m => m.status!=="read" && m.to===user.id)
    if (selectedChat && messages.data.length>0 && !!not_read){
      queryClient.refetchQueries({exact: ["chats"]})
      socket.emit("message_status", {
        users: [selectedChat, user.id],
        toAllMessages: true,
        status: "read"
      })
    }
  }, [messages])

  return (
    <div className="py-5 px-10 grow overflow-y-auto">
      {
        messages.isSuccess &&
        messages.data.map(message => <Message key={message._id} message={message} person={selectedChat} />)
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
    const chats = [...queryClient.getQueryData(["chats"])]
    const updateChat = chats.findIndex(c => c.id === selectedChat)
    chats[updateChat] = {...chats[updateChat], last_activity: timeStamp}
    queryClient.setQueryData(["chats"], chats)
  }
  
  return (
    <div className="w-full p-6 bg-emerald-950">
      <form className="flex flex-row w-full items-center" onSubmit={handleSend}>
        <input 
          className=" 
            bg-teal-100 mb-2 text-teal-900 focus focus:outline-teal-600 focus:outline focus:outline-1 placeholder-gray-600 rounded p-1 h-10 w-5/6" 
            placeholder="Your message here..."
          value={messageBox}
          onChange={(e) => dispatch(setMessage(e.target.value))}
          />
        <div>
          <div className="m-3 flex items-center">

        <button className="bg-teal-700 rounded-full p-2.5 rounded-full hover:bg-teal-500" type="submit" disabled={messageBox.length===0} >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
          </svg>
        </button>
          </div>

        </div>
      </form>
    </div>
  )
}
const Chat = ({ to, user }) => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch()
  useEffect(()=>{
    return ()=>{
      queryClient.setQueryData(["messagesHistory"], [])
    }
  },[])
  const closeChat = ()=> {  
    dispatch(setSelectedChat(null))
  }

  return (
    <div className="flex flex-col h-full w-full justify-between">
      <div className="flex justify-start bg-emerald-900 items-center border-b-teal-800 py-10 h-1">
        <button onClick={closeChat} className="rounded-full m-2 p-2 hover:bg-emerald-950">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>

        </button>
        <div className="flex justify-center grow items-center h-full">
          <h3 className="text-2xl">{to.userName}</h3>

        </div>
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
      const { data } = await chats.refetch()
      const selectedUser = data.find(d => d.id===selectedChat)
      if (!selectedUser) dispatch(setSelectedChat(null))
    })

    socket.on("message", (message) => {
      const messagesHistory = queryClient.getQueryData(["messagesHistory"])
      const { selectedChat } = store.getState().chat
      
      const isChat = selectedChat===message.from || localUser.id===message.from
      if (message.from!==localUser.id)
        socket.emit("message_status", {
          users: [message.from, message.to],
          messageId: message._id,
          status: isChat? "read" : "received"
        })

      console.log("actualizando mensajes", message)
      if (isChat){

        if (!message.chatCreated){
          queryClient.setQueryData(["messagesHistory"], messagesHistory.concat(message))
        }
        else chats.refetch()

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
  return (
  <div className="flex flex-col h-full w-full items-start">
  <div className="flex w-full justify-between border-b-2 border-teal-950 shadow-b-xl px-4 bg-teal-800">
    <div className="flex items-center bg-teal-900 py-2 px-4">
      <div className="rounded-full p-2 bg-emerald-900">
        <svg  xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>

      </div>

      <h1 className="m-2 text-2xl ">{localUser.userName}</h1>

    </div>
    <button className="bg-emerald-800 font-bold hover:bg-emerald-700 p-2 px-4 rounded" onClick={handleLogout}>Logout</button>

  </div>
    <div className="flex h-full w-full">
      <div className="w-1/5 flex flex-col items-start bg-teal-900 shadow-lg">
        {chats.isSuccess && chat_list.map(user => <ChatButton key={user.id} user={user} />)
        }
      </div>
      <div className="w-4/5">
        {selectedChat && chats.isSuccess?
          <Chat to={chat_list.find(u => u.id === selectedChat)} user={localUser} />
          :
          <div className="flex w-full h-full items-center justify-center">
            <h3 className="text-teal-800 font-bold text-2xl">No chat selected</h3>

          </div>
        }
      </div>
    </div>
  </div>)
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
    <div className="h-screen w-screen bg-teal-950 text-white flex items-center justify-center">
      <Routes>
        <Route path="/" element={loggedin ? <Navigate replace to="/login" /> : <Navigate replace to="/chats" />} />
        <Route path="/login" element={!loggedin ? <Login /> : <Navigate replace to="/chats" />} />
        <Route path="/chats" element={loggedin ? <ChatPage /> : <Navigate replace to="/login" />} />
      </Routes>
    </div>
  )
}

export default App
