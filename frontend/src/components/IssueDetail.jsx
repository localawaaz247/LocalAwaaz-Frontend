import {
  X, MapPin, User, AlertTriangle, ShieldCheck, ChevronLeft, ChevronRight,
  Flag, CheckCircle2, FileText, Copy, Check, ShieldAlert, Camera as CameraIcon,
  Trophy, Medal, Star, ThumbsUp, ThumbsDown, Clock, History, Shield, Zap
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import axiosInstance from "../utils/axios";
import { showToast } from "../utils/toast";
import toast from "react-hot-toast";
import SEO from "../components/SEO";
import { useTranslation } from "react-i18next";
import { APP_URL } from "../utils/config";
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { motion, AnimatePresence } from 'framer-motion';
import MiniLoader from "../components/MiniLoader";
import { socket } from "../utils/socket";

// --- Whatsapp SVG Component ---
const WhatsappIcon = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.305-.885-.653-1.482-1.459-1.655-1.756-.173-.298-.019-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
  </svg>
);

const FLAG_REASONS = ["SPAM", "INAPPROPRIATE", "DUPLICATE", "ALREADY RESOLVED", "SEXUAL CONTENT", "ABUSE", "OTHER"];

const statusColors = {
  OPEN: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
  LOCKED: "bg-indigo-500/10 text-indigo-500 border-indigo-500/30",
  PENDING_EXTENSION: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  AWAITING_HANDOVER: "bg-red-500/10 text-red-500 border-red-500/30",
  IN_REVIEW: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  RESOLVED: "bg-green-500/10 text-green-500 border-green-500/30",
  REJECTED: "bg-red-500/10 text-red-500 border-red-500/30",
  FAILED: "bg-red-500/10 text-red-500 border-red-500/30",
  DISPUTED: "bg-orange-500/10 text-orange-500 border-orange-500/30",
  ORPHANED: "bg-purple-500/10 text-purple-500 border-purple-500/30",
  RELEASED: "bg-amber-500/10 text-amber-500 border-amber-500/30"
};

