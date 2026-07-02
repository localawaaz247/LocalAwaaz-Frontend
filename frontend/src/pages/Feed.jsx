import { MapPin, Plus, CheckCircle2, Clock, Users, ShieldCheck, Camera as CameraIcon, X, Check, Loader2 } from "lucide-react";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import InfiniteScroll from "react-infinite-scroll-component";
import { createPortal } from "react-dom";
import { Capacitor } from "@capacitor/core";
import { Camera } from '@capacitor/camera';
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

const IS_NATIVE = Capacitor.isNativePlatform();

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

  // --- IG SWIPE (RIGHT) & CAMERA STATES ---
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [activeView, setActiveView] = useState('feed'); // 'feed' | 'camera'

  const [mediaStream, setMediaStream] = useState(null);
  const [capturedMedia, setCapturedMedia] = useState(null);

  const [isProcessingMedia, setIsProcessingMedia] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const videoRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const openCameraUI = () => {
    if (!IS_NATIVE) return;
    setActiveView('camera');
    setSwipeOffset(window.innerWidth);
    startCamera();
  };

  const handleTouchStart = (e) => {
    if (!IS_NATIVE || !isMobile) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (!IS_NATIVE || !isMobile || !isSwiping) return;

    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;

    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      setIsSwiping(false);
      return;
    }

    if (activeView === 'feed' && deltaX > 0) {
      setSwipeOffset(deltaX);
    } else if (activeView === 'camera' && deltaX < 0) {
      setSwipeOffset(window.innerWidth + deltaX);
    }
  };

  const handleTouchEnd = () => {
    if (!IS_NATIVE || !isMobile) return;
    setIsSwiping(false);

    const threshold = window.innerWidth * 0.25;

    if (activeView === 'feed' && swipeOffset > threshold) {
      openCameraUI();
    } else if (activeView === 'camera' && swipeOffset < window.innerWidth - threshold) {
      setActiveView('feed');
      setSwipeOffset(0);
      stopCamera();
    } else {
      setSwipeOffset(activeView === 'feed' ? 0 : window.innerWidth);
    }
  };

  // --- CAMERA & MEDIA LOGIC ---
  const startCamera = async () => {
    try {
      if (IS_NATIVE) {
        await Camera.requestPermissions({ permissions: ['camera'] });
      }

      // 🔴 No audio requested, so it won't crash on mic permissions anymore
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setMediaStream(stream);
    } catch (err) {
      console.error("Camera access denied:", err);
      toast.error("Unable to access camera.");
      setActiveView('feed');
      setSwipeOffset(0);
    }
  };

  useEffect(() => {
    if (activeView === 'camera' && mediaStream && videoRef.current) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream, activeView]);

  const stopCamera = useCallback(() => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    setCapturedMedia(null);
  }, [mediaStream]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    setIsProcessingMedia(true);

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0);

    canvas.toBlob((blob) => {
      const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
      setCapturedMedia({ file, type: 'image', url: URL.createObjectURL(file) });
      setIsProcessingMedia(false);

      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    }, 'image/jpeg', 0.9);
  };

  const handleConfirmMedia = async () => {
    if (!capturedMedia) return;
    setIsConfirming(true);
    let finalLocation = null;

    try {
      const position = await getCurrentPosition({ enableHighAccuracy: true, timeout: 5000 });
      const { latitude, longitude } = position;
      finalLocation = { coordinates: [longitude, latitude], city: null, state: null };

      try {
        const res = await axiosInstance.post('/get-location-from-coords', { lat: latitude, lng: longitude });
        if (res.data?.success) {
          finalLocation.city = res.data.data.city;
          finalLocation.state = res.data.data.state;
        }
      } catch (geocodeErr) { }

      stopCamera();

      navigate('/dashboard/report', {
        state: {
          autoTriggerAI: true,
          prefilledData: {
            originalFiles: [capturedMedia.file],
            location: finalLocation
          }
        }
      });
    } catch (err) {
      toast.error("Location access is required to report an issue.");
      setIsConfirming(false);
    }
  };

  const handleRetake = () => {
    setCapturedMedia(null);
    setIsConfirming(false);
    startCamera();
  };

  // --- REAL-TIME FEED ENGINE ---
  const [liveIssues, setLiveIssues] = useState([]);

  useEffect(() => { setLiveIssues(issues || []); }, [issues]);

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
    socket.on('live_visitor_update', (data) => setVisitors(data.count));
    const fetchVisits = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL || 'http://localhost:1111'}/api/community-stats`, { withCredentials: true });
        setTimeout(() => setVisitors(response.data.count), 150);
      } catch (error) { }
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
      setIsLocating(true);
      const cachedData = localStorage.getItem('cached_geo_location');
      let parsedCache = cachedData ? JSON.parse(cachedData) : null;
      const now = Date.now();

      if (parsedCache) {
        setChosenLocation(parsedCache);
        setIsLocating(false);
        fetchData(1, parsedCache);
        if (now - parsedCache.timestamp < CACHE_TIME_LIMIT) return;
      } else {
        setIsLocating(false);
        fetchData(1);
      }

      const locationDenied = localStorage.getItem('location_denied') === 'true';
      if (!locationDenied) {
        try {
          const position = await getCurrentPosition({ enableHighAccuracy: false, timeout: 5000 });
          const res = await axiosInstance.post('/get-location-from-coords', {
            lat: position.latitude, lng: position.longitude
          });
          if (res.data?.success) {
            const newLocation = {
              latitude: position.latitude, longitude: position.longitude,
              city: res.data.data.city, state: res.data.data.state, country: res.data.data.country,
              timestamp: Date.now()
            };
            localStorage.setItem('cached_geo_location', JSON.stringify(newLocation));
            if (!parsedCache || parsedCache.city !== newLocation.city) {
              setChosenLocation(newLocation);
              fetchData(1, newLocation);
            }
          }
        } catch (err) {
          if (err.message?.includes('denied')) localStorage.setItem('location_denied', 'true');
        }
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

  const handleCardClick = (issue) => { setSelectedIssue(issue); setIsDetailOpen(true); };
  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setTimeout(() => { setSelectedIssue(null); if (setSelectedIssueId) setSelectedIssueId(null); }, 300);
  };

  const handleFlagClick = (issue) => { setSelectedIssueForFlag(issue); setShowFlagModal(true); };
  const handleFlagSubmit = async (flagReason) => {
    try {
      setFlagLoading(true);
      const coords = JSON.parse(localStorage.getItem('cached_geo_location')) || JSON.parse(localStorage.getItem('currentLocation'));
      await axiosInstance.post(`/issue/${selectedIssueForFlag._id}/${flagReason}?lng=${coords?.longitude}&lat=${coords?.latitude}`);
      setShowFlagModal(false);
      setSelectedIssueForFlag(null);
      setPage(1);
      fetchData(1);
    } catch (error) { } finally { setFlagLoading(false); }
  };

  const handleSortChange = (newSortType) => {
    if (sortBy === newSortType) return;
    setSortBy(newSortType);
    setPage(1);
    dispatch(clearIssues());
    const mobileContainer = document.getElementById("mobile-snap-container");
    if (isMobile && mobileContainer) mobileContainer.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    else window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    fetchData(1, chosenLocation, newSortType);
  };

  const dynamicStats = useMemo(() => {
    let resolved = 0; let pending = 0; let activeImpactSum = 0;
    if (!liveIssues || liveIssues.length === 0) return { resolved: 0, pending: 0, impactLevel: t('evaluating', 'Evaluating...') };

    liveIssues.forEach(issue => {
      const stat = issue.status?.toUpperCase() || 'OPEN';
      if (stat === "RESOLVED") resolved += 1;
      else if (stat !== "REJECTED") {
        pending += 1;
        let priorityMultiplier = 1;
        if (issue.priority === 'CRITICAL') priorityMultiplier = 4;
        else if (issue.priority === 'HIGH') priorityMultiplier = 3;
        else if (issue.priority === 'MEDIUM') priorityMultiplier = 2;
        let statusPenalty = ['FAILED', 'DISPUTED', 'ORPHANED'].includes(stat) ? 15 : 0;
        activeImpactSum += (((issue.impactScore || 10) + (issue.confirmationCount || 0)) * priorityMultiplier) + statusPenalty;
      }
    });

    const averageActiveImpact = pending > 0 ? (activeImpactSum / pending) : 0;
    let impactLevel = t('low', 'Low');
    if (pending === 0 && resolved > 0) impactLevel = t('optimal', 'Optimal / Clear');
    else if (averageActiveImpact >= 60 || pending > 20) impactLevel = t('critical', 'Critical');
    else if (averageActiveImpact >= 35 || pending > 10) impactLevel = t('high', 'High');
    else if (averageActiveImpact >= 15 || pending > 5) impactLevel = t('moderate', 'Moderate');
    else if (pending > 0) impactLevel = t('emerging', 'Emerging');

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
      return new Date(b.createdAt || b._id || 0).getTime() - new Date(a.createdAt || a._id || 0).getTime();
    });
  }, [liveIssues, sortBy]);


  const CameraOverlay = () => {
    return (
      <div
        className="fixed top-0 left-0 w-full h-[100dvh] bg-black z-[9999999] flex flex-col pointer-events-auto"
        style={{
          transform: `translateX(${swipeOffset - window.innerWidth}px)`,
          transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
          willChange: 'transform',
          visibility: swipeOffset > 0 || activeView === 'camera' ? 'visible' : 'hidden'
        }}
      >
        {activeView === 'camera' && !capturedMedia && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            <div className="absolute top-10 left-4 z-50">
              <button
                onClick={() => { setActiveView('feed'); setSwipeOffset(0); stopCamera(); }}
                className="text-white p-2 bg-black/40 rounded-full backdrop-blur-md"
              >
                <X size={24} />
              </button>
            </div>

            {/* 🔴 Removed Video Button. Capture photo button is now centered alone. */}
            <div className="absolute bottom-16 left-0 right-0 flex justify-center items-center z-50">
              <button
                onClick={capturePhoto}
                disabled={isProcessingMedia}
                className="w-20 h-20 rounded-full border-4 border-white bg-white/20 flex justify-center items-center transition-transform active:scale-90 backdrop-blur-sm shadow-xl"
              >
                {isProcessingMedia && <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />}
              </button>
            </div>
          </>
        )}

        {activeView === 'camera' && capturedMedia && (
          <div className="absolute inset-0 bg-black flex flex-col z-50">
            <img src={capturedMedia.url} className="w-full h-full object-cover" alt="Preview" />

            <div className="absolute bottom-16 left-0 right-0 flex justify-center gap-12 z-50">
              <button onClick={handleRetake} disabled={isConfirming} className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex justify-center items-center text-white active:scale-90 transition">
                <X size={32} />
              </button>

              <button
                onClick={handleConfirmMedia}
                disabled={isConfirming}
                className={`w-16 h-16 rounded-full flex justify-center items-center text-white active:scale-90 transition shadow-[0_0_20px_rgba(6,182,212,0.6)] bg-gradient-to-tr from-cyan-500 to-teal-500 ${isConfirming ? 'opacity-80' : ''}`}
              >
                {isConfirming ? (
                  <Loader2 size={30} className="animate-spin text-white" />
                ) : (
                  <Check size={32} strokeWidth={3} />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {IS_NATIVE && typeof document !== 'undefined' && createPortal(<CameraOverlay />, document.body)}

      <div
        className="bg-texture flex flex-col h-[100dvh] overflow-hidden w-full relative max-lg:fixed max-lg:inset-0 max-lg:overscroll-none"
        onTouchStart={IS_NATIVE ? handleTouchStart : undefined}
        onTouchMove={IS_NATIVE ? handleTouchMove : undefined}
        onTouchEnd={IS_NATIVE ? handleTouchEnd : undefined}
      >
        <style>{`
          @keyframes shimmerSweep { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
          .animate-shimmer { animation: shimmerSweep 1.8s infinite; }
          @media (max-width: 1023px) {
            .snap-container::-webkit-scrollbar { display: none; }
            .snap-container { -ms-overflow-style: none; scrollbar-width: none; }
          }
        `}</style>

        <div
          className="w-full h-full flex flex-col relative"
          style={{
            transform: `translateX(${swipeOffset}px)`,
            transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
            willChange: 'transform'
          }}
        >
          <div className="flex-shrink-0 w-full z-40 bg-texture">

            <div className="w-full flex justify-between items-center px-4 pt-5 pb-2 lg:hidden">
              {IS_NATIVE ? (
                <button
                  onClick={openCameraUI}
                  className="w-10 h-10 flex justify-center items-center bg-card/60 border border-border/40 backdrop-blur-sm rounded-full shadow-sm text-foreground active:scale-95 transition-all"
                  aria-label="Open Camera"
                >
                  <CameraIcon size={20} className="text-primary" />
                </button>
              ) : (
                <div className="w-10 h-10" />
              )}
              <Logo className="h-10" />
              <div className="w-10"></div>
            </div>

            <div className="px-3 lg:px-6 py-3 lg:py-4 glass-card rounded-lg border-0 border-b border-border mx-2 lg:mx-4 shadow-sm flex justify-between items-center relative mb-4 lg:mb-8">
              <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none justify-center">
                <Logo className="h-10 xl:h-12" />
              </div>

              <div className="min-w-0 pr-2">
                <h2 className="text-base lg:text-lg font-bold text-foreground truncate">{displayLocation}</h2>
                <div className="flex items-center gap-1 text-[11px] lg:text-sm text-muted-foreground truncate">
                  <MapPin size={14} className="flex-shrink-0" />
                  <span className="truncate">{chosenLocation?.country || t('locating')}</span>
                  <button className="ml-1 lg:ml-2 text-accent font-medium transition-colors hover:text-accent/80 flex-shrink-0" onClick={() => setShowLocationModal(true)}>
                    {t('change')}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
                <div className="flex items-center gap-1.5 bg-background/50 backdrop-blur-sm border border-border/60 px-2.5 py-1.5 lg:px-3 lg:py-2 rounded-full shadow-sm text-muted-foreground transition-all">
                  <Users size={14} className="text-primary flex-shrink-0" />
                  <span className="hidden lg:inline text-xs lg:text-sm font-medium tracking-wide">{t('citizens_reached', 'Reached')}:</span>
                  <div className="text-xs lg:text-sm font-bold text-foreground font-mono">
                    <Odometer value={visitors} format="(,ddd)" duration={800} />
                  </div>
                </div>

                <button className="hidden lg:flex btn-gradient items-center gap-1.5 lg:gap-2 px-3 lg:px-4 py-1.5 lg:py-2 rounded-xl whitespace-nowrap shadow-sm hover:shadow-md transition-all hover:scale-[1.02]" onClick={() => navigate("/dashboard/report")}>
                  <Plus size={16} />
                  <span className="text-sm">{t('new_issue')}</span>
                </button>
              </div>
            </div>

            <div className="px-3 lg:hidden mt-2 mb-2 flex justify-between items-center">
              <h3 className="text-lg font-bold text-foreground">Top Reports in Your Area</h3>
              <div className="flex items-center text-muted-foreground animate-pulse">
              </div>
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

          <div className="flex-1 min-h-0 w-full relative max-lg:px-0 lg:px-6">
            <div id="mobile-snap-container" className="h-full w-full overflow-y-auto overflow-x-hidden snap-container overscroll-contain max-lg:absolute max-lg:inset-0 max-lg:px-2 max-lg:snap-y max-lg:snap-mandatory">
              {(loading || isLocating) && sortedIssues.length === 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 pt-2 pb-2 overflow-hidden w-full h-full">
                  {[1, 2, 3, 4].map(n => <IssueSkeleton key={n} />)}
                </div>
              ) : sortedIssues.length === 0 && !error ? (
                <div className="h-full w-full"><EmptyFeedState onReport={() => navigate("/dashboard/report")} t={t} /></div>
              ) : error && sortedIssues.length === 0 ? (
                <div className="text-center py-16 bg-card border border-border/50 rounded-2xl mx-auto w-full mt-4">
                  <p className="text-red-500 font-medium mb-2">{t('failed_load_issues')}</p>
                  <button onClick={() => fetchData(1)} className="px-4 py-2 bg-muted rounded-xl hover:bg-muted/80 transition-colors text-sm">{t('try_again')}</button>
                </div>
              ) : (
                <InfiniteScroll
                  dataLength={sortedIssues.length} next={fetchMoreData} hasMore={pagination.currentPage < pagination.totalPages}
                  scrollableTarget={isMobile ? "mobile-snap-container" : undefined}
                  loader={<div className="col-span-full grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-6 py-4 w-full">{[1, 2].map(n => <IssueSkeleton key={`loader-${n}`} />)}</div>}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-6 pt-0 lg:pt-2 pb-24 lg:pb-8 w-full"
                  style={{ overflow: 'visible' }}
                >
                  {sortedIssues.map((issue) => (
                    <div key={issue._id || issue.id} className="max-lg:snap-start max-lg:snap-always max-lg:flex max-lg:items-stretch max-lg:justify-center max-lg:w-full max-lg:pt-2 lg:py-0 lg:h-full lg:min-h-[450px]" style={{ height: isMobile ? 'calc(100dvh - 300px)' : undefined }}>
                      <div className="w-full h-full max-h-full flex flex-col">
                        <IssueCard issue={issue} onClick={() => handleCardClick(issue)} onFlagClick={() => handleFlagClick(issue)} className="flex-1" />
                      </div>
                    </div>
                  ))}
                </InfiniteScroll>
              )}
            </div>
          </div>
        </div>

        <LocationModal isOpen={showLocationModal} onClose={() => { setShowLocationModal(false); handleLocationUpdate(); }} forceLocation={false} />
        <IssueDetail issue={selectedIssue} isOpen={isDetailOpen} onClose={handleCloseDetail} />
        <FlagModal isOpen={showFlagModal} onClose={() => { setShowFlagModal(false); setSelectedIssueForFlag(null); }} onSubmit={handleFlagSubmit} isLoading={flagLoading} />
      </div>
    </>
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