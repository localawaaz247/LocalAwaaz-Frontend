import {
  MapPin,
  Plus,
  CheckCircle2,
  Clock,
  Users,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from 'react-router-dom'
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
    <div className="bg-texture min-h-screen ">
      {/* HEADER (same as previous – NOT navbar) */}
      <div className="px-6 py-4 sticky top-2 glass-card z-50 rounded-lg border-0 border-b border-border mx-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-foreground">{displayLocation}</h2>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin size={14} />
              {chosenLocation?.country || "Uttar Pradesh, India"}
              <button 
                className="ml-2 text-accent font-medium transition-colors hover:text-accent/80"
                onClick={() => setShowLocationModal(true)}
              >
                Change Area
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm bg-cyan-800 text-accent-foreground px-3 py-2 rounded-full border border-accent/30">
              ● {activeIssuesCount} Active {activeIssuesCount === 1 ? 'Issue' : 'Issues'} in your area
            </span>
            <button className="btn-gradient flex items-center gap-2 px-4 py-2 rounded-xl" onClick={()=>navigate("/dashboard/report")}>
              <Plus size={16} />
              New Issue
            </button>
          </div>
        </div>
      </div>

      {/* HERO SECTION */}
      <div className="mt-6 mx-6 rounded-2xl glass-card p-8 text-card-foreground">
        <div className="w-full flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-4 text-gradient">
              Community-Verified Local Issues
            </h1>
            <p className="text-sm text-muted-foreground mb-6 max-w-md leading-relaxed">
              Track, report, and resolve civic issues in your neighborhood
              with the power of community verification.
            </p>

            <div className="flex gap-4">
              <HeroBadge label="24 Resolved This Month" />
              <HeroBadge label="1,247 Active Citizens" />
            </div>
          </div>

          <div className="hidden md:block">
            <img
              src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8Y29tcHV0ZXJ8ZW58MHx8MHx8fDA%3D"
              alt="hero"
              className="rounded-xl shadow-lg h-56"
            />
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="-mt-6 px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            icon={<CheckCircle2 className="text-secondary" />}
            label="Resolved This Month"
            value="24"
          />
          <StatCard
            icon={<Clock className="text-secondary" />}
            label="Pending Verification"
            value="8"
          />
          <StatCard
            icon={<Users className="text-accent" />}
            label="Community Impact"
            value="High"
          />
        </div>
      </div>

      {/* PRIORITY ISSUES */}
      <div className="px-6 mt-12">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-foreground">
            Priority Issues in Your Area
          </h3>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-xl border border-border bg-card text-card-foreground text-sm hover:bg-muted transition-colors">
              Newest
            </button>
            <button className="btn-gradient px-4 py-2 rounded-xl text-sm">
              Most Impactful
            </button>
          </div>
        </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-10">
          {loading ? (
            <div className="col-span-full flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
            </div>
          ) : error ? (
            <div className="col-span-full text-center py-20">
              <p className="text-destructive">Failed to load issues. Please try again.</p>
            </div>
          ) : issues.length === 0 ? (
            <div className="col-span-full text-center ">
              <p className="text-muted-foreground ">No Issues found in your area</p>
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
  <div className="glass-card px-4 py-2 rounded-full text-sm text-foreground/80 backdrop-blur">
    {label}
  </div>
);

const StatCard = ({ icon, label, value }) => (
  <div className="glass-card p-5 rounded-xl flex gap-4 items-center hover:shadow-lg transition-all">
    <div className="p-3 bg-muted rounded-full">{icon}</div>
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  </div>
);

