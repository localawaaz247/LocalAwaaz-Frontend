import "./utils/i18n";
import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./utils/themeProvider";
import { HelmetProvider } from "react-helmet-async";
import { Provider } from "react-redux";
import { appStore } from "./store/store";
import { validateToken } from "./reducer/authReducer";

// --- PWA IMPORT ---
import { useRegisterSW } from 'virtual:pwa-register/react';

// --- CAPACITOR PUSH NOTIFICATIONS IMPORTS ---
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

// Pages & Components
import LoginRegister from "./pages/LoginRegister";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";
import LandingPage from "./pages/LandingPage";
import Homepage from "./pages/Homepage";
import CompleteProfile from "./pages/CompleteProfile";
import ReportIssue from "./pages/ReportIssue";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Feed from "./pages/Feed";
import Assistant from "./pages/Assistant";
import GoogleCallback from "./pages/GoogleCallback";
import IssueDetailPage from "./pages/IssueDetailPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicRoute } from "./components/PublicRoute";
import Careers from "./pages/Careers";
import Press from "./pages/Press";
import Privacy from "./pages/Privacy";
import TermsOfService from "./pages/TermsOfService";
import Cookies from "./pages/Cookies";
import FAQ from "./pages/FAQ";
import Help from "./pages/Help";
import AdminDashboard from "./pages/AdminDashboard";
import AuthorityDashboard from "./pages/AuthorityDashboard";

// 🟢 NEW: Import LeaderBoard Component
import LeaderBoard from "./components/shared/LeaderBoard"; // Adjust path to './pages/LeaderBoard' if you placed it there

import axiosInstance from "./utils/axios";

const AppLanguageInitializer = ({ children }) => {
  const { i18n } = useTranslation();
  const user = useSelector((state) => state.auth?.user);

  useEffect(() => {
    if (user?.preferences?.language) {
      i18n.changeLanguage(user.preferences.language);
    }
  }, [user?.preferences?.language, i18n]);

  return children;
};

// Inner component to handle dispatching because useDispatch must be inside Provider
const AppContent = () => {
  useRegisterSW({
    onRegistered(r) {
      console.log('Localawaaz PWA Service Worker Registered');
    },
    onRegisterError(error) {
      console.error('PWA registration error:', error);
    }
  });

  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Fire off the token validation immediately on app load
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      dispatch(validateToken());
    }
  }, [dispatch]);

  // Capacitor Push Notifications Logic (With Custom Sound Channel)
  useEffect(() => {
    const setupPushNotifications = async () => {
      if (!Capacitor.isNativePlatform()) {
        console.log("Push notifications are not available on the web browser.");
        return;
      }

      try {
        // 1. Check existing permission status
        let permStatus = await PushNotifications.checkPermissions();

        // 2. If it hasn't been requested yet, prompt the user
        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        // 3. Stop if the user denied the request
        if (permStatus.receive !== 'granted') {
          console.log('User denied push notification permission');
          return;
        }

        // 4. Create the Custom Sound Channel BEFORE registering
        await PushNotifications.createChannel({
          id: 'localawaaz_custom_alerts',
          name: 'LocalAwaaz Alerts',
          description: 'Notifications with custom ting sound',
          importance: 5, // High importance (heads-up notification)
          visibility: 1,
          sound: 'ting', // IMPORTANT: No .mp3 extension here!
        });
        console.log('Push channel created successfully');

        // 5. If granted, register the device with Google/FCM
        await PushNotifications.register();

      } catch (error) {
        console.error('Error setting up push notifications:', error);
      }
    };

    if (Capacitor.isNativePlatform()) {
      // Listen for successful registration to get the FCM token
      PushNotifications.addListener('registration', (token) => {
        console.log('Push registration success! FCM Token:', token.value);

        // Send this token.value to your backend API to save it to the user's profile
        const savedToken = localStorage.getItem("access_token");
        if (savedToken) {
          axiosInstance.post('/user/update-fcm-token', {
            token: token.value
          }).catch(err => console.error("Failed to save token to DB", err));
        }
      });

      // Listen for registration errors
      PushNotifications.addListener('registrationError', (error) => {
        console.error('Error on registration: ', error);
      });

      // Trigger the permission request and channel setup
      setupPushNotifications();
    }
  }, []);

  useEffect(() => {
    // If the user just successfully logged in, force Capacitor to grab the token again
    // This triggers the 'registration' listener above, ensuring it has the access_token
    if (isAuthenticated && Capacitor.isNativePlatform()) {
      PushNotifications.register().catch(err =>
        console.error('Failed to re-register for push after login:', err)
      );
    }
  }, [isAuthenticated]);

  return (
    <AppLanguageInitializer>
      <BrowserRouter>
        <Routes>
          {/* PUBLIC ROUTES */}
          <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><LoginRegister /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />

          {/* UNRESTRICTED ROUTES */}
          <Route path="/FAQ" element={<FAQ />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/press" element={<Press />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/google/callback" element={<GoogleCallback />} />
          <Route path="/issue/:id" element={<IssueDetailPage />} />

          {/* PROTECTED ROUTES */}
          <Route path="/complete-profile" element={<ProtectedRoute><CompleteProfile /></ProtectedRoute>} />

          <Route path="/dashboard" element={<ProtectedRoute><Homepage /></ProtectedRoute>}>
            <Route index element={<Feed />} />
            <Route path="report" element={<ReportIssue />} />
            <Route path="assistant" element={<Assistant />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<Profile />} />
            <Route path="help" element={<Help />} />

            {/* 🟢 NEW: LEADERBOARD ROUTE */}
            <Route path="leaderboard" element={<LeaderBoard />} />
          </Route>

          {/* ADMIN ROUTE */}
          <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminDashboard /></ProtectedRoute>} />

          {/* AUTHORITY ROUTE */}
          <Route path="/authority" element={<ProtectedRoute><AuthorityDashboard /></ProtectedRoute>} />

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AppLanguageInitializer>
  );
};

const App = () => {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <Provider store={appStore}>
          <AppContent />
        </Provider>
      </ThemeProvider>
    </HelmetProvider>
  );
};

export default App;