
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./util/themeProvider";
import LoginRegister from "./pages/LoginRegister";
import NotFound from "./pages/NotFound";
import LandingPage from "./pages/LandingPage";


const App = () => {
  return (
   
      <ThemeProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginRegister />} />
             
              {/* keep this at the bottom */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        
      </ThemeProvider>
    
  );
};

export default App;
