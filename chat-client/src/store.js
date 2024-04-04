import { configureStore } from "@reduxjs/toolkit";

import userReducer from "./reducers/userReducer";
import chatReducer from "./reducers/chatReducer";

const store = configureStore({
  reducer: {
    user: userReducer,
    chat: chatReducer
  }
})

export default store;
