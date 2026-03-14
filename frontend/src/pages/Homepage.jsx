import { Navigate, Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { useState, useEffect } from "react"
import Sidebar from "./Sidebar"
import LocationModal from "../components/LocationModal"
import { getUserLocation } from "../utils/locationUtils"

const Homepage = () => {
  const [showLocationModal, setShowLocationModal] = useState(false)
  const location = useLocation()

  // NEW: State to hold the specific issue ID when a notification is clicked
  const [selectedIssueId, setSelectedIssueId] = useState(null)

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

  // NEW: Catch the state passed from Notifications.jsx
  useEffect(() => {
    if (location.state?.selectedIssueId) {
      // 1. Set the ID
      setSelectedIssueId(location.state.selectedIssueId);

      // 2. Clear the browser history state so the popup doesn't reopen if the user refreshes the page
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  return (
    <div className="flex h-screen w-screen bg-background">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        {/* NEW: Pass the issue ID and its setter down to the child routes */}
        <Outlet context={{ selectedIssueId, setSelectedIssueId }} />
      </div>

      <LocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
    </div>
  )
}

export default Homepage