import "./utils/i18n";
import React, { useEffect } from "react"; // <-- Make sure these are here
import { useSelector } from "react-redux"; // <-- Make sure these are here
import { useTranslation } from "react-i18next"; // <-- Make sure these are here
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./utils/themeProvider";
import { HelmetProvider } from "react-helmet-async";
import LoginRegister from "./pages/LoginRegister";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";
import LandingPage from "./pages/LandingPage";
import Homepage from "./pages/Homepage";
import { Provider } from "react-redux"
import { appStore } from "./store/store";
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

// 1. The Wrapper Definition (You did this perfectly!)
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

const App = () => {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <Provider store={appStore}>
          {/* 2. THE FIX: Wrap BrowserRouter with your new initializer! */}
          <AppLanguageInitializer>
            <BrowserRouter>
              <Routes>
                {/* PUBLIC ROUTES (Only for logged-out users) */}
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

                {/* PROTECTED ROUTES (Only for logged-in users) */}
                <Route path="/complete-profile" element={<ProtectedRoute><CompleteProfile /></ProtectedRoute>} />

                <Route path="/dashboard" element={<ProtectedRoute><Homepage /></ProtectedRoute>}>
                  <Route index element={<Feed />} />
                  <Route path="report" element={<ReportIssue />} />
                  <Route path="assistant" element={<Assistant />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="help" element={<Help />} />
                </Route>

                {/* ADMIN ROUTE */}
                <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminDashboard /></ProtectedRoute>} />

                {/* 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AppLanguageInitializer>
        </Provider>
      </ThemeProvider>
    </HelmetProvider>
  );
};

export default App;