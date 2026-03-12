import { MapPin, Plus, CheckCircle2, Clock, Users } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
// NEW: Added useOutletContext to the imports
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import InfiniteScroll from "react-infinite-scroll-component";
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

  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);

  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // NEW: Safely grab the context passed down from Homepage.jsx
  const context = useOutletContext();
  const selectedIssueId = context?.selectedIssueId;
  const setSelectedIssueId = context?.setSelectedIssueId;

  const { issues, loading, error, pagination } = useSelector((state) => state.issueFeed);

  const displayLocation = chosenLocation ? formatLocationDisplay(chosenLocation) : "Locating...";
  const activeIssuesCount = pagination?.totalIssues || issues?.length || 0;

  // --- NEW: AUTO-OPEN ISSUE FROM NOTIFICATIONS ---
  useEffect(() => {
    const fetchAndOpenIssue = async () => {
      if (!selectedIssueId) return;

      // 1. Optimization: Check if the issue is already loaded in the feed
      const existingIssue = issues?.find(i => i._id === selectedIssueId);

      if (existingIssue) {
        setSelectedIssue(existingIssue);
        setIsDetailOpen(true);
        return;
      }

      // 2. If not in the feed, fetch it directly from the backend
      try {
        const response = await axiosInstance.get(`/issue/${selectedIssueId}`);
        setSelectedIssue(response.data.data);
        setIsDetailOpen(true);
      } catch (err) {
        console.error("Failed to fetch specific issue details:", err);
        showToast({ icon: "error", title: "Issue not found or has been deleted" });
        // Clear the ID so it doesn't get stuck in a loop
        if (setSelectedIssueId) setSelectedIssueId(null);
      }
    };

    fetchAndOpenIssue();
  }, [selectedIssueId, issues, setSelectedIssueId]);


  // --- FETCH DATA HELPER ---
  const fetchData = (currentPage, specificLocation = null) => {
    const locToUse = specificLocation || getChosenLocation();
    if (locToUse) {
      dispatch(fetchIssues({ ...locToUse, page: currentPage }));
    }
  };

  const fetchMoreData = () => {
    if (pagination.currentPage < pagination.totalPages) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchData(nextPage);
    }
  };

  // --- 🌍 2-HOUR AUTO LOCATION LOGIC ---
  useEffect(() => {
    const CACHE_TIME_LIMIT = 2 * 60 * 60 * 1000; // 2 Hours

    const checkAndFetchLocation = async () => {
      const cachedData = localStorage.getItem('cached_geo_location');
      let parsedCache = cachedData ? JSON.parse(cachedData) : null;
      const now = Date.now();

      if (parsedCache && (now - parsedCache.timestamp < CACHE_TIME_LIMIT)) {
        setChosenLocation(parsedCache);
        fetchData(1, parsedCache);
        return;
      }

      if (navigator.geolocation) {
        showToast({ icon: "info", title: "Locating your neighborhood..." });

        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude, longitude } = pos.coords;
            try {
              const res = await axiosInstance.post('/get-location-from-coords', { lat: latitude, lng: longitude });

              if (res.data?.success) {
                const newLocation = {
                  latitude, longitude,
                  city: res.data.data.city,
                  state: res.data.data.state,
                  country: res.data.data.country,
                  timestamp: Date.now()
                };

                localStorage.setItem('cached_geo_location', JSON.stringify(newLocation));
                setChosenLocation(newLocation);
                fetchData(1, newLocation);
              }
            } catch (err) {
              console.error("Reverse Geocoding failed:", err);
              fetchData(1);
            }
          },
          (err) => {
            console.warn("Location permission denied:", err.message);
            setShowLocationModal(true);
            fetchData(1);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else {
        setShowLocationModal(true);
        fetchData(1);
      }
    };

    checkAndFetchLocation();
  }, [dispatch]);

  const handleLocationUpdate = () => {
    const updatedLocation = getChosenLocation();
    setChosenLocation(updatedLocation);
    setPage(1);

    if (updatedLocation) {
      fetchData(1, updatedLocation);
    } else {
      dispatch(clearIssues());
    }
  };

  // --- STANDARD CARD CLICK ---
  const handleCardClick = (issue) => {
    setSelectedIssue(issue);
    setIsDetailOpen(true);
  };

  // --- UPDATED CLOSE HANDLER ---
  const handleCloseDetail = () => {
    setIsDetailOpen(false);

    // Slight delay to allow the modal close animation to finish smoothly
    setTimeout(() => {
      setSelectedIssue(null);
      // Clear the context ID so clicking the same notification again works
      if (setSelectedIssueId) setSelectedIssueId(null);
    }, 300);
  };

  const handleFlagClick = (issue) => { setSelectedIssueForFlag(issue); setShowFlagModal(true); };

  const handleFlagSubmit = async (flagReason) => {
    try {
      setFlagLoading(true);
      const coords = JSON.parse(localStorage.getItem('cached_geo_location')) || JSON.parse(localStorage.getItem('currentLocation'));
      const longitude = coords?.longitude;
      const latitude = coords?.latitude;

      const response = await axiosInstance.post(`/issue/${selectedIssueForFlag._id}/${flagReason}?lng=${longitude}&lat=${latitude}`);
      showToast({ icon: "success", title: response.data?.message || "Issue successfully flagged!" });
      setShowFlagModal(false);
      setSelectedIssueForFlag(null);
      setPage(1);
      fetchData(1);
    } catch (error) {
      showToast({ icon: "error", title: error.response?.data?.message || "Failed to flag issue" });
    } finally {
      setFlagLoading(false);
    }
  };

  const dynamicStats = useMemo(() => {
    let resolved = 0; let pending = 0; let totalImpact = 0;
    if (!issues || issues.length === 0) return { resolved: 0, pending: 0, impactLevel: "Evaluating..." };

    issues.forEach(issue => {
      const stat = issue.status?.toUpperCase() || 'OPEN';
      if (stat === "RESOLVED") resolved += 1;
      else if (["IN_REVIEW", "UNDER REVIEW", "OPEN", "PENDING"].includes(stat)) pending += 1;
      totalImpact += (issue.impactScore || issue.impact || 0) + (issue.confirmationCount || 0);
    });

    let impactLevel = "Low";
    if (totalImpact > 100) impactLevel = "Critical";
    else if (totalImpact > 50) impactLevel = "High";
    else if (totalImpact > 20) impactLevel = "Medium";
    else if (totalImpact > 0) impactLevel = "Emerging";

    return { resolved, pending, impactLevel };
  }, [issues]);

  const sortedIssues = useMemo(() => {
    if (!issues) return [];
    return [...issues].sort((a, b) => {
      if (sortBy === "impactful") {
        const impactA = a.impactScore || a.impact || 0;
        const impactB = b.impactScore || b.impact || 0;
        if (impactB !== impactA) return impactB - impactA;
      }
      const dateA = new Date(a.createdAt || a._id || 0).getTime();
      const dateB = new Date(b.createdAt || b._id || 0).getTime();
      return dateB - dateA;
    });
  }, [issues, sortBy]);

  return (
    <div className="bg-texture min-h-[100dvh] pb-20 md:pb-8">
      {/* HEADER (Sticky) */}
      <div className="px-3 md:px-6 py-3 md:py-4 sticky top-2 glass-card z-40 rounded-lg border-0 border-b border-border mx-2 md:mx-4 shadow-sm">
        <div className="flex justify-between items-center">
          <div className="min-w-0 pr-2">
            <h2 className="text-base md:text-lg font-bold text-foreground truncate">{displayLocation}</h2>
            <div className="flex items-center gap-1 text-[11px] md:text-sm text-muted-foreground truncate">
              <MapPin size={14} className="flex-shrink-0" />
              <span className="truncate">{chosenLocation?.country || "Locating..."}</span>
              <button
                className="ml-1 md:ml-2 text-accent font-medium transition-colors hover:text-accent/80 flex-shrink-0"
                onClick={() => setShowLocationModal(true)}
              >
                Change
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <span className="hidden lg:block text-xs md:text-sm bg-cyan-800 text-accent-foreground px-3 py-1.5 md:py-2 rounded-full border border-accent/30">
              ● {activeIssuesCount} Active {activeIssuesCount === 1 ? 'Issue' : 'Issues'}
            </span>
            <button
              className="btn-gradient flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-xl whitespace-nowrap"
              onClick={() => navigate("/dashboard/report")}
            >
              <Plus size={16} />
              <span className="hidden sm:inline text-sm">New Issue</span>
              <span className="sm:hidden text-xs">Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* DYNAMIC STATS - Hidden on mobile/tablet */}
      <div className="hidden lg:block mt-6 px-6 relative z-10">
        <div className="grid grid-cols-3 gap-6">
          <StatCard icon={<CheckCircle2 className="text-secondary w-6 h-6" />} label="Recently Resolved" value={dynamicStats.resolved} />
          <StatCard icon={<Clock className="text-secondary w-6 h-6" />} label="Pending Verification" value={dynamicStats.pending} />
          <StatCard icon={<Users className="text-accent w-6 h-6" />} label="Area Impact" value={dynamicStats.impactLevel} />
        </div>
      </div>

      {/* PRIORITY ISSUES */}
      <div className="px-2 md:px-6 mt-4 lg:mt-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-4 md:mb-6">
          <h3 className="text-lg md:text-xl font-bold text-foreground">Priority Issues in Your Area</h3>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setSortBy("newest")} className={`px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-xs md:text-sm transition-all duration-200 ${sortBy === "newest" ? "btn-gradient text-white shadow-md font-medium" : "border border-border bg-card text-muted-foreground hover:bg-muted"}`}>Newest</button>
            <button onClick={() => setSortBy("impactful")} className={`px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-xs md:text-sm transition-all duration-200 ${sortBy === "impactful" ? "btn-gradient text-white shadow-md font-medium" : "border border-border bg-card text-muted-foreground hover:bg-muted"}`}>Most Impactful</button>
          </div>
        </div>

        {/* NPM INFINITE SCROLL COMPONENT */}
        {sortedIssues.length === 0 && !loading && !error ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground text-sm md:text-base">No Issues found in your area</p>
          </div>
        ) : error && sortedIssues.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-destructive text-sm md:text-base">Failed to load issues. Please try again.</p>
          </div>
        ) : (
          <InfiniteScroll
            dataLength={sortedIssues.length}
            next={fetchMoreData}
            hasMore={pagination.currentPage < pagination.totalPages}
            loader={
              <div className="col-span-full flex flex-col justify-center items-center py-4 w-full gap-3 overflow-hidden">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="text-xs font-medium text-muted-foreground animate-pulse">Loading more issues...</span>
              </div>
            }
            className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 pt-2 pb-2 overflow-visible w-full"
            style={{ overflow: 'visible' }}
          >
            {sortedIssues.map((issue) => (
              <IssueCard
                key={issue._id || issue.id}
                issue={issue}
                onClick={() => handleCardClick(issue)}
                onFlagClick={() => handleFlagClick(issue)}
              />
            ))}
          </InfiniteScroll>
        )}
      </div>

      <LocationModal isOpen={showLocationModal} onClose={() => { setShowLocationModal(false); handleLocationUpdate(); }} forceLocation={location.pathname === '/dashboard' && !chosenLocation} />
      <IssueDetail issue={selectedIssue} isOpen={isDetailOpen} onClose={handleCloseDetail} />
      <FlagModal isOpen={showFlagModal} onClose={() => { setShowFlagModal(false); setSelectedIssueForFlag(null); }} onSubmit={handleFlagSubmit} isLoading={flagLoading} />
    </div>
  );
};

export default Feed;

const StatCard = ({ icon, label, value }) => (
  <div className="glass-card p-4 md:p-5 rounded-xl flex gap-3 md:gap-4 items-center hover:shadow-md md:hover:shadow-lg transition-all bg-card/80 backdrop-blur-md">
    <div className="p-2.5 md:p-3 bg-muted rounded-full">{icon}</div>
    <div>
      <p className="text-[11px] md:text-sm text-muted-foreground">{label}</p>
      <p className="text-xl md:text-2xl font-bold text-foreground transition-all duration-300">{value}</p>
    </div>
  </div>
);