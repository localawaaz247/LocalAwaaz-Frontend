
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./utils/themeProvider";
import LoginRegister from "./pages/LoginRegister";
import NotFound from "./pages/NotFound";
import LandingPage from "./pages/LandingPage";
import Homepage from "./pages/Homepage";
import {Provider} from "react-redux"
import { appStore } from "./store/store";
import CompleteProfile from "./pages/CompleteProfile";


const App = () => {
  return (
      
      <ThemeProvider>
        <Provider store={appStore}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginRegister />} />
              <Route path="/homepage" element={<Homepage/>}/>
              <Route path="/complete-profile" element={<CompleteProfile/>}/>
              {/* keep this at the bottom */}
              <Route path="*" element={<NotFound />} />
            </Routes>
         </BrowserRouter>
          </Provider>
      </ThemeProvider>
      
      
    
  );
};

export default App;

