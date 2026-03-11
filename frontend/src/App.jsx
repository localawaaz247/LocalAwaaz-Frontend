import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./utils/themeProvider";
import LoginRegister from "./pages/LoginRegister";
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
import Help from "./pages/Help"; // Your newly imported Help page

const App = () => {
  return (
    <ThemeProvider>
      <Provider store={appStore}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><LoginRegister /></PublicRoute>} />

            <Route path="/FAQ" element={<PublicRoute><FAQ /></PublicRoute>} />
            <Route path="/careers" element={<PublicRoute><Careers /></PublicRoute>} />
            <Route path="/press" element={<PublicRoute><Press /></PublicRoute>} />
            <Route path="/privacy" element={<PublicRoute><Privacy /></PublicRoute>} />
            <Route path="/terms" element={<PublicRoute><TermsOfService /></PublicRoute>} />
            <Route path="/cookies" element={<PublicRoute><Cookies /></PublicRoute>} />

            <Route path="/google/callback" element={<GoogleCallback />} />
            <Route path="/complete-profile" element={<ProtectedRoute><CompleteProfile /></ProtectedRoute>} />

            {/* Dashboard Layout with Nested Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Homepage /></ProtectedRoute>}>
              <Route index element={<Feed />} />
              <Route path="report" element={<ReportIssue />} />
              <Route path="assistant" element={<Assistant />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="profile" element={<Profile />} />
              <Route path="help" element={<Help />} /> {/* Added Help route here */}
            </Route>

            <Route path="/issue/:id" element={<IssueDetailPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </Provider>
    </ThemeProvider>
  );
};

export default App;