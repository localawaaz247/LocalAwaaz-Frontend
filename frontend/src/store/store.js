import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../reducer/authReducer";

export const appStore=configureStore({
    reducer:{
        auth:authReducer,
    }
})