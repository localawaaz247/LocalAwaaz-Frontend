
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


const App = () => {
  return (
      
      <ThemeProvider>
        <Provider store={appStore}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginRegister />} />
              <Route path="/complete-profile" element={<CompleteProfile/>}/>

              <Route path="/dashboard" element={<Homepage/>}>
              <Route index element={<Feed />} />
              <Route path="report" element={<ReportIssue />} />
              <Route path="assistant" element={<Assistant />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="profile" element={<Profile />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
         </BrowserRouter>
          </Provider>
      </ThemeProvider>
      
      
    
  );
};

export default App;

