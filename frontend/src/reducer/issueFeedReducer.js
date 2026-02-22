import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../utils/axios";

// Async thunk for fetching issues by current location (lat/lng)
export const fetchIssuesByCurrentLocation = createAsyncThunk(
  "issueFeed/fetchByCurrentLocation",
  async ({ lat, lng, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/issues/feed`, {
        params: { lat, lng, page, limit }
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data || error.message);
    }
  }
);

// Async thunk for fetching issues by area search (typed location)
export const fetchIssuesByArea = createAsyncThunk(
  "issueFeed/fetchByArea",
  async ({ search, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/issue/area`, {
        params: { search, page, limit }
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data || error.message);
    }
  }
);

// Helper thunk that determines which API to call based on location type
export const fetchIssues = createAsyncThunk(
  "issueFeed/fetchIssues",
  async (locationData, { dispatch, rejectWithValue }) => {
    try {
      // Check if location has coordinates (current location)
      if (locationData?.latitude && locationData?.longitude) {
        // Use current location API
        return await dispatch(fetchIssuesByCurrentLocation({
          lat: locationData.latitude,
          lng: locationData.longitude,
          page: locationData.page || 1,
          limit: locationData.limit || 10
        })).unwrap();
      } else if (locationData?.city) {
        // Use area search API
        return await dispatch(fetchIssuesByArea({
          search: locationData.city,
          page: locationData.page || 1,
          limit: locationData.limit || 10
        })).unwrap();
      } else {
        throw new Error("Invalid location data");
      }
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

const issueFeedSlice = createSlice({
  name: "issueFeed",
  initialState: {
    issues: [],
    loading: false,
    error: null,
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalIssues: 0,
      hasMore: false
    },
    currentLocation: null,
    locationType: null // 'current' or 'area'
  },
  reducers: {
    clearIssues: (state) => {
      state.issues = [];
      state.error = null;
      state.pagination = {
        currentPage: 1,
        totalPages: 1,
        totalIssues: 0,
        hasMore: false
      };
    },
    clearError: (state) => {
      state.error = null;
    },
    setCurrentLocation: (state, action) => {
      state.currentLocation = action.payload;
    },
    setLocationType: (state, action) => {
      state.locationType = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch by current location
      .addCase(fetchIssuesByCurrentLocation.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.locationType = 'current';
      })
      .addCase(fetchIssuesByCurrentLocation.fulfilled, (state, action) => {
        state.loading = false;
        state.issues = action.payload.data || [];
        state.pagination = {
          currentPage: action.payload.currentPage || 1,
          totalPages: action.payload.totalPages || 1,
          totalIssues: action.payload.totalIssues || action.payload.issueCount || 0,
          hasMore: action.payload.hasMore || false
        };
      })
      .addCase(fetchIssuesByCurrentLocation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.issues = [];
      })
      
      // Fetch by area
      .addCase(fetchIssuesByArea.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.locationType = 'area';
      })
      .addCase(fetchIssuesByArea.fulfilled, (state, action) => {
        state.loading = false;
        state.issues = action.payload.data || [];
        state.pagination = {
          currentPage: action.payload.currentPage || 1,
          totalPages: action.payload.totalPages || 1,
          totalIssues: action.payload.totalIssues || action.payload.issueCount || 0,
          hasMore: action.payload.hasMore || false
        };
      })
      .addCase(fetchIssuesByArea.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.issues = [];
      });
  }
});

export const { clearIssues, clearError, setCurrentLocation, setLocationType } = issueFeedSlice.actions;
export default issueFeedSlice.reducer;
