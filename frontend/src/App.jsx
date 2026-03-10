
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./utils/themeProvider";
import LoginRegister from "./pages/LoginRegister";
import NotFound from "./pages/NotFound";
import LandingPage from "./pages/LandingPage";
import Homepage from "./pages/Homepage";
import {Provider} from "react-redux"
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



const App = () => {
  return (
      
      <ThemeProvider>
        <Provider store={appStore}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
              <Route path="/login" element={<PublicRoute><LoginRegister /></PublicRoute>} />
              <Route path="/google/callback" element={<GoogleCallback />} />
              <Route path="/complete-profile" element={<ProtectedRoute><CompleteProfile/></ProtectedRoute>}/>

              <Route path="/dashboard" element={<ProtectedRoute><Homepage/></ProtectedRoute>}>
             
              <Route index element={<Feed />} />
              <Route path="report" element={<ReportIssue />} />
              <Route path="assistant" element={<Assistant />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="profile" element={<Profile />} />
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

