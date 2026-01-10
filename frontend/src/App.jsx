
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./util/themeProvider";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";


const App = () => {
  return (
   
      <ThemeProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              {/* keep this at the bottom */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        
      </ThemeProvider>
    
  );
};

export default App;
