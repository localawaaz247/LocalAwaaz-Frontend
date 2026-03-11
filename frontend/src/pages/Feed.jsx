import {
  MapPin,
  Plus,
  CheckCircle2,
  Clock,
  Users,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from 'react-router-dom';
import { getChosenLocation, formatLocationDisplay, getCurrentLocationStored } from "../utils/locationUtils";
import LocationModal from "../components/LocationModal";
import IssueCard from "../components/IssueCard";
import IssueDetail from "../components/IssueDetail";
import FlagModal from "../components/modals/FlagModal";
import axiosInstance from "../utils/axios";
import { fetchIssues, clearIssues } from "../reducer/issueFeedReducer";
import { showToast } from "../utils/toast";

const Feed = () => {
  const [chosenLocation, setChosenLocation] = useState(() => getChosenLocation());
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [selectedIssueForFlag, setSelectedIssueForFlag] = useState(null);
  const [flagLoading, setFlagLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Get issues from Redux store
  const { issues, loading, error, pagination } = useSelector((state) => state.issueFeed);

  const displayLocation = chosenLocation ? formatLocationDisplay(chosenLocation) : "Lucknow";
  const activeIssuesCount = pagination?.totalIssues || issues?.length || 0;

  const handleCardClick = (issue) => {
    setSelectedIssue(issue);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedIssue(null);
  };

  const handleFlagClick = (issue) => {
    setSelectedIssueForFlag(issue);
    setShowFlagModal(true);
  };

  const handleFlagSubmit = async (flagReason) => {
    try {
      setFlagLoading(true);
      const coords = JSON.parse(localStorage.getItem('currentLocation'));
      const longitude = coords?.longitude;
      const latitude = coords?.latitude;
      
      const response = await axiosInstance.post(`/issue/${selectedIssueForFlag._id}/${flagReason}?lng=${longitude}&lat=${latitude}`);
       console.log(response.data)
      setShowFlagModal(false);
      setSelectedIssueForFlag(null);
      
      // Refresh issues
      const currentLocation = getCurrentLocationStored();
      const chosenLoc = getChosenLocation();
      let locationData = null;
      
      if (currentLocation?.latitude && currentLocation?.longitude) {
        locationData = {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          ...chosenLoc
        };
      } else if (chosenLoc) {
        locationData = chosenLoc;
      }
      
      if (locationData) {
        dispatch(fetchIssues(locationData));
      }
    } catch (error) {
      console.error('Error flagging issue:', error);
      showToast({icon:"warning",title:error.response.data.message || "Something went wrong"})
    } finally {
      setFlagLoading(false);
    }
  };

  const handleLocationUpdate = () => {
    const updatedLocation = getChosenLocation();
    const currentLocation = getCurrentLocationStored();
    
    setChosenLocation(updatedLocation);
    
    // Determine which location data to use
    let locationData = null;
    
    if (currentLocation?.latitude && currentLocation?.longitude) {
      // User selected current location (has coordinates)
      locationData = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        ...updatedLocation // Merge with any additional location info
      };
    } else if (updatedLocation) {
      // User typed/searched location
      locationData = updatedLocation;
    }
    
    // Only fetch issues when location is actually set
    if (locationData) {
      dispatch(fetchIssues(locationData));
    } else {
      dispatch(clearIssues());
    }
  }

  // Fetch issues on component mount if location exists
  useEffect(() => {
    const currentLocation = getCurrentLocationStored();
    const chosenLoc = getChosenLocation();
    
    let locationData = null;
    
    if (currentLocation?.latitude && currentLocation?.longitude) {
      locationData = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        ...chosenLoc
      };
    } else if (chosenLoc) {
      locationData = chosenLoc;
    }
    
    if (locationData) {
      dispatch(fetchIssues(locationData));
    }
  }, [dispatch]);

  return (
    // Added pb-20 on mobile to clear the bottom taskbar, pb-8 on desktop for normal padding
    <div className="bg-texture min-h-[100dvh] pb-20 md:pb-8">
      
      {/* HEADER (Sticky) */}
      <div className="px-3 md:px-6 py-3 md:py-4 sticky top-2 glass-card z-40 rounded-lg border-0 border-b border-border mx-2 md:mx-4 shadow-sm">
        <div className="flex justify-between items-center">
          <div className="min-w-0 pr-2">
            <h2 className="text-base md:text-lg font-bold text-foreground truncate">{displayLocation}</h2>
            <div className="flex items-center gap-1 text-[11px] md:text-sm text-muted-foreground truncate">
              <MapPin size={14} className="flex-shrink-0" />
              <span className="truncate">{chosenLocation?.country || "Uttar Pradesh, India"}</span>
              <button 
                className="ml-1 md:ml-2 text-accent font-medium transition-colors hover:text-accent/80 flex-shrink-0"
                onClick={() => setShowLocationModal(true)}
              >
                Change
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            {/* Hidden on mobile, visible on larger screens */}
            <span className="hidden lg:block text-xs md:text-sm bg-cyan-800 text-accent-foreground px-3 py-1.5 md:py-2 rounded-full border border-accent/30">
              ● {activeIssuesCount} Active {activeIssuesCount === 1 ? 'Issue' : 'Issues'}
            </span>
            <button 
              className="btn-gradient flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-xl whitespace-nowrap" 
              onClick={()=>navigate("/dashboard/report")}
            >
              <Plus size={16} />
              <span className="hidden sm:inline text-sm">New Issue</span>
              <span className="sm:hidden text-xs">Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* HERO SECTION */}
      <div className="mt-4 md:mt-6 mx-2 md:mx-6 rounded-2xl glass-card p-5 md:p-8 text-card-foreground">
        <div className="w-full flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2 md:mb-4 text-gradient">
              Community-Verified Local Issues
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mb-4 md:mb-6 max-w-md leading-relaxed">
              Track, report, and resolve civic issues in your neighborhood
              with the power of community verification.
            </p>

            <div className="flex flex-wrap gap-2 md:gap-4">
              <HeroBadge label="24 Resolved This Month" />
              <HeroBadge label="1,247 Active Citizens" />
            </div>
          </div>

          <div className="hidden lg:block">
            <img
              src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8Y29tcHV0ZXJ8ZW58MHx8MHx8fDA%3D"
              alt="hero"
              className="rounded-xl shadow-lg h-48 xl:h-56 object-cover"
            />
          </div>
        </div>
      </div>

      {/* STATS */}
      {/* Relative positioning ensures it sits above the hero card when overlapping on desktop */}
      <div className="mt-4 md:-mt-6 px-2 md:px-6 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6">
          <StatCard
            icon={<CheckCircle2 className="text-secondary w-5 h-5 md:w-6 md:h-6" />}
            label="Resolved This Month"
            value="24"
          />
          <StatCard
            icon={<Clock className="text-secondary w-5 h-5 md:w-6 md:h-6" />}
            label="Pending Verification"
            value="8"
          />
          <StatCard
            icon={<Users className="text-accent w-5 h-5 md:w-6 md:h-6" />}
            label="Community Impact"
            value="High"
          />
        </div>
      </div>

      {/* PRIORITY ISSUES */}
      <div className="px-2 md:px-6 mt-8 md:mt-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6">
          <h3 className="text-lg md:text-xl font-bold text-foreground">
            Priority Issues in Your Area
          </h3>
          <div className="flex flex-wrap gap-2">
            <button className="px-3 md:px-4 py-1.5 md:py-2 rounded-xl border border-border bg-card text-card-foreground text-xs md:text-sm hover:bg-muted transition-colors">
              Newest
            </button>
            <button className="btn-gradient px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-xs md:text-sm">
              Most Impactful
            </button>
          </div>
        </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 my-6 md:my-10">
          {loading ? (
            <div className="col-span-full flex justify-center items-center py-10 md:py-20">
              <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-b-2 border-accent"></div>
            </div>
          ) : error ? (
            <div className="col-span-full text-center py-10 md:py-20">
              <p className="text-destructive text-sm md:text-base">Failed to load issues. Please try again.</p>
            </div>
          ) : issues.length === 0 ? (
            <div className="col-span-full text-center py-10">
              <p className="text-muted-foreground text-sm md:text-base">No Issues found in your area</p>
            </div>
          ) : (
            issues.map((issue) => (
              <IssueCard
                key={issue._id || issue.id}
                issue={issue}
                onClick={() => handleCardClick(issue)}
                onFlagClick={() => handleFlagClick(issue)}
              />
            ))
          )}
        </div>
      </div>
      
      <LocationModal 
        isOpen={showLocationModal}
        onClose={() => {
          setShowLocationModal(false)
          handleLocationUpdate()
        }}
        forceLocation={location.pathname === '/dashboard' && !chosenLocation}
      />
      
      <IssueDetail
        issue={selectedIssue}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
      />
      
      <FlagModal
        isOpen={showFlagModal}
        onClose={() => {
          setShowFlagModal(false);
          setSelectedIssueForFlag(null);
        }}
        onSubmit={handleFlagSubmit}
        isLoading={flagLoading}
      />
    </div>
  );
};

export default Feed;

/* ---------------- COMPONENTS ---------------- */

const HeroBadge = ({ label }) => (
  <div className="glass-card px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[11px] md:text-sm text-foreground/80 backdrop-blur whitespace-nowrap">
    {label}
  </div>
);

const StatCard = ({ icon, label, value }) => (
  <div className="glass-card p-4 md:p-5 rounded-xl flex gap-3 md:gap-4 items-center hover:shadow-md md:hover:shadow-lg transition-all bg-card/80 backdrop-blur-md">
    <div className="p-2.5 md:p-3 bg-muted rounded-full">{icon}</div>
    <div>
      <p className="text-[11px] md:text-sm text-muted-foreground">{label}</p>
      <p className="text-xl md:text-2xl font-bold text-foreground">{value}</p>
    </div>
  </div>
);