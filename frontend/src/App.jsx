import "./utils/i18n";
import React, { useEffect, useState, Suspense, lazy } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./utils/themeProvider";
import { HelmetProvider } from "react-helmet-async";
import { Provider } from "react-redux";
import { appStore } from "./store/store";
import { validateToken } from "./reducer/authReducer";

// 🟢 Global Toaster & Toast actions
import { Toaster, toast } from "react-hot-toast";

// --- PWA IMPORT ---
import { useRegisterSW } from 'virtual:pwa-register/react';

// --- CAPACITOR CORE & PLUGINS ---
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { App as CapacitorApp } from '@capacitor/app';

// 🟢 Standard Imports for Routing Components
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicRoute } from "./components/PublicRoute";
import axiosInstance from "./utils/axios";
import LeaderBoard from "./components/shared/LeaderBoard";

// 🟢 LAZY LOADED PAGES (Code Splitting for instant boot)
const LoginRegister = lazy(() => import("./pages/LoginRegister"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Homepage = lazy(() => import("./pages/Homepage"));
const ReportIssue = lazy(() => import("./pages/ReportIssue"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Profile = lazy(() => import("./pages/Profile"));
const Feed = lazy(() => import("./pages/Feed"));
const Assistant = lazy(() => import("./pages/Assistant"));
const GoogleCallback = lazy(() => import("./pages/GoogleCallback"));
const IssueDetailPage = lazy(() => import("./pages/IssueDetailPage"));
const Careers = lazy(() => import("./pages/Careers"));
const Press = lazy(() => import("./pages/Press"));
const Privacy = lazy(() => import("./pages/Privacy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const Cookies = lazy(() => import("./pages/Cookies"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Help = lazy(() => import("./pages/Help"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AuthorityDashboard = lazy(() => import("./pages/AuthorityDashboard"));

// 🟢 Suspense Loading Fallback
const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-[#0B131E]">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
  </div>
);

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

// Extract PWA logic to prevent Android execution
const PwaRegistrar = () => {
  useRegisterSW({
    onRegistered(r) {
      console.log('LocalAwaaz PWA Service Worker Registered');
    },
    onRegisterError(error) {
      console.error('PWA registration error:', error);
    }
  });
  return null;
};

const AppContent = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateDetails, setUpdateDetails] = useState(null);

  // 1. INSTANT WEBVIEW RELEASE: Drop splash screen immediately
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      CapacitorUpdater.notifyAppReady().catch(err => console.warn("Capgo notify failed", err));
    }
  }, []);

  // 2. Token validation - Happens quietly in the background now
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      dispatch(validateToken());
    }
  }, [dispatch]);

  // -------------------------------------------------------------
  // 🟢 OTA (WEB BUNDLE) LOGIC - Polling only, no wake-up listeners
  // -------------------------------------------------------------
  useEffect(() => {
    const checkAndApplyOTA = async () => {
      if (!Capacitor.isNativePlatform()) return;

      try {
        const response = await axiosInstance.get('/check-update');
        const data = response.data;

        if (data && data.available) {
          const localVersion = localStorage.getItem('OTA_APP_VERSION') || "1.0.0";

          if (data.version !== localVersion) {
            if (data.isMandatory) {
              await executeOTAUpdate(data.version, data.url);
            } else {
              const dismissedVersion = sessionStorage.getItem('dismissed_ota_version');

              if (dismissedVersion !== data.version) {
                setUpdateDetails(data);
                setShowUpdateModal(true);
              }
            }
          }
        }
      } catch (err) {
        console.error("OTA Check/Execution lifecycle failed:", err);
      }
    };

    checkAndApplyOTA();

    // Background polling every 10 minutes (Does not block app resume)
    const intervalId = setInterval(checkAndApplyOTA, 10 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  const executeOTAUpdate = async (targetVersion, downloadUrl) => {
    const toastId = toast.loading("Updating the app...");
    try {
      const downloadedUpdate = await CapacitorUpdater.download({
        version: targetVersion,
        url: downloadUrl
      });

      localStorage.setItem('OTA_APP_VERSION', targetVersion);
      toast.success("Restarting the app...", { id: toastId });

      setTimeout(async () => {
        await CapacitorUpdater.set(downloadedUpdate);
      }, 1500);

    } catch (error) {
      toast.error("Update failed. Please retry later.", { id: toastId });
      console.error("OTA bundle application failure:", error);
    }
  };

  const handleDismissOTAUpdate = () => {
    setShowUpdateModal(false);
    if (updateDetails?.version) {
      sessionStorage.setItem('dismissed_ota_version', updateDetails.version);
    }
  };

  // -------------------------------------------------------------
  // CAPACITOR PUSH NOTIFICATIONS LOGIC
  // -------------------------------------------------------------
  useEffect(() => {
    const setupPushNotifications = async () => {
      if (!Capacitor.isNativePlatform()) return;

      try {
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') return;

        await PushNotifications.createChannel({
          id: 'localawaaz_custom_alerts',
          name: 'LocalAwaaz Alerts',
          description: 'Notifications with custom ting sound',
          importance: 5,
          visibility: 1,
          sound: 'ting',
        });

        await PushNotifications.register();
      } catch (error) {
        console.error('Error setting up push notifications:', error);
      }
    };

    if (Capacitor.isNativePlatform()) {
      PushNotifications.addListener('registration', (token) => {
        const savedToken = localStorage.getItem("access_token");
        if (savedToken) {
          axiosInstance.post('/user/update-fcm-token', {
            token: token.value
          }).catch(err => console.error("Failed to save token to DB", err));
        }
      });

      setupPushNotifications();
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && Capacitor.isNativePlatform()) {
      PushNotifications.register().catch(err =>
        console.error('Failed to re-register for push after login:', err)
      );
    }
  }, [isAuthenticated]);

  return (
    <AppLanguageInitializer>
      <BrowserRouter>
        {/* 🟢 Suspense handles the async injection of the lazy components */}
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><LoginRegister /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
            <Route path="/FAQ" element={<FAQ />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/press" element={<Press />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/cookies" element={<Cookies />} />
            <Route path="/google/callback" element={<GoogleCallback />} />
            <Route path="/issue/:id" element={<IssueDetailPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><Homepage /></ProtectedRoute>}>
              <Route index element={<Feed />} />
              <Route path="report" element={<ReportIssue />} />
              <Route path="assistant" element={<Assistant />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="profile" element={<Profile />} />
              <Route path="help" element={<Help />} />
              <Route path="leaderboard" element={<LeaderBoard />} />
            </Route>
            <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/authority" element={<ProtectedRoute><AuthorityDashboard /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>

      {/* Render PWA only on web to prevent Android asset errors */}
      {!Capacitor.isNativePlatform() && <PwaRegistrar />}

      {/* OPTIONAL OTA DIALOG MODAL */}
      {showUpdateModal && updateDetails && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-teal-500/20 bg-[#0B131E]/95 p-6 text-slate-100 shadow-2xl backdrop-blur-xl transition-all duration-300">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold tracking-wide flex items-center gap-2 text-teal-400">
                <span className="h-2.5 w-2.5 rounded-full bg-teal-400 animate-pulse" />
                Update Available
              </h3>
              <button
                onClick={handleDismissOTAUpdate}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors duration-200"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-sm text-slate-300 leading-relaxed">
                An upgraded structural release v<span className="text-teal-400 font-semibold">{updateDetails.version}</span> is ready for deployment to optimize system speed and local sync configurations.
              </p>
              {updateDetails.releaseNotes && (
                <div className="mt-2 rounded-xl bg-slate-900/60 p-3 text-xs text-slate-400 border border-slate-800 max-h-24 overflow-y-auto">
                  <span className="block font-semibold text-slate-300 mb-1">What's New:</span>
                  {updateDetails.releaseNotes}
                </div>
              )}
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleDismissOTAUpdate}
                className="flex-1 rounded-xl border border-slate-700 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800/80 active:scale-[0.98] transition-all duration-200"
              >
                Later
              </button>
              <button
                onClick={() => {
                  setShowUpdateModal(false);
                  executeOTAUpdate(updateDetails.version, updateDetails.url);
                }}
                className="flex-1 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-900/30 hover:bg-teal-500 active:scale-[0.98] transition-all duration-200"
              >
                Update Now
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLanguageInitializer>
  );
};

const App = () => {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <Provider store={appStore}>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                zIndex: 999999,
                background: 'rgba(11, 19, 30, 0.85)',
                color: '#F8FAFC',
                border: '1px solid rgba(45, 212, 191, 0.2)',
                borderRadius: '12px',
                padding: '16px 20px',
                fontSize: '14px',
                fontWeight: '600',
                boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.8), 0 0 15px rgba(45, 212, 191, 0.05)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              },
              success: { iconTheme: { primary: '#0D9488', secondary: '#ffffff' } },
              error: { iconTheme: { primary: '#EF4444', secondary: '#ffffff' } },
              loading: { iconTheme: { primary: '#06B6D4', secondary: '#1E293B' } },
            }}
            containerStyle={{ zIndex: 999999, bottom: 40 }}
          />
          <AppContent />
        </Provider>
      </ThemeProvider>
    </HelmetProvider>
  );
};

export default App;