const generateTimeline = (issue) => {
  if (!issue) return [];
  const combined = [];
  combined.push({ type: 'create', label: 'Issue Reported', time: new Date(issue.createdAt), icon: <FileText size={14} />, color: 'text-blue-500 bg-blue-500/10 border-blue-500/30' });

  if (issue.statusHistory) {
    issue.statusHistory.forEach(sh => {
      combined.push({ type: 'status', label: `Status changed to ${sh.status}`, time: new Date(sh.changedAt), detail: sh.remark, icon: <History size={14} />, color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30' });
    });
  }
  if (issue.auditLog) {
    issue.auditLog.forEach(al => {
      if (!['ADMIN_ATTRIBUTED_ACTION', 'SCORE_BOOSTED'].includes(al.action)) {
        combined.push({ type: 'audit', label: al.action.replace(/_/g, ' '), time: new Date(al.timestamp), detail: al.details, icon: <Shield size={14} />, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30' });
      }
    });
  }
  return combined.sort((a, b) => b.time - a.time);
};

// Safe ID extractor to fix the Mongoose Object vs String bug
const safeId = (obj) => {
  if (!obj) return null;
  if (typeof obj === 'string') return obj;
  if (obj._id) return String(obj._id);
  return String(obj);
};

const IssueDetail = ({ issue, isOpen, onClose, hideConfirm = false }) => {
  const { t } = useTranslation();
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [mediaTab, setMediaTab] = useState('REPORTED');
  const [confirmLoading, setConfirmLoading] = useState(false);
  const videoRef = useRef(null);

  const currentUser = useSelector((state) => state.auth?.user);

  // --- REAL TIME WRAPPER ---
  const [localIssue, setLocalIssue] = useState(issue);

  // Stats & Interactions
  const [localShareCount, setLocalShareCount] = useState(0);
  const [localFlagCount, setLocalFlagCount] = useState(0);
  const [localConfirmationCount, setLocalConfirmationCount] = useState(0);
  const [isConfirmedByUser, setIsConfirmedByUser] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Flagging
  const [isFlagOpen, setIsFlagOpen] = useState(false);
  const [flagReason, setFlagReason] = useState("");
  const [isFlagging, setIsFlagging] = useState(false);

  // Leaderboard State
  const [reporterRank, setReporterRank] = useState(null);

  // Dispute / Resolution State
  const [isOpposing, setIsOpposing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    setLocalIssue(issue);
  }, [issue]);

  // Self-Contained Socket Listener for the Modal
  useEffect(() => {
    if (!socket || !localIssue) return;

    const handleIssueUpdated = (data) => {
      if (data.issueId === localIssue._id) {
        setLocalIssue(prev => {
          const newData = { ...prev, ...data.updatedData };
          // SMART MERGE: Keep populated objects so UI doesn't say "Unknown"
          if (prev.reportedBy?.name && !newData.reportedBy?.name) {
            newData.reportedBy = prev.reportedBy;
          }
          if (prev.bidding?.winningBid?.authorityId?.name && !newData.bidding?.winningBid?.authorityId?.name) {
            if (newData.bidding && newData.bidding.winningBid) {
              newData.bidding.winningBid.authorityId = prev.bidding.winningBid.authorityId;
            }
          }
          return newData;
        });
      }
    };

    const handleStatusUpdated = (data) => {
      if (data.issueId === localIssue._id) {
        setLocalIssue(prev => ({ ...prev, status: data.newStatus }));
      }
    };

    const handleStatsUpdated = (data) => {
      if (data.issueId === localIssue._id) {
        setLocalIssue(prev => ({
          ...prev,
          confirmationCount: data.confirmationCount ?? prev.confirmationCount,
          impactScore: data.impactScore ?? prev.impactScore,
          shareCount: data.shareCount ?? prev.shareCount,
          flagCount: data.flagCount ?? prev.flagCount
        }));
      }
    };

    socket.on('issue_updated', handleIssueUpdated);
    socket.on('issue_status_updated', handleStatusUpdated);
    socket.on('issue_stats_updated', handleStatsUpdated);

    return () => {
      socket.off('issue_updated', handleIssueUpdated);
      socket.off('issue_status_updated', handleStatusUpdated);
      socket.off('issue_stats_updated', handleStatsUpdated);
    };
  }, [localIssue?._id]);

  const {
    _id, title, category, status, description, location,
    isAnonymous, reportedBy, isVerified, impactScore,
    confirmations, hasConfirmed, workCycle
  } = localIssue || {};

  useEffect(() => {
    if (isOpen && localIssue) {
      setCurrentMediaIndex(0);
      setMediaTab('REPORTED');

      setLocalShareCount(localIssue.shareCount || 0);
      setLocalFlagCount(localIssue.flagCount || 0);
      setLocalConfirmationCount(localIssue.confirmationCount || 0);
      setIsCopied(false);
      setIsFlagOpen(false);
      setFlagReason("");
      setIsOpposing(false);

      if (hasConfirmed === true || localIssue.isConfirmed === true) {
        setIsConfirmedByUser(true);
      } else if (currentUser && currentUser._id && Array.isArray(confirmations)) {
        const currentUserId = String(currentUser._id);
        const hasConfirmedCheck = confirmations.some((conf) => safeId(conf.user) === currentUserId);
        setIsConfirmedByUser(hasConfirmedCheck);
      } else {
        setIsConfirmedByUser(false);
      }

      if (!isAnonymous && reportedBy && safeId(reportedBy)) {
        axiosInstance.get('/leaderboard/current')
          .then(res => {
            if (res.data?.success && res.data?.data?.citizens) {
              const repEntry = res.data.data.citizens.find(c => safeId(c.userId) === safeId(reportedBy));
              if (repEntry && repEntry.rank <= 10) setReporterRank(repEntry.rank);
            }
          })
          .catch(() => console.log("Silent fail fetching leaderboard"));
      }

      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setReporterRank(null);
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, currentUser, confirmations, hasConfirmed, isAnonymous, reportedBy, localIssue]);

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

  // --- MEDIA TRIAGE ---
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

  const hasMedia = activeMediaArray.length > 0;
  const mediaCount = activeMediaArray.length;
  const hasMultipleMedia = mediaCount > 1;
  const isVideo = activeMediaArray[currentMediaIndex]?.match(/\.(mp4|webm|ogg)$/i);
  const displayImage = activeMediaArray.length > 0 ? activeMediaArray[currentMediaIndex] : null;

  useEffect(() => {
    if (isOpen && isVideo && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(err => console.warn("Autoplay blocked:", err));
    }
  }, [isOpen, currentMediaIndex, isVideo, mediaTab]);

  const incrementShare = async () => { try { await axiosInstance.put(`/issue/${_id}/share`); } catch (err) { } };

  const handleWhatsappShare = (e) => {
    e.stopPropagation(); setLocalShareCount(prev => prev + 1); incrementShare();
    const text = encodeURIComponent(`${t('check_out_issue')}: ${title}\n\n${APP_URL}/issue/${_id}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleCopyLink = (e) => {
    e.stopPropagation(); setLocalShareCount(prev => prev + 1); incrementShare();
    navigator.clipboard.writeText(`${window.location.origin}/issue/${_id}`);
    setIsCopied(true);
    toast.success(t('link_copied', 'Link copied to clipboard!'));
    setTimeout(() => setIsCopied(false), 2000);
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

  const submitFlag = async () => {
    if (!flagReason) return toast.error(t('select_flag_reason', 'Please select a reason to flag.'));
    setIsFlagging(true);
    const toastId = toast.loading(t('submitting', 'Submitting flag...'));
    try {
      const coords = await getCurrentLocation().catch(() => null);
      let url = `/issue/${_id}/${flagReason}`;
      if (coords?.lng && coords?.lat) url += `?lng=${coords.lng}&lat=${coords.lat}`;
      else {
        toast.dismiss(toastId);
        toast.error(t('flag_req_location', 'Location is required to flag an issue.'));
        setIsFlagging(false);
        return;
      }

      await axiosInstance.post(url, {});
      setLocalFlagCount(prev => prev + 1);
      toast.dismiss(toastId);
      toast.success(t('flag_success', 'Issue flagged successfully.'));
      setIsFlagOpen(false);
      setFlagReason("");
    } catch (error) {
      toast.dismiss(toastId);
      toast.error(error.response?.data?.message || t('flag_failed', 'Failed to flag issue.'));
    } finally {
      setIsFlagging(false);
    }
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

      toast.dismiss(toastId); // Force clear the loader
      toast.success(res.data.message || t('verdict_logged')); // Force new toast
      setIsOpposing(false);

      // Instantly render UI state updates locally to hide the buttons
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
      toast.dismiss(toastId); // Force clear the loader
      const errorMsg = error.response?.data?.message || error.message || t('verification_failed');
      toast.error(errorMsg); // Force new toast
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
        document.getElementById('modal-dispute-camera-input').click();
      }
    } catch (err) { console.log('Camera cancelled or failed:', err); }
  };

  const handleWebCameraChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) handleConsensusVote('OPPOSED', files[0]);
  };

  const renderRankBadge = () => {
    if (!reporterRank) return null;
    let badgeClass = "";
    let Icon = Star;
    if (reporterRank === 1) { badgeClass = "bg-yellow-500 text-white shadow-[0_0_10px_rgba(234,179,8,0.5)] border-yellow-400"; Icon = Trophy; }
    else if (reporterRank === 2) { badgeClass = "bg-slate-300 text-slate-800 shadow-[0_0_10px_rgba(203,213,225,0.5)] border-slate-200"; Icon = Medal; }
    else if (reporterRank === 3) { badgeClass = "bg-amber-600 text-white shadow-[0_0_10px_rgba(217,119,6,0.5)] border-amber-500"; Icon = Medal; }
    else { badgeClass = "bg-primary/20 text-primary border-primary/30"; Icon = Star; }

    return (
      <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase border tracking-widest ml-2 ${badgeClass}`} title={`Top 10 Active Citizen`}>
        <Icon size={10} /> Rank #{reporterRank}
      </span>
    );
  };

  const handlePrevious = (e) => {
    e.stopPropagation();
    if (hasMultipleMedia) setCurrentMediaIndex((prev) => (prev - 1 + mediaCount) % mediaCount);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (hasMultipleMedia) setCurrentMediaIndex((prev) => (prev + 1) % mediaCount);
  };

  return (
    <>
      {isOpen && localIssue && (
        <SEO title={title} description={description ? description.substring(0, 150) + "..." : "View details about this local issue on LocalAwaaz."} url={`/issue/${_id}`} image={displayImage} />
      )}

      <AnimatePresence>
        {isOpen && localIssue && (
          <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm z-[60]">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0" onClick={onClose} />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-background border border-border/50 rounded-3xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[85dvh] my-4 overflow-hidden z-10"
              onClick={e => e.stopPropagation()}
            >
              {/* HEADER */}
              <div className="flex justify-between items-center p-4 md:p-5 border-b border-border/50 bg-muted/20 shrink-0">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${statusColors[status] || statusColors.OPEN}`}>
                    {t(status?.toLowerCase())}
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-background text-muted-foreground border border-border/60 text-[10px] font-black uppercase tracking-widest shadow-sm">
                    {t(category?.toLowerCase()) || category?.replace(/_/g, ' ')}
                  </span>
                </div>
                <button onClick={onClose} className="p-2 rounded-full bg-card border border-border/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>

              {/* SPLIT BODY */}
              <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-y-auto lg:overflow-hidden thin-scrollbar">

                {/* LEFT COLUMN: Media & Core Data */}
                <div className="w-full lg:w-1/2 p-4 md:p-6 lg:border-r border-border/50 flex flex-col gap-5 shrink-0 lg:shrink lg:overflow-y-auto thin-scrollbar bg-background/50">
                  <h3 className="text-2xl md:text-3xl font-black text-foreground leading-tight">{title}</h3>

                  {/* MEDIA TABS */}
                  {['DISPUTED', 'RESOLVED', 'REJECTED', 'AWAITING_HANDOVER'].includes(status) || claimedUrls.length || opposedUrls.length ? (
                    <div className="flex bg-muted/40 p-1.5 rounded-xl border border-border/50 w-full md:w-max">
                      <button onClick={() => setMediaTab('REPORTED')} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${mediaTab === 'REPORTED' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-muted'}`}>
                        Reported
                      </button>
                      <button onClick={() => setMediaTab('CLAIMED')} disabled={!claimedUrls.length} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${mediaTab === 'CLAIMED' ? 'bg-green-500 text-white shadow-md' : 'text-muted-foreground hover:bg-muted'} ${!claimedUrls.length && 'opacity-40 cursor-not-allowed'}`}>
                        Claimed
                      </button>
                      <button onClick={() => setMediaTab('OPPOSED')} disabled={!opposedUrls.length} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${mediaTab === 'OPPOSED' ? 'bg-red-500 text-white shadow-md' : 'text-muted-foreground hover:bg-muted'} ${!opposedUrls.length && 'opacity-40 cursor-not-allowed'}`}>
                        Opposed
                      </button>
                    </div>
                  ) : null}

                  {/* MEDIA VIEWER */}
                  <div className="w-full bg-black/40 rounded-2xl border border-border/50 overflow-hidden relative flex items-center justify-center h-[250px] sm:h-[350px] shrink-0 group shadow-inner">
                    {activeMediaArray.length > 0 ? (
                      <>
                        {activeMediaArray[currentMediaIndex]?.match(/\.(mp4|webm|ogg)$/i) ? (
                          <video ref={videoRef} src={activeMediaArray[currentMediaIndex]} className="w-full h-full object-contain bg-black" controls autoPlay muted playsInline />
                        ) : (
                          <img src={activeMediaArray[currentMediaIndex]} alt="issue" className="w-full h-full object-contain" />
                        )}

                        {activeMediaArray.length > 1 && (
                          <>
                            <button onClick={handlePrevious} className="absolute left-3 p-2 bg-black/60 rounded-full text-white hover:bg-black/80 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft size={20} /></button>
                            <button onClick={handleNext} className="absolute right-3 p-2 bg-black/60 rounded-full text-white hover:bg-black/80 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight size={20} /></button>
                          </>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center opacity-40">
                        <CameraIcon size={36} className="mb-3" />
                        <p className="text-sm font-bold text-center px-4">No {mediaTab.toLowerCase()} evidence attached.</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><MapPin size={12} /> Location</p>
                      <p className="text-sm font-bold text-foreground">{location?.city}, {location?.state}</p>
                      <p className="text-[11px] text-muted-foreground mt-1 truncate">{location?.address} • PIN: {location?.pinCode}</p>
                    </div>
                    <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm flex flex-col justify-center items-center text-center">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Impact Score</p>
                      <p className="text-2xl font-black text-yellow-500 flex items-center gap-1 justify-center"><Zap size={20} className="fill-yellow-500" /> {impactScore || 0}</p>
                    </div>
                  </div>

                  <div className="bg-muted/20 border border-border/50 rounded-2xl p-5 mb-4 lg:mb-0 shadow-inner">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2">Description</p>
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{description}</p>
                  </div>
                </div>

                {/* RIGHT COLUMN: Players, Actions, Timeline */}
                <div className="w-full lg:w-1/2 flex flex-col bg-muted/5 shrink-0 lg:shrink lg:overflow-y-auto thin-scrollbar relative z-30">

                  {/* PLAYERS SECTION */}
                  <div className="p-4 md:p-5 border-b border-border/50 shrink-0 relative z-[60]">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-card border border-border/50 p-3 rounded-xl flex justify-between items-center relative">
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="text-[9px] text-muted-foreground font-bold uppercase mb-1">Reporter</p>
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-bold truncate ${isAnonymous ? 'text-muted-foreground' : 'text-foreground'}`}>
                              {isAnonymous ? 'Anonymous' : reportedBy?.name || 'Unknown'}
                            </p>
                            {!isAnonymous && isVerified && <ShieldCheck size={14} className="text-emerald-500 shrink-0" />}
                          </div>
                          {renderRankBadge()}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl border transition-colors min-w-0 bg-card border-border/50">
                        <p className="text-[9px] font-bold uppercase mb-1 text-muted-foreground">Assigned Official</p>
                        {localIssue?.bidding?.winningBid?.authorityId ? (
                          <div>
                            <p className="text-sm font-bold text-foreground truncate">{localIssue.bidding.winningBid.authorityId.name || 'Official ID Linked'}</p>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic mt-1 font-medium truncate">Unassigned</p>
                        )}
                      </div>
                    </div>

                    {status === 'PENDING_EXTENSION' && (
                      <div className="col-span-2 mt-4 bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl relative z-[70] overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                          <Clock size={80} className="text-amber-500 -mr-6 -mt-6" />
                        </div>
                        <div className="relative z-10">
                          <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><Clock size={12} /> Extension Requested</p>
                          <p className="text-sm font-bold text-foreground">
                            {workCycle?.extensionRequests?.slice(-1)[0]?.hoursRequested} Hours
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 border-l-2 border-amber-500/50 pl-2">
                            Status: Pending Admin Approval
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CITIZEN ACTION ZONE */}
                  <div className="p-4 md:p-5 border-b border-border/50 shrink-0 bg-background relative z-40">
                    <h4 className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-3 flex items-center justify-between">
                      <span>Your Actions</span>
                      <div className="flex items-center gap-2 text-foreground/70">
                        <span className="flex items-center gap-1"><CheckCircle2 size={12} /> {localConfirmationCount}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Flag size={12} /> {localFlagCount}</span>
                      </div>
                    </h4>

                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 sm:gap-3 w-full">

                        {/* CONDITIONAL ACTION RENDERING */}
                        {hasVoted ? (
                          <div className="w-full flex items-center justify-center p-3 sm:p-3.5 bg-green-500/10 border border-green-500/30 rounded-xl text-green-600 font-bold gap-2 text-sm cursor-default">
                            <CheckCircle2 size={18} /> Vote Already Recorded
                          </div>
                        ) : canVoteOnResolution ? (
                          <>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleConsensusVote('APPROVED');
                              }}
                              disabled={isVerifying}
                              className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all bg-green-500 text-white shadow-md hover:bg-green-600 whitespace-nowrap disabled:opacity-70"
                            >
                              {isVerifying ? <MiniLoader className="w-4 h-4 text-white" /> : <><ThumbsUp size={16} /> {t('approve_fix', 'Approve Fix')}</>}
                            </button>

                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsOpposing(true);
                              }}
                              disabled={isVerifying}
                              className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all bg-red-500/10 text-red-600 border border-red-500/30 hover:bg-red-500 hover:text-white whitespace-nowrap disabled:opacity-70"
                            >
                              <ThumbsDown size={16} /> {t('oppose_fix', 'Oppose Fix')}
                            </button>
                          </>
                        ) : isIssueClosed ? (
                          <div className="w-full flex items-center justify-center p-3 sm:p-3.5 bg-muted border border-border/50 rounded-xl text-muted-foreground font-bold text-sm cursor-default">
                            Issue {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
                          </div>
                        ) : (
                          <>
                            <button onClick={() => setIsFlagOpen(true)} className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all bg-red-500/10 text-red-600 dark:text-red-500 border border-red-500/20 hover:bg-red-500/20 whitespace-nowrap">
                              <Flag size={14} className="sm:w-4 sm:h-4" /> {t('flag_issue')}
                            </button>
                            {!hideConfirm && (
                              <button onClick={handleConfirm} disabled={confirmLoading} className={`flex-[2] flex items-center justify-center gap-1.5 sm:gap-2 px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shadow-sm hover:shadow-md ${isConfirmedByUser ? "bg-green-500/20 text-green-600 border border-green-500/30" : status === 'OPEN' ? "btn-gradient text-white border border-transparent" : "bg-secondary/20 text-secondary border border-secondary/30"}`}>
                                {confirmLoading ? <MiniLoader className="w-4 h-4" /> : isConfirmedByUser ? <><CheckCircle2 size={14} className="sm:w-[18px] sm:h-[18px]" /> {t('confirmed')}</> : <><CheckCircle2 size={14} className="sm:w-[18px] sm:h-[18px]" /> {t('i_confirm_this')}</>}
                              </button>
                            )}
                          </>
                        )}
                      </div>

                      {/* Share Tools */}
                      <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mr-auto">Share</span>
                        <button onClick={handleWhatsappShare} className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-sm">
                          <WhatsappIcon size={16} className="sm:w-[18px] sm:h-[18px]" />
                        </button>
                        <button onClick={handleCopyLink} className={`p-2 sm:p-2.5 rounded-xl transition-all shadow-sm border ${isCopied ? "bg-emerald-500 text-white border-emerald-500" : "bg-muted/50 text-muted-foreground border-border hover:text-foreground hover:bg-muted"}`}>
                          {isCopied ? <Check size={16} className="sm:w-[18px] sm:h-[18px]" /> : <Copy size={16} className="sm:w-[18px] sm:h-[18px]" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* TIMELINE */}
                  <div className="flex-1 p-4 md:p-6 relative z-10 bg-card/40 pb-20">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-6 pl-2 border-l-2 border-primary">System Timeline</h4>
                    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary/50 before:via-border/50 before:to-transparent pb-4">
                      {generateTimeline(localIssue).map((event, i) => (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} key={i} className="relative flex items-start gap-4 group">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-background shrink-0 shadow-md ${event.color} z-10 transition-transform group-hover:scale-110`}>
                            {event.icon}
                          </div>
                          <div className="w-full p-4 rounded-2xl bg-card border border-border/50 shadow-sm mt-1 group-hover:border-primary/30 transition-colors">
                            <h5 className="font-bold text-[11px] md:text-xs uppercase tracking-wider">{event.label}</h5>
                            <div className="text-[10px] text-muted-foreground font-mono mt-1 mb-2 font-medium">{event.time.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                            {event.detail && <p className="text-[11px] text-foreground/80 bg-muted/40 p-2.5 rounded-xl border border-border/40 leading-relaxed font-medium">{event.detail}</p>}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODALS */}
      {isOpposing && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => { e.stopPropagation(); setIsOpposing(false); }} />
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 relative z-10 shadow-2xl animate-in zoom-in-95 fade-in duration-200 flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2 text-center">{t('counter_evidence_req', 'Counter Evidence Required')}</h3>
            <p className="text-sm text-muted-foreground text-center mb-6 leading-relaxed">
              {t('oppose_instructions', 'To prevent false disputes, you must be within 500m of the issue location. Please take a live photo of the current situation.')}
            </p>
            <div className="w-full flex flex-col gap-3">
              <button
                onClick={triggerCameraForDispute}
                disabled={isVerifying}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors shadow-md disabled:opacity-60"
              >
                {isVerifying ? (
                  <><MiniLoader className="w-5 h-5 text-white" /> Uploading...</>
                ) : (
                  <><CameraIcon size={18} /> {t('take_live_photo', 'Take Live Photo')}</>
                )}
              </button>
              <input type="file" id="modal-dispute-camera-input" accept="image/*" capture="environment" className="hidden" onChange={handleWebCameraChange} />
              <button onClick={(e) => { e.stopPropagation(); setIsOpposing(false); }} disabled={isVerifying} className="w-full py-3 rounded-xl border border-border bg-background text-foreground hover:bg-muted font-bold text-sm transition-colors shadow-sm disabled:opacity-50">
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {isFlagOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => { e.stopPropagation(); setIsFlagOpen(false); }} />
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-5 sm:p-6 relative z-10 shadow-2xl animate-in zoom-in-95 fade-in duration-200 flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-full flex justify-between items-center mb-5 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-2.5 bg-red-500/10 rounded-full text-red-500"><Flag size={18} className="sm:w-5 sm:h-5" /></div>
                <h3 className="text-lg sm:text-xl font-bold text-foreground">{t('flag_issue')}</h3>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setIsFlagOpen(false); }} className="p-1.5 sm:p-2 rounded-full bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border/50">
                <X size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
            </div>
            <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-500 mb-3 sm:mb-4" />
            <p className="text-xs sm:text-sm text-muted-foreground text-center mb-5 sm:mb-6 font-medium px-2">{t('flag_reason_desc')}</p>
            <div className="w-full mb-5 sm:mb-6 text-left">
              <span className="text-xs font-bold text-foreground mb-2.5 sm:mb-3 block">{t('flag_reason')} <span className="text-red-500">*</span></span>
              <div className="space-y-2 sm:space-y-2.5 max-h-[40vh] sm:max-h-[240px] overflow-y-auto thin-scrollbar pr-2">
                {FLAG_REASONS.map((reason) => {
                  const translationKey = reason.toLowerCase().replace(' ', '_');
                  return (
                    <label key={reason} className={`flex items-center gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-lg sm:rounded-xl border cursor-pointer transition-all duration-200 ${flagReason === reason ? 'bg-red-500/10 border-red-500 shadow-sm' : 'bg-background border-border hover:border-muted-foreground/30'}`}>
                      <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${flagReason === reason ? 'border-red-500' : 'border-muted-foreground/50'}`}>
                        {flagReason === reason && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500" />}
                      </div>
                      <span className={`text-xs sm:text-[13px] font-bold tracking-widest uppercase flex-1 transition-colors ${flagReason === reason ? 'text-red-600 text-red-500' : 'text-muted-foreground'}`}>{t(translationKey)}</span>
                      <input type="radio" className="hidden" value={reason} checked={flagReason === reason} onChange={(e) => setFlagReason(e.target.value)} />
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="w-full flex gap-2 sm:gap-3 pt-1 sm:pt-2">
              <button onClick={(e) => { e.stopPropagation(); setIsFlagOpen(false); }} className="flex-1 py-2.5 sm:py-3.5 rounded-lg sm:rounded-xl border border-border bg-background text-foreground hover:bg-muted font-bold text-sm transition-colors shadow-sm">{t('cancel')}</button>
              <button onClick={(e) => { e.stopPropagation(); submitFlag(); }} disabled={isFlagging} className={`flex-1 py-2.5 sm:py-3.5 rounded-lg sm:rounded-xl font-bold text-sm transition-all duration-200 ${flagReason ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg' : 'bg-red-600/30 text-white/40 cursor-not-allowed'}`}>{isFlagging ? t('submitting') : t('flag_issue')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default IssueDetail;