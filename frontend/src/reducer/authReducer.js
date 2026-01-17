import {  createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../utils/config";



export const login=createAsyncThunk("/auth/login",async(credentials,{rejectWithValue})=>{
  try {
      const res=await axios.post(`${BASE_URL}/auth/login`,credentials);
      return res.data;
  } catch (error) {
     return rejectWithValue(error?.response?.data);
  }

})

export const register=createAsyncThunk("/auth/register",async(data,{rejectWithValue})=>{

    try {
        const res=await axios.post(`${BASE_URL}/auth/register`,data);
        return res.data;
        
    } catch (error) {
         return rejectWithValue(error?.response?.data)
    }
})


const authSlice=createSlice({
    name:"auth",
    initialState:{
        user:null,
        loading:false,
        error:null,
    },
    reducers:{

    },
    extraReducers:((builders)=>{
        builders
        .addCase(login.pending,(state)=>{
            state.user=null;
            state.loading=true;
        })
        .addCase(login.fulfilled,(state,action)=>{
             state.user=action.payload.user;
             localStorage.setItem("access_token", action.payload.accessToken);
             state.loading=false;
        })
        .addCase(login.rejected,(state,action)=>{
            state.user=null;
            state.loading=false;
            state.error=action.payload;
        })
        .addCase(register.pending,(state)=>{
            state.loading=true;
        })
        .addCase(register.fulfilled,(state)=>{
            state.loading=false;
        })
        .addCase(register.rejected,(state,action)=>{
            state.loading=false;
            state.error=action.payload;
        })
    })
})

// export const {}=authSlice.actions;
export  default authSlice.reducer;