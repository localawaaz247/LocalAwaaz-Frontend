import { MapPin, Plus, CheckCircle2, Clock, Users, ShieldCheck } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import InfiniteScroll from "react-infinite-scroll-component";
import { getChosenLocation, formatLocationDisplay, getCurrentPosition } from "../utils/locationUtils";
import LocationModal from "../components/LocationModal";
import IssueCard from "../components/IssueCard";
import IssueDetail from "../components/IssueDetail";
import FlagModal from "../components/modals/FlagModal";
import Logo from "../components/Logo";
import axiosInstance from "../utils/axios";
import { fetchIssues, clearIssues } from "../reducer/issueFeedReducer";
import { showToast } from "../utils/toast";
import { useTranslation } from "react-i18next";
import { socket } from "../utils/socket";
import Odometer from 'react-odometerjs';
import 'odometer/themes/odometer-theme-minimal.css';
import axios from "axios";
import toast from "react-hot-toast";

const Feed = () => {
  const { t } = useTranslation();
  const [chosenLocation, setChosenLocation] = useState(() => getChosenLocation());
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [selectedIssueForFlag, setSelectedIssueForFlag] = useState(null);
  const [flagLoading, setFlagLoading] = useState(false);

  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [visitors, setVisitors] = useState(0);
  const [isLocating, setIsLocating] = useState(true);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const context = useOutletContext();
  const selectedIssueId = context?.selectedIssueId;
  const setSelectedIssueId = context?.setSelectedIssueId;

  const { issues, loading, error, pagination } = useSelector((state) => state.issueFeed);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- REAL-TIME FEED ENGINE ---
  const [liveIssues, setLiveIssues] = useState([]);

  useEffect(() => {
    setLiveIssues(issues || []);
  }, [issues]);

  useEffect(() => {
    if (!socket) return;

    const handleIssueUpdated = (data) => {
      setLiveIssues(prev => prev.map(issue => issue._id === data.issueId ? { ...issue, ...data.updatedData } : issue));
      setSelectedIssue(prev => prev?._id === data.issueId ? { ...prev, ...data.updatedData } : prev);
    };

    const handleIssueStatusUpdated = (data) => {
      setLiveIssues(prev => prev.map(issue => issue._id === data.issueId ? { ...issue, status: data.newStatus } : issue));
      setSelectedIssue(prev => prev?._id === data.issueId ? { ...prev, status: data.newStatus } : prev);
    };

    const handleIssueStatsUpdated = (data) => {
      setLiveIssues(prev => prev.map(issue => issue._id === data.issueId ? {
        ...issue,
        confirmationCount: data.confirmationCount ?? issue.confirmationCount,
        impactScore: data.impactScore ?? issue.impactScore,
        flagCount: data.flagCount ?? issue.flagCount,
        shareCount: data.shareCount ?? issue.shareCount
      } : issue));
      setSelectedIssue(prev => prev?._id === data.issueId ? {
        ...prev,
        confirmationCount: data.confirmationCount ?? prev.confirmationCount,
        impactScore: data.impactScore ?? prev.impactScore,
        flagCount: data.flagCount ?? prev.flagCount,
        shareCount: data.shareCount ?? prev.shareCount
      } : prev);
    };

    const handleIssueDeleted = (data) => {
      setLiveIssues(prev => prev.filter(issue => issue._id !== data.issueId));
      if (selectedIssue?._id === data.issueId) {
        setIsDetailOpen(false);
        setSelectedIssue(null);
        toast.error(t('issue_removed', 'This issue was removed by an administrator.'));
      }
    };

    socket.on('issue_updated', handleIssueUpdated);
    socket.on('issue_status_updated', handleIssueStatusUpdated);
    socket.on('issue_stats_updated', handleIssueStatsUpdated);
    socket.on('issue_deleted', handleIssueDeleted);

    return () => {
      socket.off('issue_updated', handleIssueUpdated);
      socket.off('issue_status_updated', handleIssueStatusUpdated);
      socket.off('issue_stats_updated', handleIssueStatsUpdated);
      socket.off('issue_deleted', handleIssueDeleted);
    };
  }, [selectedIssue, t]);

  const displayLocation = chosenLocation ? formatLocationDisplay(chosenLocation) : t('locating');

  useEffect(() => {
    socket.on('live_visitor_update', (data) => {
      setVisitors(data.count);
    });

    const fetchVisits = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL || 'http://localhost:1111'}/api/community-stats`,
          { withCredentials: true }
        );
        setTimeout(() => setVisitors(response.data.count), 150);
      } catch (error) {
        console.error("Failed to fetch visit count:", error);
      }
    };

    fetchVisits();
  }, []);

  useEffect(() => {
    const fetchAndOpenIssue = async () => {
      if (!selectedIssueId) return;
      const existingIssue = liveIssues?.find(i => i._id === selectedIssueId);
      if (existingIssue) {
        setSelectedIssue(existingIssue);
        setIsDetailOpen(true);
        return;
      }
      try {
        const response = await axiosInstance.get(`/issue/${selectedIssueId}`);
        setSelectedIssue(response.data.data);
        setIsDetailOpen(true);
      } catch (err) {
        console.error("Failed to fetch specific issue details:", err);
        showToast({ icon: "error", title: t('issue_not_found') });
        if (setSelectedIssueId) setSelectedIssueId(null);
      }
    };
    fetchAndOpenIssue();
  }, [selectedIssueId, liveIssues, setSelectedIssueId, t]);

  const fetchData = (currentPage, specificLocation = null, sortParam = sortBy) => {
    const locToUse = specificLocation || getChosenLocation();
    if (locToUse) {
      dispatch(fetchIssues({ ...locToUse, page: currentPage, sortBy: sortParam }));
    }
  };

  const fetchMoreData = () => {
    if (pagination.currentPage < pagination.totalPages) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchData(nextPage);
    }
  };

  useEffect(() => {
    const CACHE_TIME_LIMIT = 2 * 60 * 60 * 1000;

    const checkAndFetchLocation = async () => {
      setIsLocating(true); // Force skeleton to show

      const cachedData = localStorage.getItem('cached_geo_location');
      let parsedCache = cachedData ? JSON.parse(cachedData) : null;
      const now = Date.now();

      if (parsedCache && (now - parsedCache.timestamp < CACHE_TIME_LIMIT)) {
        setChosenLocation(parsedCache);
        setIsLocating(false);
        fetchData(1, parsedCache);
        return;
      }

      const locationDenied = localStorage.getItem('location_denied') === 'true';

      if (!locationDenied) {
        showToast({ icon: "info", title: t('locating_neighborhood') });

        try {
          // Use our newly updated Capacitor-powered utility!
          const position = await getCurrentPosition();

          // Reverse geocode via your Node backend
          const res = await axiosInstance.post('/get-location-from-coords', {
            lat: position.latitude,
            lng: position.longitude
          });

          if (res.data?.success) {
            const newLocation = {
              latitude: position.latitude,
              longitude: position.longitude,
              city: res.data.data.city,
              state: res.data.data.state,
              country: res.data.data.country,
              timestamp: Date.now()
            };

            localStorage.setItem('cached_geo_location', JSON.stringify(newLocation));
            setChosenLocation(newLocation);
            setIsLocating(false);
            fetchData(1, newLocation);
            return; // Exit successfully
          }
        } catch (err) {
          console.warn("Location fetch failed or was denied:", err);
          localStorage.setItem('location_denied', 'true');
        }
      }

      // Fallback if denied or failed
      setIsLocating(false);
      fetchData(1);
    };

    checkAndFetchLocation();
  }, [dispatch, t]);

  const handleLocationUpdate = () => {
    const updatedLocation = getChosenLocation();
    setChosenLocation(updatedLocation);
    setPage(1);
    if (updatedLocation) fetchData(1, updatedLocation);
    else dispatch(clearIssues());
  };

  const handleCardClick = (issue) => {
    setSelectedIssue(issue);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setTimeout(() => {
      setSelectedIssue(null);
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
      showToast({ icon: "success", title: response.data?.message || t('issue_flagged_success') });
      setShowFlagModal(false);
      setSelectedIssueForFlag(null);
      setPage(1);
      fetchData(1);
    } catch (error) {
      showToast({ icon: "error", title: error.response?.data?.message || t('flag_failed') });
    } finally {
      setFlagLoading(false);
    }
  };

  const handleSortChange = (newSortType) => {
    if (sortBy === newSortType) return;

    setSortBy(newSortType);
    setPage(1);
    dispatch(clearIssues());

    // Respect scroll behaviors based on viewport
    const mobileContainer = document.getElementById("mobile-snap-container");
    if (isMobile && mobileContainer) {
      mobileContainer.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }

    fetchData(1, chosenLocation, newSortType);
  };

  const dynamicStats = useMemo(() => {
    let resolved = 0; let pending = 0; let totalImpact = 0;
    if (!liveIssues || liveIssues.length === 0) return { resolved: 0, pending: 0, impactLevel: t('evaluating') };

    liveIssues.forEach(issue => {
      const stat = issue.status?.toUpperCase() || 'OPEN';
      if (stat === "RESOLVED") resolved += 1;
      else if (["IN_REVIEW", "UNDER REVIEW", "OPEN", "PENDING"].includes(stat)) pending += 1;
      totalImpact += (issue.impactScore || issue.impact || 0) + (issue.confirmationCount || 0);
    });

    let impactLevel = t('low');
    if (totalImpact > 100) impactLevel = t('critical');
    else if (totalImpact > 50) impactLevel = t('high');
    else if (totalImpact > 20) impactLevel = t('medium');
    else if (totalImpact > 0) impactLevel = t('emerging');

    return { resolved, pending, impactLevel };
  }, [liveIssues, t]);

  const sortedIssues = useMemo(() => {
    if (!liveIssues) return [];
    return [...liveIssues].sort((a, b) => {
      if (sortBy === "impactful") {
        const impactA = a.impactScore || a.impact || 0;
        const impactB = b.impactScore || b.impact || 0;
        if (impactB !== impactA) return impactB - impactA;
      }
      const dateA = new Date(a.createdAt || a._id || 0).getTime();
      const dateB = new Date(b.createdAt || b._id || 0).getTime();
      return dateB - dateA;
    });
  }, [liveIssues, sortBy]);

  return (
    <div className="bg-texture flex flex-col h-[100dvh] overflow-hidden w-full relative max-lg:fixed max-lg:inset-0 max-lg:overscroll-none">
      <style>{`
        @keyframes shimmerSweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmerSweep 1.8s infinite;
        }

        /* Responsive Snap Scroll CSS */
        @media (max-width: 1023px) {
          .snap-container::-webkit-scrollbar {
            display: none;
          }
          .snap-container {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        }
      `}</style>

      {/* 🟢 TOP HEADER SECTION */}
      <div className="flex-shrink-0 w-full z-40 bg-texture">
        {/* 🟢 Replaced width with height constraints (h-10) so it doesn't blow up on mobile */}
        <div className="w-full flex justify-center pt-5 pb-2 lg:hidden">
          <Logo className="h-10" />
        </div>

        <div className="px-3 lg:px-6 py-3 lg:py-4 glass-card rounded-lg border-0 border-b border-border mx-2 lg:mx-4 shadow-sm flex justify-between items-center relative mb-4 lg:mb-8">

          {/* 🟢 Constrained desktop height as well */}
          <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none justify-center">
            <Logo className="h-10 xl:h-12" />
          </div>

          <div className="min-w-0 pr-2">
            <h2 className="text-base lg:text-lg font-bold text-foreground truncate">{displayLocation}</h2>
            <div className="flex items-center gap-1 text-[11px] lg:text-sm text-muted-foreground truncate">
              <MapPin size={14} className="flex-shrink-0" />
              <span className="truncate">{chosenLocation?.country || t('locating')}</span>
              <button
                className="ml-1 lg:ml-2 text-accent font-medium transition-colors hover:text-accent/80 flex-shrink-0"
                onClick={() => setShowLocationModal(true)}
              >
                {t('change')}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
            <div className="flex items-center gap-1.5 bg-background/50 backdrop-blur-sm border border-border/60 px-2.5 py-1.5 lg:px-3 lg:py-2 rounded-full shadow-sm text-muted-foreground transition-all">
              <Users size={14} className="text-primary flex-shrink-0" />
              <span className="hidden lg:inline text-xs lg:text-sm font-medium tracking-wide">
                {t('citizens_reached', 'Reached')}:
              </span>
              <div className="text-xs lg:text-sm font-bold text-foreground font-mono">
                <Odometer value={visitors} format="(,ddd)" duration={800} />
              </div>
            </div>

            <button
              className="hidden lg:flex btn-gradient items-center gap-1.5 lg:gap-2 px-3 lg:px-4 py-1.5 lg:py-2 rounded-xl whitespace-nowrap shadow-sm hover:shadow-md transition-all hover:scale-[1.02]"
              onClick={() => navigate("/dashboard/report")}
            >
              <Plus size={16} />
              <span className="text-sm">{t('new_issue')}</span>
            </button>
          </div>
        </div>

        <div className="px-3 lg:hidden mt-2 mb-2">
          <h3 className="text-lg font-bold text-foreground">Top Reports in Your Area</h3>
        </div>

        <div className="hidden lg:block px-6 relative z-10 mb-8">
          <div className="grid grid-cols-3 gap-6">
            <StatCard icon={<CheckCircle2 className="text-secondary w-6 h-6" />} label={t('recently_resolved')} value={dynamicStats.resolved} />
            <StatCard icon={<Clock className="text-secondary w-6 h-6" />} label={t('pending_verification')} value={dynamicStats.pending} />
            <StatCard icon={<Users className="text-accent w-6 h-6" />} label={t('area_impact')} value={dynamicStats.impactLevel} />
          </div>
        </div>

        <div className="px-2 lg:px-6 w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-4 lg:mb-6">
            <div className="flex flex-wrap gap-2">
              <button onClick={() => handleSortChange("newest")} className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-xl text-xs lg:text-sm transition-all duration-200 ${sortBy === "newest" ? "btn-gradient text-white shadow-md font-medium" : "border border-border bg-card text-muted-foreground hover:bg-muted"}`}>{t('newest')}</button>
              <button onClick={() => handleSortChange("impactful")} className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-xl text-xs lg:text-sm transition-all duration-200 ${sortBy === "impactful" ? "btn-gradient text-white shadow-md font-medium" : "border border-border bg-card text-muted-foreground hover:bg-muted"}`}>{t('most_impactful')}</button>
            </div>
          </div>
        </div>
      </div>

      {/* 🟢 SCROLLABLE FEED SECTION (HYBRID RESPONSIVE) */}
      <div className="flex-1 min-h-0 w-full relative max-lg:px-0 lg:px-6">
        <div
          id="mobile-snap-container"
          className="h-full w-full overflow-y-auto overflow-x-hidden snap-container overscroll-contain max-lg:absolute max-lg:inset-0 max-lg:px-2 max-lg:snap-y max-lg:snap-mandatory"
          style={{ containerType: 'size' }}
        >
          {(loading || isLocating) && sortedIssues.length === 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 pt-2 pb-2 overflow-hidden w-full h-full">
              {[1, 2, 3, 4].map(n => <IssueSkeleton key={n} />)}
            </div>
          ) : sortedIssues.length === 0 && !error ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 pt-2 pb-2 overflow-hidden w-full h-full">
              {[1, 2, 3, 4].map(n => <IssueSkeleton key={n} />)}
            </div>
          ) : sortedIssues.length === 0 && !error ? (
            <div className="h-full w-full">
              <EmptyFeedState onReport={() => navigate("/dashboard/report")} t={t} />
            </div>
          ) : error && sortedIssues.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border/50 rounded-2xl mx-auto w-full mt-4">
              <p className="text-red-500 font-medium mb-2">{t('failed_load_issues')}</p>
              <button onClick={() => fetchData(1)} className="px-4 py-2 bg-muted rounded-xl hover:bg-muted/80 transition-colors text-sm">{t('try_again')}</button>
            </div>
          ) : (
            <InfiniteScroll
              dataLength={sortedIssues.length}
              next={fetchMoreData}
              hasMore={pagination.currentPage < pagination.totalPages}
              scrollableTarget={isMobile ? "mobile-snap-container" : undefined}
              loader={
                <div className="col-span-full grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-6 py-4 w-full">
                  {[1, 2].map(n => <IssueSkeleton key={`loader-${n}`} />)}
                </div>
              }
              className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-6 pt-0 lg:pt-2 pb-24 lg:pb-8 w-full"
              style={{ overflow: 'visible' }}
            >
              {sortedIssues.map((issue) => (
                <div
                  key={issue._id || issue.id}
                  className="max-lg:snap-start max-lg:snap-always max-lg:flex max-lg:items-stretch max-lg:justify-center max-lg:w-full max-lg:pt-2 lg:py-0 lg:h-full lg:min-h-[450px]"
                  style={{ height: isMobile ? 'calc(100dvh - 300px)' : undefined }}
                >
                  <div className="w-full h-full max-h-full flex flex-col">
                    <IssueCard
                      issue={issue}
                      onClick={() => handleCardClick(issue)}
                      onFlagClick={() => handleFlagClick(issue)}
                      // Optional: Pass a className prop if your IssueCard accepts it
                      className="flex-1"
                    />
                  </div>
                </div>
              ))}
            </InfiniteScroll>
          )}
        </div>
      </div>

      <LocationModal
        isOpen={showLocationModal}
        onClose={() => {
          setShowLocationModal(false);
          handleLocationUpdate();
        }}
        forceLocation={false}
      />
      <IssueDetail issue={selectedIssue} isOpen={isDetailOpen} onClose={handleCloseDetail} />
      <FlagModal isOpen={showFlagModal} onClose={() => { setShowFlagModal(false); setSelectedIssueForFlag(null); }} onSubmit={handleFlagSubmit} isLoading={flagLoading} />
    </div>
  );
};

export default Feed;

const StatCard = ({ icon, label, value }) => (
  <div className="glass-card p-4 lg:p-5 rounded-xl flex gap-3 lg:gap-4 items-center hover:shadow-md lg:hover:shadow-lg transition-all bg-card/80 backdrop-blur-md">
    <div className="p-2.5 lg:p-3 bg-muted rounded-full">{icon}</div>
    <div>
      <p className="text-[11px] lg:text-sm text-muted-foreground">{label}</p>
      <p className="text-xl lg:text-2xl font-bold text-foreground transition-all duration-300">{value}</p>
    </div>
  </div>
);

const IssueSkeleton = () => (
  <div className="bg-card border border-border/50 rounded-2xl p-5 w-full relative overflow-hidden flex flex-col justify-between h-auto min-h-[350px]">
    <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent animate-shimmer" />

    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <div className="w-14 h-5 bg-muted rounded-full" />
          <div className="w-20 h-5 bg-muted rounded-full" />
        </div>
        <div className="w-24 h-4 bg-muted rounded-md" />
      </div>

      <div className="w-3/4 h-6 bg-muted rounded-lg mb-3" />
      <div className="w-full h-4 bg-muted rounded-md mb-2" />
      <div className="w-5/6 h-4 bg-muted rounded-md mb-5" />

      <div className="w-full h-48 sm:h-56 bg-muted rounded-xl mb-5" />
    </div>

    <div className="flex justify-between items-end mt-auto">
      <div className="space-y-3 flex-1 pr-4">
        <div className="w-32 h-4 bg-muted rounded-md" />
        <div className="w-24 h-4 bg-muted rounded-md" />
      </div>
      <div className="flex gap-2">
        <div className="w-16 h-9 bg-muted rounded-xl" />
        <div className="w-24 h-9 bg-muted rounded-xl" />
      </div>
    </div>
  </div>
);

const EmptyFeedState = ({ onReport, t }) => (
  <div className="col-span-full flex flex-col items-center justify-center py-20 px-4 text-center animate-fade-in-up bg-card/30 border border-border/50 rounded-2xl mt-4">

    <div className="relative mb-6">
      <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-60" />
      <div className="w-24 h-24 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center relative z-10 backdrop-blur-sm">
        <ShieldCheck size={48} className="text-primary" />
      </div>
    </div>

    <h3 className="text-2xl lg:text-3xl font-bold text-foreground mb-3 font-display">{t('all_clear')}</h3>

    <p className="text-sm lg:text-base text-muted-foreground max-w-md mb-8 leading-relaxed">
      {t('no_issues_neighborhood')}
    </p>

    <button
      onClick={onReport}
      className="btn-gradient px-8 py-3.5 rounded-xl font-bold text-white flex items-center gap-2 transition-transform hover:scale-105 hover:shadow-lg hover:shadow-primary/20"
    >
      <Plus size={18} /> {t('report_issue')}
    </button>
  </div>
);