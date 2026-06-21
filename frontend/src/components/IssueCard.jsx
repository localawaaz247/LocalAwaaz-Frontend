import {
  MapPin, Navigation, CheckCircle2, Zap, Share2, User, ShieldCheck,
  AlertTriangle, Bookmark, ThumbsUp, ThumbsDown, ShieldAlert, Camera as CameraIcon
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

// Safe ID extractor to fix the Mongoose Object vs String bug
const safeId = (obj) => {
  if (!obj) return null;
  if (typeof obj === 'string') return obj;
  if (obj._id) return String(obj._id);
  return String(obj);
};

const IssueCard = ({ issue, onClick }) => {
  const { t } = useTranslation();
  const currentUser = useSelector((state) => state.auth?.user);

  // --- REAL TIME WRAPPER ---
  const [localIssue, setLocalIssue] = useState(issue);
  const [mediaTab, setMediaTab] = useState('REPORTED'); // For flipping images on the card

  useEffect(() => {
    setLocalIssue(issue);
  }, [issue]);

  // Handle direct socket updates for this individual card
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
          // SMART MERGE: Keep populated objects
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

  // --- Extracted Data from localIssue ---
  const {
    _id, status, category, title, description, location,
    confirmationCount, impactScore, reportedBy, isAnonymous,
    isVerified, confirmations, hasConfirmed, workCycle
  } = localIssue || {};

  const [isConfirmedByUser, setIsConfirmedByUser] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [liveDistance, setLiveDistance] = useState(null);
  const [isSaved, setIsSaved] = useState(false);

  // Resolution Voting States
  const [isOpposing, setIsOpposing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Initial State Setup based on User Profile
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

  // --- CONSENSUS & VOTING LOGIC ---
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

  // Hide generic Flag/Confirm buttons globally if issue is handled
  const isIssueClosed = ['RESOLVED', 'DISPUTED', 'FAILED', 'REJECTED', 'ORPHANED'].includes(status?.toUpperCase());

  // --- MEDIA TRIAGE FOR CARD ---
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

  // REAL-TIME DISTANCE TRACKER
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

  const handleShare = async (e) => {
    e.stopPropagation();
    try { await axiosInstance.put(`/issue/${_id}/share`); } catch (err) { }
    if (navigator.share) {
      navigator.share({ title: title, text: t('check_out_issue'), url: `${APP_URL}/issue/${_id}` });
    } else {
      navigator.clipboard.writeText(`${APP_URL}/issue/${_id}`);
      toast.success(t('link_copied', 'Link copied to clipboard!'));
    }
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
        if (cached?.latitude && cached?.longitude) {
          return { lat: cached.latitude, lng: cached.longitude };
        }
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
          const newConfirmations = prev.confirmations.map(c =>
            safeId(c.user) === currentUserIdStr ? { ...c, verdict } : c
          );
          return { ...prev, confirmations: newConfirmations };
        });
      }

    } catch (error) {
      console.error("Verification Error:", error);
      const errorMsg = error.response?.data?.message || error.message || t('verification_failed');
      toast.error(errorMsg, { id: toastId });
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

  // Helper component for Share and Bookmark icons to avoid code repetition
  const ActionIcons = () => (
    <>
      <button
        onClick={handleSaveToggle}
        className={`p-2 rounded-xl border transition-colors shadow-sm ${isSaved
          ? 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'
          : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        title={isSaved ? t('remove_saved', 'Remove from saved') : t('save_issue', 'Save issue')}
      >
        <Bookmark size={16} className={isSaved ? "fill-primary text-primary" : ""} />
      </button>

      <button
        onClick={handleShare}
        className="p-2 rounded-xl border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shadow-sm"
        title="Share"
      >
        <Share2 size={16} />
      </button>
    </>
  );

  return (
    <div
      className="group relative bg-card border border-border/50 rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:border-primary/40 transition-all duration-300 cursor-pointer flex flex-col"
      onClick={onClick}
    >
      {/* 1. MEDIA HEADER */}
      <div className="relative h-48 sm:h-56 w-full bg-muted overflow-hidden shrink-0">
        {displayMediaUrl ? (
          isVideo ? (
            <video src={`${displayMediaUrl}#t=0.1`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" muted playsInline />
          ) : (
            <img src={displayMediaUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-card">
            <AlertTriangle className="w-10 h-10 text-muted-foreground/30" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent pointer-events-none" />

        {/* Floating Badges */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start gap-2">
          <div className="flex gap-2">
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border backdrop-blur-md shadow-sm ${activeColor}`}>
              {t(status?.toLowerCase())}
            </span>
          </div>

          {/* Render Media Toggles right on the card if claimed images exist */}
          {claimedUrls.length > 0 && (
            <div className="flex bg-black/40 backdrop-blur-md p-1 rounded-lg border border-white/10" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setMediaTab('REPORTED')}
                className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${mediaTab === 'REPORTED' ? 'bg-primary text-white shadow-sm' : 'text-white/70 hover:bg-white/10'}`}
              >
                Reported
              </button>
              <button
                onClick={() => setMediaTab('CLAIMED')}
                className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${mediaTab === 'CLAIMED' ? 'bg-green-500 text-white shadow-sm' : 'text-white/70 hover:bg-white/10'}`}
              >
                Claimed
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. CORE INFORMATION */}
      <div className="p-4 flex flex-col flex-1">
        <button
          onClick={openGoogleMaps}
          className="mb-3 w-fit flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-colors text-[11px] font-bold tracking-wide"
          title="Get Directions"
        >
          <Navigation size={12} className="shrink-0" />
          {formatDistance(liveDistance)} • {location?.city || location?.district}
        </button>

        <h3 className="text-lg font-bold text-foreground leading-snug line-clamp-1 mb-1.5 group-hover:text-primary transition-colors">
          {title}
        </h3>

        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-4">
          {description || t('no_description')}
        </p>

        <div className="flex items-center gap-2 mt-auto">
          <div className="w-6 h-6 rounded-full bg-muted border border-border/50 flex items-center justify-center shrink-0">
            <User size={12} className="text-muted-foreground" />
          </div>
          <div className="flex items-center gap-1.5">
            <p className={`text-xs font-semibold ${isAnonymous ? 'text-muted-foreground' : 'text-foreground/90'}`}>
              {isAnonymous ? 'Anonymous Citizen' : reportedBy?.name || 'Unknown'}
            </p>
            {!isAnonymous && isVerified && <ShieldCheck size={12} className="text-emerald-500" />}
          </div>
        </div>

        {/* 3. RESPONSIVE FOOTER ACTIONS & METRICS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 mt-4 border-t border-border/50 gap-4">

          {/* Top Row on Mobile: Metrics & Icons */}
          <div className="flex items-center justify-between w-full sm:w-auto gap-4">
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                <span className="text-lg font-black text-emerald-500 leading-none">{confirmationCount || 0}</span>
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mt-1">Confirmed</span>
              </div>
              <div className="w-px h-6 bg-border/50"></div>
              <div className="flex flex-col items-center">
                <span className="text-lg font-black text-yellow-500 leading-none flex items-center gap-0.5"><Zap size={14} className="fill-yellow-500" /> {impactScore || 0}</span>
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mt-1">Impact</span>
              </div>
            </div>

            {/* Share/Bookmark Icons - Visible here on Mobile only */}
            <div className="flex sm:hidden items-center gap-2">
              <ActionIcons />
            </div>
          </div>

          {/* Bottom Row on Mobile: Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">

            {/* Share/Bookmark Icons - Visible here on Desktop only */}
            <div className="hidden sm:flex items-center gap-2">
              <ActionIcons />
            </div>

            {/* Verification & Confirm Injection */}
            <div className="flex items-center w-full sm:w-auto gap-2">
              {hasVoted ? (
                <span className="flex-1 sm:flex-none flex justify-center items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap bg-green-500/10 text-green-600 border border-green-500/20 shadow-sm cursor-default" onClick={(e) => e.stopPropagation()}>
                  <CheckCircle2 size={14} /> Verified
                </span>
              ) : canVoteOnResolution ? (
                <div className="flex w-full sm:w-auto gap-2">
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleConsensusVote('APPROVED'); }}
                    disabled={isVerifying}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all bg-green-500 text-white hover:bg-green-600 shadow-sm whitespace-nowrap"
                  >
                    {isVerifying ? <MiniLoader className="w-4 h-4" /> : <><ThumbsUp size={14} /> Approve</>}
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpposing(true); }}
                    disabled={isVerifying}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all bg-red-500/10 text-red-600 border border-red-500/30 hover:bg-red-500 hover:text-white shadow-sm whitespace-nowrap"
                  >
                    <ThumbsDown size={14} /> Oppose
                  </button>
                </div>
              ) : isIssueClosed ? (
                <span className="flex-1 sm:flex-none flex justify-center items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap bg-muted text-muted-foreground border border-border/50 shadow-sm cursor-default" onClick={(e) => e.stopPropagation()}>
                  Issue {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
                </span>
              ) : (
                <button
                  onClick={handleConfirm}
                  disabled={confirmLoading}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shadow-sm
                    ${isConfirmedByUser
                      ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                      : status?.toUpperCase() === 'OPEN'
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                    }`}
                >
                  {confirmLoading ? "..." : isConfirmedByUser ? (
                    <><CheckCircle2 size={14} /> Confirmed</>
                  ) : (
                    <><CheckCircle2 size={14} /> Confirm</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* INLINE OPPOSE MODAL FOR CARD */}
      {isOpposing && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in" onClick={(e) => e.stopPropagation()}>
          <div className="bg-card border border-border rounded-2xl w-full p-6 shadow-2xl flex flex-col items-center">
            <ShieldAlert className="w-10 h-10 text-red-500 mb-3" />
            <h3 className="text-lg font-bold text-foreground mb-2 text-center">Counter Evidence</h3>
            <p className="text-xs text-muted-foreground text-center mb-5">
              Take a live photo of the current situation.
            </p>
            <div className="w-full flex flex-col gap-2">
              <button
                onClick={triggerCameraForDispute}
                disabled={isVerifying}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors disabled:opacity-60"
              >
                {isVerifying ? <><MiniLoader className="w-4 h-4 text-white" /> Uploading...</> : <><CameraIcon size={16} /> Take Photo</>}
              </button>
              <input type="file" id={`dispute-camera-input-${_id}`} accept="image/*" capture="environment" className="hidden" onChange={(e) => { e.stopPropagation(); handleWebCameraChange(e); }} />
              <button
                onClick={(e) => { e.stopPropagation(); setIsOpposing(false); }}
                disabled={isVerifying}
                className="w-full py-2.5 rounded-xl border border-border bg-background text-foreground hover:bg-muted font-bold text-xs transition-colors"
              >
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