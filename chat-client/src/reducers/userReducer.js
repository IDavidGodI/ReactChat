import { createSlice } from "@reduxjs/toolkit"


const userReducer = createSlice({
  name: "user",
  initialState: { field: "", user: null, loggedin: false },
  reducers: {
    setField: (state, action) => {
      state.field = action.payload
    },
    setUser: (state, action) => {
      if (!action.payload) {
        localStorage.clear()
      }
      // localStorage.setItem("user", JSON.stringify(action.payload))
      state.user = action.payload
    },
    loadUser: (state, action) => {
      const suser = localStorage.getItem("user")
      state.user = JSON.parse(suser)
    },
    setLoggedIn: (state, action) => {
      state.loggedin = action.payload
    }
  }
})

export const { setUser, setField, loadUser, setLoggedIn } = userReducer.actions

export default userReducer.reducer;
