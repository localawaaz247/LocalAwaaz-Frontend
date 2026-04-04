import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../reducer/authReducer";
import issueFeedReducer from "../reducer/issueFeedReducer";
import profileReducer from "../reducer/profileReducer"

export const appStore = configureStore({
    reducer: {
        auth: authReducer,
        issueFeed: issueFeedReducer,
        profile: profileReducer,
    },
    devTools: import.meta.env.DEV
})