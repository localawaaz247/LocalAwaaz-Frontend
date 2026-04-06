import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../utils/axios";

export const login = createAsyncThunk("/auth/login", async (credentials, { rejectWithValue }) => {
    try {
        const res = await axiosInstance.post(`/auth/login`, credentials);
        return res.data;
    } catch (error) {
        return rejectWithValue(error?.response?.data);
    }
});

export const register = createAsyncThunk("/auth/register", async (data, { rejectWithValue }) => {
    try {
        const res = await axiosInstance.post(`/auth/register`, data);
        return res.data;
    } catch (error) {
        return rejectWithValue(error?.response?.data);
    }
});

export const logout = createAsyncThunk("/auth/logout", async (_, { rejectWithValue }) => {
    try {
        const res = await axiosInstance.post(`/auth/logout`);
        localStorage.removeItem("access_token");
        return res.data;
    } catch (error) {
        localStorage.removeItem("access_token");
        return rejectWithValue(error?.response?.data);
    }
});

export const validateToken = createAsyncThunk("/me/profile", async (_, { rejectWithValue }) => {
    try {
        const res = await axiosInstance.get(`/me/profile`);
        return res.data;
    } catch (error) {
        const status = error?.response?.status;
        if (status === 401) {
            localStorage.removeItem("access_token");
        }
        return rejectWithValue(error?.response?.data);
    }
});

// 👇 FIX: Check for token synchronously on load
const hasToken = !!localStorage.getItem("access_token");

const authSlice = createSlice({
    name: "auth",
    initialState: {
        user: null,
        loading: false,
        error: null,
        isAuthenticated: false,
        // 👇 FIX: Start as TRUE if a token exists in local storage
        tokenValidationLoading: hasToken 
    },
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        logoutUser: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            localStorage.removeItem("access_token");
        },
        setIsAuthenticated: (state, action) => {
            state.isAuthenticated = action.payload;
        },
        setUser: (state, action) => {
            state.user = action.payload;
        }
    },
    extraReducers: (builders) => {
        builders
            // --- LOGIN ---
            .addCase(login.pending, (state) => {
                state.user = null;
                state.loading = true;
                state.isAuthenticated = false;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.user = action.payload.user;
                localStorage.setItem("access_token", action.payload.accessToken);
                state.loading = false;
                state.isAuthenticated = true;
            })
            .addCase(login.rejected, (state, action) => {
                state.user = null;
                state.loading = false;
                state.error = action.payload;
                state.isAuthenticated = false;
            })

            // --- REGISTER ---
            .addCase(register.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(register.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(register.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // --- LOGOUT ---
            .addCase(logout.pending, (state) => {
                state.loading = true;
            })
            .addCase(logout.fulfilled, (state) => {
                state.user = null;
                state.loading = false;
                state.isAuthenticated = false;
                state.error = null;
            })
            .addCase(logout.rejected, (state, action) => {
                state.user = null;
                state.loading = false;
                state.isAuthenticated = false;
                state.error = action.payload;
            })

            // --- VALIDATE TOKEN ---
            .addCase(validateToken.pending, (state) => {
                state.tokenValidationLoading = true;
                state.error = null;
            })
            .addCase(validateToken.fulfilled, (state, action) => {
                state.user = action.payload.data;
                state.tokenValidationLoading = false;
                state.isAuthenticated = true;
            })
            .addCase(validateToken.rejected, (state, action) => {
                state.user = null;
                state.tokenValidationLoading = false;
                state.isAuthenticated = false;
                state.error = action.payload;
            });
    }
});

export const { clearError, logoutUser, setIsAuthenticated, setUser } = authSlice.actions;
export default authSlice.reducer;