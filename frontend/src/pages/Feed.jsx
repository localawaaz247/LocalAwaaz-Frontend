import { MapPin, Plus, CheckCircle2, Clock, Users, ShieldCheck } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import InfiniteScroll from "react-infinite-scroll-component";
import { getChosenLocation, formatLocationDisplay } from "../utils/locationUtils";
import LocationModal from "../components/LocationModal";
import IssueCard from "../components/IssueCard";
import IssueDetail from "../components/IssueDetail";
import FlagModal from "../components/modals/FlagModal";
import axiosInstance from "../utils/axios";
import { fetchIssues, clearIssues } from "../reducer/issueFeedReducer";
import { showToast } from "../utils/toast";
import { useTranslation } from "react-i18next";

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

  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const context = useOutletContext();
  const selectedIssueId = context?.selectedIssueId;
  const setSelectedIssueId = context?.setSelectedIssueId;

  const { issues, loading, error, pagination } = useSelector((state) => state.issueFeed);

  const displayLocation = chosenLocation ? formatLocationDisplay(chosenLocation) : t('locating');
  const activeIssuesCount = pagination?.totalIssues || issues?.length || 0;

  useEffect(() => {
    const fetchAndOpenIssue = async () => {
      if (!selectedIssueId) return;
      const existingIssue = issues?.find(i => i._id === selectedIssueId);
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
  }, [selectedIssueId, issues, setSelectedIssueId, t]);

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

  useEffect(() => {
    const CACHE_TIME_LIMIT = 2 * 60 * 60 * 1000;
    const checkAndFetchLocation = async () => {
      const cachedData = localStorage.getItem('cached_geo_location');
      let parsedCache = cachedData ? JSON.parse(cachedData) : null;
      const now = Date.now();

      if (parsedCache && (now - parsedCache.timestamp < CACHE_TIME_LIMIT)) {
        setChosenLocation(parsedCache);
        fetchData(1, parsedCache);
        return;
      }

      // 1. Check if user previously blocked the location prompt
      const locationDenied = localStorage.getItem('location_denied') === 'true';

      if (navigator.geolocation && !locationDenied) {
        showToast({ icon: "info", title: t('locating_neighborhood') });
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude, longitude } = pos.coords;
            try {
              const res = await axiosInstance.post('/get-location-from-coords', { lat: latitude, lng: longitude });
              if (res.data?.success) {
                const newLocation = {
                  latitude, longitude,
                  city: res.data.data.city, state: res.data.data.state, country: res.data.data.country,
                  timestamp: Date.now()
                };
                localStorage.setItem('cached_geo_location', JSON.stringify(newLocation));
                setChosenLocation(newLocation);
                fetchData(1, newLocation);
              }
            } catch (err) {
              fetchData(1);
            }
          },
          (err) => {
            // THE FIX: Save the preference and load default data. 
            // DO NOT call setShowLocationModal(true) here!
            localStorage.setItem('location_denied', 'true');
            fetchData(1);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else {
        // THE FIX: DO NOT call setShowLocationModal(true) here either!
        fetchData(1);
      }
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

  const dynamicStats = useMemo(() => {
    let resolved = 0; let pending = 0; let totalImpact = 0;
    if (!issues || issues.length === 0) return { resolved: 0, pending: 0, impactLevel: t('evaluating') };

    issues.forEach(issue => {
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
  }, [issues, t]);

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
      <style>{`
        @keyframes shimmerSweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmerSweep 1.8s infinite;
        }
      `}</style>

      <div className="px-3 md:px-6 py-3 md:py-4 sticky top-2 glass-card z-40 rounded-lg border-0 border-b border-border mx-2 md:mx-4 shadow-sm">
        <div className="flex justify-between items-center">
          <div className="min-w-0 pr-2">
            <h2 className="text-base md:text-lg font-bold text-foreground truncate">{displayLocation}</h2>
            <div className="flex items-center gap-1 text-[11px] md:text-sm text-muted-foreground truncate">
              <MapPin size={14} className="flex-shrink-0" />
              <span className="truncate">{chosenLocation?.country || t('locating')}</span>
              <button
                className="ml-1 md:ml-2 text-accent font-medium transition-colors hover:text-accent/80 flex-shrink-0"
                onClick={() => setShowLocationModal(true)}
              >
                {t('change')}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <span className="hidden lg:block text-xs md:text-sm bg-cyan-800 text-accent-foreground px-3 py-1.5 md:py-2 rounded-full border border-accent/30">
              ● {activeIssuesCount} {t('active')} {activeIssuesCount === 1 ? t('issue_singular') : t('issues_label')}
            </span>
            <button
              className="btn-gradient flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-xl whitespace-nowrap"
              onClick={() => navigate("/dashboard/report")}
            >
              <Plus size={16} />
              <span className="hidden sm:inline text-sm">{t('new_issue')}</span>
              <span className="sm:hidden text-xs">{t('report')}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="hidden lg:block mt-6 px-6 relative z-10">
        <div className="grid grid-cols-3 gap-6">
          <StatCard icon={<CheckCircle2 className="text-secondary w-6 h-6" />} label={t('recently_resolved')} value={dynamicStats.resolved} />
          <StatCard icon={<Clock className="text-secondary w-6 h-6" />} label={t('pending_verification')} value={dynamicStats.pending} />
          <StatCard icon={<Users className="text-accent w-6 h-6" />} label={t('area_impact')} value={dynamicStats.impactLevel} />
        </div>
      </div>

      <div className="px-2 md:px-6 mt-4 lg:mt-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-4 md:mb-6">
          <h3 className="text-lg md:text-xl font-bold text-foreground">{t('priority_issues')}</h3>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setSortBy("newest")} className={`px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-xs md:text-sm transition-all duration-200 ${sortBy === "newest" ? "btn-gradient text-white shadow-md font-medium" : "border border-border bg-card text-muted-foreground hover:bg-muted"}`}>{t('newest')}</button>
            <button onClick={() => setSortBy("impactful")} className={`px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-xs md:text-sm transition-all duration-200 ${sortBy === "impactful" ? "btn-gradient text-white shadow-md font-medium" : "border border-border bg-card text-muted-foreground hover:bg-muted"}`}>{t('most_impactful')}</button>
          </div>
        </div>

        {loading && sortedIssues.length === 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 pt-2 pb-2 overflow-hidden w-full">
            {[1, 2, 3, 4].map(n => <IssueSkeleton key={n} />)}
          </div>
        ) :

          sortedIssues.length === 0 && !error ? (
            <EmptyFeedState onReport={() => navigate("/dashboard/report")} t={t} />
          ) :

            error && sortedIssues.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border/50 rounded-2xl">
                <p className="text-red-500 font-medium mb-2">{t('failed_load_issues')}</p>
                <button onClick={() => fetchData(1)} className="px-4 py-2 bg-muted rounded-xl hover:bg-muted/80 transition-colors text-sm">{t('try_again')}</button>
              </div>
            ) :

              (
                <InfiniteScroll
                  dataLength={sortedIssues.length}
                  next={fetchMoreData}
                  hasMore={pagination.currentPage < pagination.totalPages}
                  loader={
                    <div className="col-span-full grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 py-4 w-full">
                      {[1, 2].map(n => <IssueSkeleton key={`loader-${n}`} />)}
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
  <div className="glass-card p-4 md:p-5 rounded-xl flex gap-3 md:gap-4 items-center hover:shadow-md md:hover:shadow-lg transition-all bg-card/80 backdrop-blur-md">
    <div className="p-2.5 md:p-3 bg-muted rounded-full">{icon}</div>
    <div>
      <p className="text-[11px] md:text-sm text-muted-foreground">{label}</p>
      <p className="text-xl md:text-2xl font-bold text-foreground transition-all duration-300">{value}</p>
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

    <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3 font-display">{t('all_clear')}</h3>

    <p className="text-sm md:text-base text-muted-foreground max-w-md mb-8 leading-relaxed">
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