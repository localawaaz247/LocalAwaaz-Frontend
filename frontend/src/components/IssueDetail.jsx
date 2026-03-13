import { X, MapPin, User, AlertTriangle, Calendar, ShieldCheck, ChevronLeft, ChevronRight, Play, Flag, CheckCircle2, FileText, Copy, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axiosInstance from "../utils/axios";
import { showToast } from "../utils/toast";
import SEO from "../components/SEO"; // <-- 1. Added SEO Import

const WhatsappIcon = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.305-.885-.653-1.482-1.459-1.655-1.756-.173-.298-.019-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
  </svg>
);

const FLAG_REASONS = [
  "SPAM",
  "INAPPROPRIATE",
  "DUPLICATE",
  "ALREADY RESOLVED",
  "SEXUAL CONTENT",
  "ABUSE",
  "OTHER"
];

const IssueDetail = ({ issue, isOpen, onClose, hideConfirm = false, isAdminView = false }) => {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const currentUser = useSelector((state) => state.auth?.user);

  const [localShareCount, setLocalShareCount] = useState(0);
  const [localFlagCount, setLocalFlagCount] = useState(0);
  const [localConfirmationCount, setLocalConfirmationCount] = useState(0);
  const [isConfirmedByUser, setIsConfirmedByUser] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Flag Modal States
  const [isFlagOpen, setIsFlagOpen] = useState(false);
  const [flagReason, setFlagReason] = useState("");
  const [isFlagging, setIsFlagging] = useState(false);

  const {
    _id, title, category, status, priority, description, location,
    isAnonymous, reportedBy, isVerified, media, impactScore, createdAt, dateOfFormation, isPublic,
    confirmations, hasConfirmed
  } = issue || {};

  useEffect(() => {
    if (isOpen && issue) {
      setCurrentMediaIndex(0);
      setLocalShareCount(issue.shareCount || 0);
      setLocalFlagCount(issue.flagCount || 0);
      setLocalConfirmationCount(issue.confirmationCount || 0);
      setIsCopied(false);
      setIsFlagOpen(false);
      setFlagReason("");

      if (hasConfirmed === true || issue.isConfirmed === true) {
        setIsConfirmedByUser(true);
      } else if (currentUser && currentUser._id && Array.isArray(confirmations)) {
        const currentUserId = String(currentUser._id);
        const hasConfirmedCheck = confirmations.some((conf) => {
          const confId = conf?.user?._id || conf?.user || conf?._id || conf;
          return String(confId) === currentUserId;
        });
        setIsConfirmedByUser(hasConfirmedCheck);
      } else {
        setIsConfirmedByUser(false);
      }

      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, issue, currentUser, confirmations, hasConfirmed]);

  const getColorFromStatus = (status) => {
    switch (status?.toUpperCase()) {
      case "RESOLVED": return "green";
      case "UNDER REVIEW":
      case "IN_REVIEW":
      case "IN_PROGRESS": return "yellow";
      default: return "emerald";
    }
  };

  const color = getColorFromStatus(status);

  const colors = {
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    yellow: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
    green: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
  };

  const priorityColors = {
    HIGH: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    MEDIUM: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
    LOW: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    CRITICAL: "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30 font-bold"
  };

  const validMedia = Array.isArray(media) ? media.map(m => typeof m === 'string' ? { url: m } : m).filter(m => m && m.url) : [];
  const hasMedia = validMedia.length > 0;
  const mediaCount = validMedia.length;
  const hasMultipleMedia = mediaCount > 1;

  const currentMedia = hasMedia ? validMedia[currentMediaIndex] : null;
  const displayImage = currentMedia ? currentMedia.url : null;
  const isVideo = displayImage && (displayImage.match(/\.(mp4|webm|ogg)$/i) || currentMedia?.type?.startsWith('video/'));

  const handlePrevious = (e) => { e.stopPropagation(); if (hasMultipleMedia) setCurrentMediaIndex((prev) => (prev - 1 + mediaCount) % mediaCount); };
  const handleNext = (e) => { e.stopPropagation(); if (hasMultipleMedia) setCurrentMediaIndex((prev) => (prev + 1) % mediaCount); };

  const incrementShare = async () => {
    try { await axiosInstance.put(`/issue/${_id}/share`); } catch (err) { console.log("Share updated", err.message); }
  };

  const handleWhatsappShare = (e) => {
    e.stopPropagation(); setLocalShareCount(prev => prev + 1); incrementShare();
    const text = encodeURIComponent(`Check out this issue on LocalAwaaz: ${title}\n\n${window.location.origin}/issue/${_id}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleCopyLink = (e) => {
    e.stopPropagation(); setLocalShareCount(prev => prev + 1); incrementShare();
    navigator.clipboard.writeText(`${window.location.origin}/issue/${_id}`);
    setIsCopied(true); showToast({ icon: 'success', title: 'Link copied to clipboard!' });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleConfirm = async (e) => {
    e.stopPropagation();
    if (!_id) return;
    try {
      setConfirmLoading(true);
      const coords = JSON.parse(localStorage.getItem('cached_geo_location')) || JSON.parse(localStorage.getItem('currentLocation'));
      let url = `/issue/${_id}/confirm`;
      if (coords?.longitude && coords?.latitude) url += `?lng=${coords.longitude}&lat=${coords.latitude}`;

      const response = await axiosInstance.post(url);

      if (!isConfirmedByUser && response.data?.success) {
        setLocalConfirmationCount(prev => prev + 1);
        setIsConfirmedByUser(true);
      }
      showToast({ icon: 'success', title: response.data?.message || 'Issue Confirmed successfully!' });
    } catch (error) {
      const errorMsg = error.response?.data?.message?.toLowerCase() || "";
      if (errorMsg.includes("already") || errorMsg.includes("confirmed")) {
        setIsConfirmedByUser(true);
        showToast({ icon: 'info', title: error.response?.data?.message || 'You have already confirmed this issue.' });
      } else {
        showToast({ icon: 'error', title: error.response?.data?.message || 'Action completed or already applied.' });
      }
    } finally {
      setConfirmLoading(false);
    }
  };

  const submitFlag = async () => {
    if (!flagReason) {
      showToast({ icon: 'error', title: 'Please select a reason' });
      return;
    }

    setIsFlagging(true);
    try {
      const coords = JSON.parse(localStorage.getItem('cached_geo_location')) || JSON.parse(localStorage.getItem('currentLocation'));
      let url = `/issue/${_id}/${flagReason}`;
      if (coords?.longitude && coords?.latitude) {
        url += `?lng=${coords.longitude}&lat=${coords.latitude}`;
      } else {
        showToast({ icon: 'error', title: 'Location required to flag an issue.' });
        setIsFlagging(false);
        return;
      }

      await axiosInstance.post(url, {});
      setLocalFlagCount(prev => prev + 1);
      showToast({ icon: 'success', title: 'Issue flagged successfully' });
      setIsFlagOpen(false);
      setFlagReason("");
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to flag issue. You may have already flagged it.';
      showToast({ icon: 'error', title: errorMsg });
      setIsFlagOpen(false);
    } finally {
      setIsFlagging(false);
    }
  };

  function formatDate(isoDate) {
    if (!isoDate) return 'Recent';
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return 'Recent';
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  const safeStatus = status?.toUpperCase() || 'OPEN';

  return (
    <>
      {/* 2. ONLY render SEO tags when the modal is actually open and an issue exists */}
      {isOpen && issue && (
        <SEO
          title={title}
          description={description ? description.substring(0, 150) + "..." : "View details about this local issue on LocalAwaaz."}
          url={`/issue/${_id}`}
          image={displayImage} // Dynamically pulls the first uploaded photo or falls back to your default
        />
      )}

      <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 md:p-10 transition-all duration-300 ease-in-out min-h-0 ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}>
        <div className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`} onClick={onClose} />

        <div
          className={`relative w-full max-w-5xl bg-card rounded-2xl shadow-2xl flex flex-col overflow-hidden min-h-0 transform transition-all duration-400 ease-out border border-border/50 
          ${isAdminView ? "max-h-[80vh]" : "max-h-full"} 
          ${isOpen ? "translate-y-0 scale-100 opacity-100" : "translate-y-8 scale-95 opacity-0"}`}
          onClick={e => e.stopPropagation()}
        >
          {issue && (
            <>
              {/* Header */}
              <div className="flex justify-between items-center p-4 md:p-5 border-b border-border/50 bg-muted/30 shrink-0 rounded-t-2xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-3 py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider border ${colors[color] || colors.emerald}`}>
                    {safeStatus}
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-background text-muted-foreground border border-border/60 text-[10px] md:text-xs font-bold uppercase tracking-wider shadow-sm">
                    {category?.replace(/_/g, ' ')}
                  </span>
                </div>

                <button onClick={onClose} className="p-2 rounded-full bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0 border border-border/50 shadow-sm">
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="overflow-y-auto w-full thin-scrollbar p-4 md:p-8 flex-1 min-h-0 bg-background/50">
                <div className="mb-6">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-3 leading-tight tracking-tight">
                    {title}
                  </h2>
                  {priority && (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${priorityColors[priority]}`}>
                      <AlertTriangle size={14} /> {priority} Priority
                    </span>
                  )}
                </div>

                <div className="flex flex-col lg:flex-row gap-6 mb-6">
                  <div className="w-full lg:w-3/5 shrink-0">
                    {hasMedia ? (
                      <div className="relative group overflow-hidden rounded-2xl bg-muted border border-border/50 h-[220px] sm:h-[300px] lg:h-[360px] w-full shadow-sm">
                        {isVideo ? (
                          <video key={displayImage} src={displayImage} className="w-full h-full object-cover" controls poster={displayImage} />
                        ) : (
                          <img key={displayImage} src={displayImage} alt="issue" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                        {hasMultipleMedia && (
                          <>
                            <button onClick={handlePrevious} className="absolute left-3 top-1/2 -translate-y-1/2 text-white p-2 md:p-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 bg-black/40 backdrop-blur-md rounded-full shadow-lg">
                              <ChevronLeft size={20} strokeWidth={2.5} />
                            </button>
                            <button onClick={handleNext} className="absolute right-3 top-1/2 -translate-y-1/2 text-white p-2 md:p-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 bg-black/40 backdrop-blur-md rounded-full shadow-lg">
                              <ChevronRight size={20} strokeWidth={2.5} />
                            </button>
                            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                              {currentMediaIndex + 1} / {mediaCount}
                            </div>
                          </>
                        )}

                        {isVideo && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-black/50 backdrop-blur-md rounded-full p-5 shadow-lg border border-white/10">
                              <Play size={36} className="text-white fill-white ml-1" />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-[220px] sm:h-[300px] lg:h-[360px] rounded-2xl bg-card border border-border/50 flex flex-col items-center justify-center shadow-sm">
                        <AlertTriangle size={48} className="mb-4 text-muted-foreground/50" />
                        <p className="text-base font-medium text-muted-foreground">No media provided</p>
                      </div>
                    )}
                  </div>

                  <div className="w-full lg:w-2/5 flex flex-col gap-4">
                    <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm flex-1">
                      <h4 className="text-[11px] font-bold text-blue-600 dark:text-blue-500 mb-3 uppercase tracking-widest flex items-center gap-2">
                        <MapPin size={16} /> Location
                      </h4>
                      <div className="space-y-1.5">
                        <p className="text-foreground font-bold text-lg leading-tight">{typeof location === 'string' ? location : location?.address || 'Location not provided'}</p>
                        {location?.city && <p className="text-muted-foreground text-sm font-medium">{location?.city}, {location?.state} {location?.pinCode}</p>}
                      </div>
                    </div>

                    <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm flex-1">
                      <h4 className="text-[11px] font-bold text-emerald-600 dark:text-emerald-500 mb-3 uppercase tracking-widest flex items-center gap-2">
                        <User size={16} /> Reported By
                      </h4>
                      {!isAnonymous && reportedBy ? (
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <p className="text-foreground font-bold text-lg leading-tight">{reportedBy.name}</p>
                            {isVerified && (
                              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-emerald-500/20">
                                <ShieldCheck size={12} /> Verified
                              </span>
                            )}
                          </div>
                          <p className="text-muted-foreground text-sm font-medium mt-1">@{reportedBy.userName}</p>

                          <div className="mt-4 bg-background border border-border/50 px-4 py-2.5 rounded-xl inline-flex items-center gap-3 w-fit shadow-sm">
                            <span className="text-xs text-muted-foreground font-medium">Civil Score: <strong className="text-foreground ml-1 text-sm">{reportedBy.civilScore}</strong></span>
                            <span className="w-px h-4 bg-border"></span>
                            <span className="text-xs text-muted-foreground font-medium">Reports: <strong className="text-foreground ml-1 text-sm">{reportedBy.issuesReported}</strong></span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground font-medium">
                          <User size={18} /> Anonymous Citizen
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-2xl p-5 md:p-6 mb-6 border border-border/50 shadow-sm">
                  <h4 className="text-sm font-bold text-blue-600 dark:text-blue-500 mb-3 flex items-center gap-2 uppercase tracking-widest">
                    <FileText size={16} /> Description
                  </h4>
                  <p className="text-sm md:text-base text-foreground/80 leading-relaxed whitespace-pre-wrap">
                    {description}
                  </p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                  <div className="bg-card border border-border/50 rounded-xl p-4 text-center shadow-sm">
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-500 mb-1">{localConfirmationCount}</div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Confirmations</div>
                  </div>
                  <div className="bg-card border border-border/50 rounded-xl p-4 text-center shadow-sm">
                    <div className="text-2xl font-black text-orange-600 dark:text-orange-500 mb-1">{impactScore || 0}</div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Impact Score</div>
                  </div>
                  <div className="bg-card border border-border/50 rounded-xl p-4 text-center flex flex-col justify-center items-center shadow-sm">
                    <div className="text-sm font-bold text-foreground mb-1 mt-1">{formatDate(dateOfFormation || createdAt)}</div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Reported</div>
                  </div>
                  <div className="bg-card border border-border/50 rounded-xl p-4 text-center flex flex-col justify-center items-center shadow-sm">
                    <div className="text-sm font-bold text-foreground mb-1 mt-1">{isPublic ? 'Public' : 'Private'}</div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Visibility</div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 md:px-5 border-t border-border/50 bg-muted/30 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4 z-10 rounded-b-2xl">
                <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-4">
                  <div className="text-sm text-muted-foreground font-medium flex gap-3">
                    <span><strong className="text-foreground">{localShareCount}</strong> Shares</span>
                    <span>•</span>
                    <span><strong className="text-foreground">{localFlagCount}</strong> Flags</span>
                  </div>

                  <div className="flex items-center gap-2 pl-4 border-l border-border/50">
                    <button onClick={handleWhatsappShare} className="p-2.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-sm">
                      <WhatsappIcon size={18} />
                    </button>
                    <button onClick={handleCopyLink} className={`p-2.5 rounded-full transition-all shadow-sm border ${isCopied ? "bg-emerald-500 text-white border-emerald-500" : "bg-background text-muted-foreground border-border hover:text-foreground hover:bg-muted/80"}`}>
                      {isCopied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button onClick={() => setIsFlagOpen(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 sm:py-3 rounded-xl text-sm font-bold transition-all bg-red-500/10 text-red-600 dark:text-red-500 border border-red-500/20 hover:bg-red-500/20">
                    <Flag size={16} /> Flag
                  </button>

                  {!hideConfirm && (
                    <button
                      onClick={handleConfirm}
                      disabled={confirmLoading}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 sm:py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap shadow-sm hover:shadow-md ${isConfirmedByUser
                        ? "bg-green-500/20 text-green-600 border border-green-500/30 hover:bg-green-500/30"
                        : safeStatus === 'OPEN'
                          ? "btn-gradient text-white border border-transparent"
                          : "bg-secondary/20 text-secondary border border-secondary/30 hover:bg-secondary/30"
                        }`}
                    >
                      {confirmLoading ? (
                        "..."
                      ) : isConfirmedByUser ? (
                        <><CheckCircle2 size={18} /> Confirmed</>
                      ) : (
                        <><CheckCircle2 size={18} /> I Confirm This</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {isFlagOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsFlagOpen(false)} />
            <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 relative z-10 shadow-2xl animate-in zoom-in-95 fade-in duration-200 flex flex-col items-center">

              <div className="w-full flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-red-500/10 rounded-full text-red-500">
                    <Flag size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Flag Issue</h3>
                </div>
                <button onClick={() => setIsFlagOpen(false)} className="p-2 rounded-full bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border/50">
                  <X size={18} />
                </button>
              </div>

              <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
              <p className="text-sm text-muted-foreground text-center mb-6 font-medium">
                Please select a reason for flagging this issue. This helps us understand and review the report appropriately.
              </p>

              <div className="w-full mb-6 text-left">
                <span className="text-xs font-bold text-foreground mb-3 block">Flag Reason <span className="text-red-500">*</span></span>

                <div className="space-y-2.5 max-h-[240px] overflow-y-auto thin-scrollbar pr-2">
                  {FLAG_REASONS.map((reason) => (
                    <label key={reason} className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-200 ${flagReason === reason ? 'bg-red-500/10 border-red-500 shadow-sm' : 'bg-background border-border hover:border-muted-foreground/30'
                      }`}>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${flagReason === reason ? 'border-red-500' : 'border-muted-foreground/50'}`}>
                        {flagReason === reason && <div className="w-2 h-2 rounded-full bg-red-500" />}
                      </div>
                      <span className={`text-[13px] font-bold tracking-widest uppercase flex-1 transition-colors ${flagReason === reason ? 'text-red-600 dark:text-red-500' : 'text-muted-foreground'}`}>
                        {reason}
                      </span>
                      <input type="radio" className="hidden" value={reason} checked={flagReason === reason} onChange={(e) => setFlagReason(e.target.value)} />
                    </label>
                  ))}
                </div>
              </div>

              <div className="w-full flex gap-3 pt-2">
                <button onClick={() => setIsFlagOpen(false)} className="flex-1 py-3.5 rounded-xl border border-border bg-background text-foreground hover:bg-muted font-bold transition-colors shadow-sm">
                  Cancel
                </button>
                <button onClick={submitFlag} disabled={isFlagging} className={`flex-1 py-3.5 rounded-xl font-bold transition-all duration-200 ${flagReason ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg' : 'bg-red-600/30 text-white/40 cursor-not-allowed'
                  }`}>
                  {isFlagging ? 'Submitting...' : 'Flag Issue'}
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default IssueDetail;