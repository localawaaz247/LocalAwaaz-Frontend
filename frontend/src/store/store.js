import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../reducer/authReducer";
import issueFeedReducer from "../reducer/issueFeedReducer";
import profileReducer from "../reducer/profileReducer";
import uploadReducer from "./slices/uploadSlice"; // <-- Adjust path if you saved it in the 'reducer' folder instead

export const appStore = configureStore({
    reducer: {
        auth: authReducer,
        issueFeed: issueFeedReducer,
        profile: profileReducer,
        upload: uploadReducer, // <-- Added the background upload state here
    },
    devTools: import.meta.env.DEV
});