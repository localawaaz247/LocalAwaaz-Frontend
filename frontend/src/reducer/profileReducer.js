import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../utils/axios";

export const getProfileDetails = createAsyncThunk('/me/profile', async (_, { rejectWithValue }) => {
    try {
        const res = await axiosInstance.get(`/me/profile`);
        return res.data;
    } catch (error) {
        return rejectWithValue(error);
    }
})

// 🟢 FIX: We now accept the entire 'payload' object and send it directly to the backend
export const updateProfile = createAsyncThunk('/me/profile/update', async (payload, { rejectWithValue }) => {
    try {
        // Now profilePic, isAnonymous, globalNotification, etc., will all be sent!
        const res = await axiosInstance.patch(`/me/profile`, payload);
        return res.data;
    } catch (error) {
        return rejectWithValue(error);
    }
})

const profileSlice = createSlice({
    name: "profile",
    initialState: {
        profileDetail: null,
    },
    extraReducers: (builders) => {
        builders
            .addCase(getProfileDetails.pending, (state) => {
                state.profileDetail = null;
            })
            .addCase(getProfileDetails.fulfilled, (state, action) => {
                state.profileDetail = action.payload.data;
            })
            .addCase(getProfileDetails.rejected, (state) => {
                state.profileDetail = null;
            })
            .addCase(updateProfile.fulfilled, (state, action) => {
                state.profileDetail = action.payload.data;
            })
    }
})

export default profileSlice.reducer;