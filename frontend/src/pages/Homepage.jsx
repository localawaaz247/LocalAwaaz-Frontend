import { Navigate, Outlet, useLocation, useNavigate, useSearchParams,  } from "react-router-dom"
import { useState, useEffect } from "react"
import Sidebar from "./Sidebar"
import LocationModal from "../components/LocationModal"
import { getUserLocation } from "../utils/locationUtils"


const Homepage = () => {
  const [showLocationModal, setShowLocationModal] = useState(false)
  const location = useLocation();
  const [searchParams]=useSearchParams();
  const token=searchParams.get('token');
  const navigate=useNavigate();
  

  useEffect(() => {
    // Check if user is on dashboard route and if it's their first visit
    if (location.pathname === '/dashboard' || location.pathname === '/dashboard/') {
      const savedLocation = getUserLocation()
      const hasVisitedBefore = localStorage.getItem('hasVisitedHomepage')
      
      if (!savedLocation && !hasVisitedBefore) {
        // Show modal only on first visit
        setTimeout(() => {
          setShowLocationModal(true)
        }, 1000)
        
        // Mark that user has visited homepage
        localStorage.setItem('hasVisitedHomepage', 'true')
        
      }
    }
  }, [location.pathname])


  useEffect(()=>{
    if(token){
          localStorage.setItem('access_token',token);
           navigate("/dashboard");
        }
  },[])

  return (
    <div className="flex h-screen w-screen bg-background">
      <Sidebar/>
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
      
      <LocationModal 
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
    </div>
  )
}

export default Homepage
