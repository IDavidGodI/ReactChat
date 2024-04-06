
import { createSlice } from "@reduxjs/toolkit"


const chatReducer = createSlice({
  name: "user",
  initialState: { messageBox: "", messagesHistory: [], selectedChat: null },
  reducers: {
    setMessage: (state, action) => {
      state.messageBox = action.payload
    },
    setSelectedChat: (state, action) => {
      console.log("updating to: ", action.payload)
      state.selectedChat = action.payload
    },
    addMessage: (state, action) => {
      state.messagesHistory.push(action.payload)
    }
  }
})

export const { setMessage, setSelectedChat, addMessage } = chatReducer.actions

export default chatReducer.reducer;
