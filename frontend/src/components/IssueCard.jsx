import {
  MapPin, Navigation, CheckCircle2, Zap, Share2, User, ShieldCheck,
  AlertTriangle, Bookmark, ThumbsUp, ThumbsDown, ShieldAlert, Camera as CameraIcon,
  Twitter, Facebook, Send, Copy, X
} from "lucide-react";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axiosInstance from "../utils/axios";
import { showToast } from "../utils/toast";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { APP_URL } from "../utils/config";
import { socket } from "../utils/socket";
import MiniLoader from "../components/MiniLoader";
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

// --- CUSTOM ICONS ---
const WhatsappIcon = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.305-.885-.653-1.482-1.459-1.655-1.756-.173-.298-.019-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
  </svg>
);
// ----------------------

const safeId = (obj) => {
  if (!obj) return null;
  if (typeof obj === 'string') return obj;
  if (obj._id) return String(obj._id);
  return String(obj);
};

const IssueCard = ({ issue, onClick }) => {
  const { t } = useTranslation();
  const currentUser = useSelector((state) => state.auth?.user);

  const [localIssue, setLocalIssue] = useState(issue);
  const [mediaTab, setMediaTab] = useState('REPORTED');

  useEffect(() => {
    setLocalIssue(issue);
  }, [issue]);

  useEffect(() => {
    if (!socket || !localIssue) return;

    const handleStatsUpdate = (data) => {
      if (data.issueId === localIssue._id) {
        setLocalIssue(prev => ({
          ...prev,
          confirmationCount: data.confirmationCount ?? prev.confirmationCount,
          impactScore: data.impactScore ?? prev.impactScore
        }));
      }
    };

    const handleIssueUpdate = (data) => {
      if (data.issueId === localIssue._id) {
        setLocalIssue(prev => {
          const newData = { ...prev, ...data.updatedData };
          if (prev.reportedBy?.name && !newData.reportedBy?.name) {
            newData.reportedBy = prev.reportedBy;
          }
          return newData;
        });
      }
    };

    const handleStatusUpdate = (data) => {
      if (data.issueId === localIssue._id) {
        setLocalIssue(prev => ({ ...prev, status: data.newStatus }));
      }
    };

    socket.on('issue_stats_updated', handleStatsUpdate);
    socket.on('issue_updated', handleIssueUpdate);
    socket.on('issue_status_updated', handleStatusUpdate);

    return () => {
      socket.off('issue_stats_updated', handleStatsUpdate);
      socket.off('issue_updated', handleIssueUpdate);
      socket.off('issue_status_updated', handleStatusUpdate);
    };
  }, [localIssue?._id]);

  const {
    _id, status, category, title, description, location,
    confirmationCount, impactScore, reportedBy, isAnonymous,
    isVerified, confirmations, hasConfirmed, workCycle
  } = localIssue || {};

  const [isConfirmedByUser, setIsConfirmedByUser] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [liveDistance, setLiveDistance] = useState(null);
  const [isSaved, setIsSaved] = useState(false);

  const [isOpposing, setIsOpposing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (currentUser && currentUser._id) {
      const currentUserId = String(currentUser._id);

      if (hasConfirmed === true || localIssue.isConfirmed === true) {
        setIsConfirmedByUser(true);
      } else if (Array.isArray(confirmations)) {
        setIsConfirmedByUser(confirmations.some((conf) =>
          safeId(conf.user) === currentUserId
        ));
      }

      if (Array.isArray(currentUser.savedIssues)) {
        setIsSaved(currentUser.savedIssues.some(savedId => String(savedId) === String(_id)));
      }
    }
  }, [currentUser, confirmations, hasConfirmed, localIssue, _id]);

  const currentUserIdStr = safeId(currentUser);
  const reporterIdStr = safeId(reportedBy);

  const isReporterUser = Boolean(currentUserIdStr && reporterIdStr && currentUserIdStr === reporterIdStr);
  const isConfirmerUser = Boolean(Array.isArray(confirmations) && confirmations.some(c => safeId(c.user) === currentUserIdStr));
  const isEscrowVotingPhase = status === 'RESOLVED' && workCycle?.escrow?.isEscrowActive;
  const canVoteOnResolution = isEscrowVotingPhase && (isReporterUser || isConfirmerUser);

  let hasVoted = false;
  if (isReporterUser) {
    hasVoted = Boolean(localIssue?.reportedByVerdict && localIssue.reportedByVerdict !== 'PENDING');
  }
  if (!hasVoted && isConfirmerUser) {
    const userConf = localIssue?.confirmations?.find(c => safeId(c.user) === currentUserIdStr);
    hasVoted = Boolean(userConf?.verdict && userConf.verdict !== 'PENDING');
  }

  const isIssueClosed = ['RESOLVED', 'DISPUTED', 'FAILED', 'REJECTED', 'ORPHANED'].includes(status?.toUpperCase());

  let claimedUrls = [];
  let opposedUrls = [];
  let reportedUrls = [];
  let activeMediaArray = [];

  if (localIssue) {
    claimedUrls = [
      localIssue.resolutionEvidence?.mediaUrl,
      ...(localIssue.workCycle?.handoverReports?.map(h => h.photoUrl) || [])
    ].filter(Boolean);

    opposedUrls = [
      localIssue.disputeEvidence?.mediaUrl,
      localIssue.reportedByVerdictMedia,
      ...(localIssue.confirmations?.map(c => c.verdictMedia) || [])
    ].filter(Boolean);

    reportedUrls = (localIssue.media || [])
      .map(m => m.url || m)
      .filter(url => !claimedUrls.includes(url) && !opposedUrls.includes(url));

    activeMediaArray = mediaTab === 'REPORTED' ? reportedUrls
      : mediaTab === 'CLAIMED' ? claimedUrls
        : opposedUrls;
  }

  const validMedia = Array.isArray(activeMediaArray) ? activeMediaArray : [];
  const displayMediaUrl = validMedia.length > 0 ? validMedia[0] : null;
  const isVideo = displayMediaUrl?.match(/\.(mp4|webm|ogg)$/i);

  useEffect(() => {
    if (!location?.geoData?.coordinates) return;
    const [issueLng, issueLat] = location.geoData.coordinates;

    const calculateHaversine = (lat1, lon1, lat2, lon2) => {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const distInKm = calculateHaversine(pos.coords.latitude, pos.coords.longitude, issueLat, issueLng);
          setLiveDistance(distInKm);
        },
        (err) => console.warn("Live tracking failed:", err),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [location]);

  const statusColors = {
    OPEN: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
    LOCKED: "bg-indigo-500/10 text-indigo-500 border-indigo-500/30",
    RESOLVED: "bg-green-500/10 text-green-500 border-green-500/30",
    DISPUTED: "bg-orange-500/10 text-orange-500 border-orange-500/30",
  };
  const activeColor = statusColors[status?.toUpperCase()] || statusColors.OPEN;

  const formatDistance = (distKm) => {
    if (distKm === null) return t('calculating', 'Locating...');
    if (distKm < 1) return `${Math.round(distKm * 1000)} m away`;
    return `${distKm.toFixed(1)} km away`;
  };

  const openGoogleMaps = (e) => {
    e.stopPropagation();
    if (!location?.geoData?.coordinates) return;
    const [lng, lat] = location.geoData.coordinates;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  const handleShareMenuOpen = async (e) => {
    e.stopPropagation();
    setIsSharing(true);
    try { await axiosInstance.put(`/issue/${_id}/share`); } catch (err) { }
  };

  const executeShare = (platform, e) => {
    e.stopPropagation();
    const shareUrl = `${APP_URL}/issue/${_id}`;
    const shareText = title || "Check out this issue on LocalAwaaz!";
    const text = encodeURIComponent(shareText);
    const url = encodeURIComponent(shareUrl);
    let shareLink = "";

    switch (platform) {
      case 'whatsapp': shareLink = `https://api.whatsapp.com/send?text=${text}%20${url}`; window.open(shareLink, '_blank'); break;
      case 'twitter': shareLink = `https://twitter.com/intent/tweet?text=${text}&url=${url}`; window.open(shareLink, '_blank'); break;
      case 'telegram': shareLink = `https://t.me/share/url?url=${url}&text=${text}`; window.open(shareLink, '_blank'); break;
      case 'facebook': shareLink = `https://www.facebook.com/sharer/sharer.php?u=${url}`; window.open(shareLink, '_blank'); break;
      case 'copy': navigator.clipboard.writeText(shareUrl); toast.success(t('link_copied', 'Link copied to clipboard!')); break;
      default: break;
    }
    setIsSharing(false);
  };

  const handleSaveToggle = async (e) => {
    e.stopPropagation();
    const newSavedState = !isSaved;
    setIsSaved(newSavedState);
    try {
      if (newSavedState) {
        await axiosInstance.post(`/save-issue/${_id}`);
        toast.success(t('issue_saved', 'Issue saved'));
      } else {
        await axiosInstance.delete(`/remove/saved-issue/${_id}`);
        toast.success(t('removed_saved', 'Removed from saved'));
      }
    } catch (error) {
      setIsSaved(!newSavedState);
      toast.error(t('failed_update_saved', 'Failed to update save status'));
    }
  };

  const handleConfirm = async (e) => {
    e.stopPropagation();
    if (!_id) return;
    const toastId = toast.loading(t('confirming', 'Confirming issue...'));
    try {
      setConfirmLoading(true);
      const coords = await getCurrentLocation().catch(() => JSON.parse(localStorage.getItem('cached_geo_location')));
      let url = `/issue/${_id}/confirm`;
      if (coords?.lng && coords?.lat) url += `?lng=${coords.lng}&lat=${coords.lat}`;

      const response = await axiosInstance.post(url);
      if (!isConfirmedByUser && response.data?.success) {
        setLocalConfirmationCount(prev => prev + 1);
        setIsConfirmedByUser(true);
      }
      toast.dismiss(toastId);
      toast.success(response.data?.message || t('issue_confirmed_success'));
    } catch (error) {
      toast.dismiss(toastId);
      const errorMsg = error.response?.data?.message?.toLowerCase() || "";
      if (errorMsg.includes("already") || errorMsg.includes("confirmed")) {
        setIsConfirmedByUser(true);
        toast.success(error.response?.data?.message || t('already_confirmed'), { icon: 'ℹ️' });
      } else {
        toast.error(error.response?.data?.message || t('action_completed'));
      }
    } finally {
      setConfirmLoading(false);
    }
  };

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported."));
      } else {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          (err) => reject(err),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      }
    });
  };

  const handleConsensusVote = async (verdict, rawFile = null) => {
    setIsVerifying(true);
    const toastId = toast.loading(t('verifying_location', 'Verifying location...'));
    try {
      const coords = await getCurrentLocation().catch(() => {
        const cached = JSON.parse(localStorage.getItem('cached_geo_location'));
        if (cached?.latitude && cached?.longitude) return { lat: cached.latitude, lng: cached.longitude };
        throw new Error("Location permission is required to verify fixes.");
      });

      let publicProofUrl = null;
      if (verdict === 'OPPOSED' && rawFile) {
        toast.loading(t('uploading_evidence', 'Uploading counter-proof...'), { id: toastId });
        const presignRes = await axiosInstance.get(`/issue/${_id}/verify/presign`);
        const { uploadUrl, publicUrl } = presignRes.data;
        await fetch(uploadUrl, { method: 'PUT', body: rawFile, headers: { 'Content-Type': 'image/jpeg' } });
        publicProofUrl = publicUrl;
      }

      toast.loading(t('logging_verdict', 'Logging consensus...'), { id: toastId });
      const payload = { verdict, userLat: coords.lat, userLng: coords.lng, proofUrl: publicProofUrl };
      const res = await axiosInstance.post(`/issue/${_id}/verify?lng=${coords.lng}&lat=${coords.lat}`, payload);

      toast.success(res.data.message || t('verdict_logged'), { id: toastId });
      setIsOpposing(false);

      if (isReporterUser) setLocalIssue(prev => ({ ...prev, reportedByVerdict: verdict }));
      if (isConfirmerUser) {
        setLocalIssue(prev => {
          const newConfirmations = prev.confirmations.map(c => safeId(c.user) === currentUserIdStr ? { ...c, verdict } : c);
          return { ...prev, confirmations: newConfirmations };
        });
      }
    } catch (error) {
      console.error("Verification Error:", error);
      toast.error(error.response?.data?.message || error.message || t('verification_failed'), { id: toastId });
    } finally {
      setIsVerifying(false);
    }
  };

  const triggerCameraForDispute = async (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    try {
      if (Capacitor.isNativePlatform()) {
        const image = await Camera.getPhoto({ quality: 80, allowEditing: false, resultType: CameraResultType.Uri, source: CameraSource.Camera });
        const response = await fetch(image.webPath);
        const blob = await response.blob();
        const file = new File([blob], `dispute_${Date.now()}.${image.format}`, { type: `image/${image.format}` });
        handleConsensusVote('OPPOSED', file);
      } else {
        document.getElementById(`dispute-camera-input-${_id}`).click();
      }
    } catch (err) { console.log('Camera cancelled or failed:', err); }
  };

  const handleWebCameraChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) handleConsensusVote('OPPOSED', files[0]);
  };

  const ActionIcons = () => (
    <>
      <button
        onClick={handleSaveToggle}
        className={`p-2 lg:p-2.5 rounded-xl border transition-colors shadow-sm shrink-0 ${isSaved
          ? 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'
          : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
      >
        <Bookmark className={`w-4 h-4 lg:w-5 lg:h-5 ${isSaved ? "fill-primary text-primary" : ""}`} />
      </button>

      <button
        onClick={handleShareMenuOpen}
        className="p-2 lg:p-2.5 rounded-xl border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shadow-sm shrink-0"
      >
        <Share2 className="w-4 h-4 lg:w-5 lg:h-5" />
      </button>
    </>
  );

  return (
    <div
      className="group relative bg-card border border-border/50 rounded-2xl overflow-hidden shadow-lg flex flex-col h-full w-full max-h-full"
      onClick={onClick}
    >
      {/* 1. MEDIA HEADER - Mobile: Fluid flex-1 | Desktop: Fixed h-[40%] */}
      <div className="relative w-full bg-black overflow-hidden border-b border-border/50 flex-1 min-h-[120px] lg:flex-none lg:h-[40%] lg:min-h-[160px]">
        {displayMediaUrl ? (
          isVideo ? (
            <video src={`${displayMediaUrl}#t=0.1`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" muted playsInline />
          ) : (
            <img src={displayMediaUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90" />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-card">
            <AlertTriangle className="w-10 h-10 lg:w-12 lg:h-12 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/30 pointer-events-none" />
        <div className="absolute top-2 left-2 lg:top-4 lg:left-4 right-2 lg:right-4 flex justify-between items-start gap-2">
          <span className={`px-2 py-1 lg:px-3 lg:py-1.5 rounded-lg text-[10px] lg:text-xs font-black uppercase tracking-widest border backdrop-blur-md shadow-sm ${activeColor}`}>
            {t(status?.toLowerCase())}
          </span>
        </div>
      </div>

      {/* 2. CORE INFORMATION - Mobile: Hugs content (shrink-0) | Desktop: expands to fill space (flex-1) */}
      <div className="flex flex-col justify-start p-2.5 lg:p-5 bg-card overflow-hidden shrink-0 lg:shrink lg:flex-1 lg:min-h-0">

        <div className="shrink-0">
          <button
            onClick={openGoogleMaps}
            className="mb-1 lg:mb-2 w-fit flex items-center gap-1 lg:gap-1.5 px-2.5 py-0.5 lg:px-3.5 lg:py-1.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-colors text-[10px] lg:text-xs font-bold tracking-wide"
          >
            <Navigation className="w-3 h-3 lg:w-3.5 lg:h-3.5 shrink-0" />
            {formatDistance(liveDistance)} • {location?.city || location?.district}
          </button>

          <h3 className="text-sm sm:text-base lg:text-2xl font-black text-foreground leading-tight lg:leading-tight mb-0.5 lg:mb-2 line-clamp-2">
            {title}
          </h3>

          <p className="text-[11px] lg:text-sm text-muted-foreground leading-tight lg:leading-snug mb-1 lg:mb-3 line-clamp-3 sm:line-clamp-4 lg:line-clamp-6">
            {description || t('no_description')}
          </p>
        </div>

        {/* Note: mt-auto applies ONLY on desktop (lg:mt-auto) to push this to the bottom */}
        <div className="flex items-center gap-2 lg:gap-2.5 mt-1.5 lg:mt-auto pt-2 lg:pt-3 border-t border-border/40 shrink-0">
          <div className="w-5 h-5 lg:w-8 lg:h-8 rounded-full bg-muted border border-border/50 flex items-center justify-center shrink-0">
            <User className="w-3 h-3 lg:w-4 lg:h-4 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-1.5 lg:gap-2 min-w-0">
            <p className={`text-[11px] lg:text-sm font-bold truncate ${isAnonymous ? 'text-muted-foreground' : 'text-foreground/90'}`}>
              {isAnonymous ? 'Anonymous Citizen' : reportedBy?.name || 'Unknown'}
            </p>
            {!isAnonymous && isVerified && <ShieldCheck className="w-3 h-3 lg:w-5 lg:h-5 text-emerald-500 shrink-0" />}
          </div>
        </div>
      </div>

      {/* 3. PINNED FOOTER ACTIONS - Squishy buttons added to prevent Zoom leaks */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between pt-2 lg:pt-4 p-2.5 lg:p-5 mt-auto border-t border-border/50 gap-2 lg:gap-4 bg-card min-w-0">

        {/* Left Side (Desktop) / Top Row (Mobile) */}
        <div className="flex items-center justify-between w-full sm:w-auto gap-4 min-w-0 shrink">

          <div className="flex items-center gap-4 lg:gap-5 shrink-0">
            <div className="flex flex-col items-center sm:items-start">
              <span className="text-lg lg:text-3xl font-black text-emerald-500 leading-none">{confirmationCount || 0}</span>
              <span className="text-[9px] lg:text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-1">Confirmed</span>
            </div>
            <div className="w-px h-6 lg:h-8 bg-border/80"></div>
            <div className="flex flex-col items-center sm:items-start">
              <span className="text-lg lg:text-3xl font-black text-yellow-500 leading-none flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 lg:w-6 lg:h-6 fill-yellow-500" /> {impactScore || 0}
              </span>
              <span className="text-[9px] lg:text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-1">Impact</span>
            </div>
          </div>

          <div className="flex sm:hidden items-center gap-1.5 shrink-0">
            <ActionIcons />
          </div>
        </div>

        {/* Right Side (Desktop) / Bottom Row (Mobile) */}
        {/* Changed justify-end to ensure it handles min-width correctly */}
        <div className="flex items-center gap-2 w-full sm:w-auto sm:justify-end min-w-0 shrink">

          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <ActionIcons />
          </div>

          {/* Squishy Button Container */}
          <div className="flex items-center w-full sm:w-auto gap-1.5 lg:gap-2 min-w-0 shrink">
            {hasVoted ? (
              <span className="flex-1 flex justify-center items-center gap-1.5 px-3 py-1.5 lg:px-4 lg:py-2.5 rounded-xl text-sm lg:text-base font-bold text-green-600 bg-green-500/10 border border-green-500/20 cursor-default min-w-0 shrink" onClick={(e) => e.stopPropagation()}>
                <CheckCircle2 className="w-4 h-4 lg:w-5 lg:h-5 shrink-0" /> <span className="truncate">Verified</span>
              </span>
            ) : canVoteOnResolution ? (
              <>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleConsensusVote('APPROVED'); }}
                  disabled={isVerifying}
                  className="flex-1 flex items-center justify-center gap-1 lg:gap-1.5 px-2 py-1.5 lg:px-3 lg:py-2 rounded-xl text-[13px] lg:text-sm font-bold transition-all bg-green-500 text-white hover:bg-green-600 min-w-0 shrink"
                >
                  {isVerifying ? <MiniLoader className="w-4 h-4 lg:w-4 lg:h-4 shrink-0" /> : <><ThumbsUp className="w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0" /> <span className="truncate">Approve</span></>}
                </button>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpposing(true); }}
                  disabled={isVerifying}
                  className="flex-1 flex items-center justify-center gap-1 lg:gap-1.5 px-2 py-1.5 lg:px-3 lg:py-2 rounded-xl text-[13px] lg:text-sm font-bold transition-all bg-red-500/10 text-red-600 border border-red-500/30 hover:bg-red-500 hover:text-white min-w-0 shrink"
                >
                  <ThumbsDown className="w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0" /> <span className="truncate">Oppose</span>
                </button>
              </>
            ) : isIssueClosed ? (
              <span className="flex-1 flex justify-center items-center gap-1.5 px-3 py-1.5 lg:px-4 lg:py-2 rounded-xl text-sm font-bold bg-muted text-muted-foreground border border-border/50 cursor-default min-w-0 shrink" onClick={(e) => e.stopPropagation()}>
                <span className="truncate">Issue {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}</span>
              </span>
            ) : (
              <button
                onClick={handleConfirm}
                disabled={confirmLoading}
                className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-1.5 lg:px-5 lg:py-2 rounded-xl text-sm lg:text-base font-bold transition-all min-w-0 shrink ${isConfirmedByUser ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : status?.toUpperCase() === 'OPEN' ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground border-border hover:bg-muted/80"}`}
              >
                {confirmLoading ? "..." : isConfirmedByUser ? <><CheckCircle2 className="w-4 h-4 lg:w-5 lg:h-5 shrink-0" /> <span className="truncate">Confirmed</span></> : <><CheckCircle2 className="w-4 h-4 lg:w-5 lg:h-5 shrink-0" /> <span className="truncate">Confirm</span></>}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* --- INLINE SHARE MENU --- */}
      {isSharing && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in" onClick={(e) => { e.stopPropagation(); setIsSharing(false); }}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-foreground">Share Issue</h3>
              <button onClick={() => setIsSharing(false)} className="p-2 rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <button onClick={(e) => executeShare('whatsapp', e)} className="flex flex-col items-center gap-2 group">
                <div className="w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform"><WhatsappIcon size={28} /></div>
                <span className="text-[11px] font-semibold text-foreground/80">WhatsApp</span>
              </button>
              <button onClick={(e) => executeShare('twitter', e)} className="flex flex-col items-center gap-2 group">
                <div className="w-14 h-14 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform"><Twitter size={24} /></div>
                <span className="text-[11px] font-semibold text-foreground/80">X (Twitter)</span>
              </button>
              <button onClick={(e) => executeShare('telegram', e)} className="flex flex-col items-center gap-2 group">
                <div className="w-14 h-14 rounded-full bg-[#0088cc] text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform"><Send size={24} className="ml-0.5" /></div>
                <span className="text-[11px] font-semibold text-foreground/80">Telegram</span>
              </button>
              <button onClick={(e) => executeShare('facebook', e)} className="flex flex-col items-center gap-2 group">
                <div className="w-14 h-14 rounded-full bg-[#1877F2] text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform"><Facebook size={24} /></div>
                <span className="text-[11px] font-semibold text-foreground/80">Facebook</span>
              </button>
            </div>
            <div className="mt-6 pt-6 border-t border-border/50">
              <button onClick={(e) => executeShare('copy', e)} className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border border-border bg-muted hover:bg-muted/80 text-foreground text-base font-bold transition-colors active:scale-95"><Copy size={20} /> Copy Link</button>
            </div>
          </div>
        </div>
      )}

      {/* INLINE OPPOSE MODAL FOR CARD */}
      {isOpposing && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in" onClick={(e) => e.stopPropagation()}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 shadow-2xl flex flex-col items-center">
            <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2 text-center">Counter Evidence</h3>
            <p className="text-sm text-muted-foreground text-center mb-6">Take a live photo of the current situation.</p>
            <div className="w-full flex flex-col gap-3">
              <button onClick={triggerCameraForDispute} disabled={isVerifying} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-base transition-colors disabled:opacity-60">
                {isVerifying ? <><MiniLoader className="w-5 h-5 text-white" /> Uploading...</> : <><CameraIcon size={20} /> Take Photo</>}
              </button>
              <input type="file" id={`dispute-camera-input-${_id}`} accept="image/*" capture="environment" className="hidden" onChange={(e) => { e.stopPropagation(); handleWebCameraChange(e); }} />
              <button onClick={(e) => { e.stopPropagation(); setIsOpposing(false); }} disabled={isVerifying} className="w-full py-3.5 rounded-xl border border-border bg-background text-foreground hover:bg-muted font-bold text-base transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueCard;