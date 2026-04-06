import { MapPin, ShieldCheck, User, AlertTriangle, ChevronLeft, ChevronRight, Flag, Copy, Check, Bookmark, CheckCircle2, PlayCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axiosInstance from "../utils/axios";
import { showToast } from "../utils/toast";
import { useTranslation } from "react-i18next";

const WhatsappIcon = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.305-.885-.653-1.482-1.459-1.655-1.756-.173-.298-.019-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
  </svg>
);

const IssueCard = ({ issue, onClick, onFlagClick }) => {
  const { t } = useTranslation();

  // 1. EXTRACT DATA FIRST
  const {
    _id, status, category, title, description, location,
    confirmationCount, impactScore, impact, isVerified, priority,
    reportedBy, isAnonymous, media, thumbnails, dateOfFormation, createdAt, shareCount,
    confirmations, hasConfirmed
  } = issue || {};

  // 2. PROCESS MEDIA TO FIND THE VIDEO
  const validMedia = Array.isArray(media) ? media.map(m => typeof m === 'string' ? { url: m } : m).filter(m => m && m.url) : [];
  const hasMedia = validMedia.length > 0;
  const mediaCount = validMedia.length;
  const hasMultipleMedia = mediaCount > 1;

  // Find the index of the first video in the array (returns -1 if no video exists)
  const firstVideoIndex = validMedia.findIndex(m => m.url?.match(/\.(mp4|webm|ogg)$/i) || m.type?.startsWith('video/'));
  const hasVideoAnywhere = firstVideoIndex !== -1;

  // 3. INITIALIZE STATE WITH VIDEO INDEX (Defaults to 0 if no video)
  const [currentImageIndex, setCurrentImageIndex] = useState(hasVideoAnywhere ? firstVideoIndex : 0);

  const [confirmLoading, setConfirmLoading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [loadedVideos, setLoadedVideos] = useState({});

  const currentUser = useSelector((state) => state.auth?.user);

  const [localConfirmationCount, setLocalConfirmationCount] = useState(0);
  const [localShareCount, setLocalShareCount] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isConfirmedByUser, setIsConfirmedByUser] = useState(false);

  useEffect(() => {
    setLocalConfirmationCount(confirmationCount || 0);
    setLocalShareCount(shareCount || 0);

    if (currentUser && currentUser._id) {
      const currentUserId = String(currentUser._id);
      if (hasConfirmed === true || issue.isConfirmed === true) {
        setIsConfirmedByUser(true);
        return;
      }
      if (Array.isArray(confirmations)) {
        const confirmed = confirmations.some((conf) => {
          const confId = conf?.user?._id || conf?.user || conf?._id || conf;
          return String(confId) === currentUserId;
        });
        setIsConfirmedByUser(confirmed);
      }
    }
  }, [confirmationCount, shareCount, currentUser, confirmations, hasConfirmed, issue]);

  // Disable Auto-Slider if a video exists anywhere in the post
  useEffect(() => {
    let interval;
    if (hasMultipleMedia && !hasVideoAnywhere && !isPaused) {
      interval = setInterval(() => setCurrentImageIndex((prev) => (prev + 1) % mediaCount), 3000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [hasMultipleMedia, mediaCount, isPaused, hasVideoAnywhere]);

  const getColorFromStatus = (status) => {
    switch (status?.toUpperCase()) {
      case "RESOLVED": return "green";
      case "UNDER REVIEW":
      case "IN_REVIEW":
      case "IN_PROGRESS": return "yellow";
      default: return "red";
    }
  };

  const color = getColorFromStatus(status);
  const colors = { red: "bg-destructive/10 text-destructive border border-destructive/20", yellow: "bg-secondary/20 text-secondary border border-secondary/30", green: "bg-accent/20 text-accent border border-accent/30" };
  const priorityColors = { HIGH: "bg-red-100 text-red-700 border border-red-200", MEDIUM: "bg-yellow-100 text-yellow-700 border border-yellow-200", LOW: "bg-green-100 text-green-700 border border-green-200", CRITICAL: "bg-red-200 text-red-800 border border-red-300 font-bold" };

  const currentMedia = hasMedia ? validMedia[currentImageIndex] : null;
  const displayImage = currentMedia ? currentMedia.url : null;
  const isVideo = currentMedia && (currentMedia.url?.match(/\.(mp4|webm|ogg)$/i) || currentMedia.type?.startsWith('video/'));

  const handlePrevious = (e) => { e.stopPropagation(); if (hasMultipleMedia) setCurrentImageIndex((prev) => (prev - 1 + mediaCount) % mediaCount); };
  const handleNext = (e) => { e.stopPropagation(); if (hasMultipleMedia) setCurrentImageIndex((prev) => (prev + 1) % mediaCount); };

  const handleVideoPlayClick = (e, index) => {
    e.stopPropagation();
    setLoadedVideos(prev => ({ ...prev, [index]: true }));
    setIsVideoPlaying(true);
  };

  const incrementShare = async () => { try { await axiosInstance.put(`/issue/${_id}/share`); } catch (err) { console.log("Share updated", err.message); } };

  const handleWhatsappShare = (e) => {
    e.stopPropagation(); setLocalShareCount(prev => prev + 1); incrementShare();
    const text = encodeURIComponent(`${t('check_out_issue')}: ${title}\n\n${window.location.origin}/issue/${_id}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleCopyLink = (e) => {
    e.stopPropagation(); setLocalShareCount(prev => prev + 1); incrementShare();
    navigator.clipboard.writeText(`${window.location.origin}/issue/${_id}`);
    setIsCopied(true); showToast({ icon: 'success', title: t('link_copied') });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveToggle = async (e) => {
    e.stopPropagation(); const newSavedState = !isSaved; setIsSaved(newSavedState);
    try {
      if (newSavedState) { await axiosInstance.post(`/save-issue/${_id}`); showToast({ icon: 'success', title: t('issue_saved') }); }
      else { await axiosInstance.delete(`/remove/saved-issue/${_id}`); showToast({ icon: 'success', title: t('removed_saved') }); }
    } catch (error) { setIsSaved(!newSavedState); showToast({ icon: 'error', title: t('failed_update_saved') }); }
  };

  const handleConfirm = async (e) => {
    e.stopPropagation();
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
      showToast({ icon: 'success', title: response.data?.message || t('issue_confirmed_success') });
    } catch (error) {
      const errorMsg = error.response?.data?.message?.toLowerCase() || "";
      if (errorMsg.includes("already") || errorMsg.includes("confirmed")) {
        setIsConfirmedByUser(true);
        showToast({ icon: 'info', title: error.response?.data?.message || t('already_confirmed') });
      } else {
        showToast({ icon: 'error', title: error.response?.data?.message || t('action_completed') });
      }
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleFlagClickAction = (e) => { e.stopPropagation(); if (onFlagClick) onFlagClick(); };

  function formatDate(isoDate) {
    if (!isoDate) return t('recent');
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return t('recent');
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }

  function truncateDescription(text, maxWords = 30) {
    if (!text) return t('view_details_placeholder');
    const words = text.split(' ');
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(' ') + '...';
  }

  return (
    <div className="glass-card p-4 md:p-5 rounded-xl hover:shadow-lg transition-all cursor-pointer flex flex-col h-full border border-border/50 overflow-hidden" onClick={onClick}>

      <div className="flex justify-between items-start mb-3 gap-2">
        <div className="flex gap-1.5 md:gap-2 flex-wrap">
          <span className={`text-[10px] md:text-xs px-2.5 py-1 rounded-full font-bold ${colors[color]}`}>{t(status?.toLowerCase() || 'open')}</span>
          <span className="text-[10px] md:text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border font-medium">{t(category?.toLowerCase()) || category}</span>
          {priority && <span className={`text-[10px] md:text-xs px-2.5 py-1 rounded-full ${priorityColors[priority]} flex items-center gap-1 font-semibold`}><AlertTriangle size={12} /> {t(priority.toLowerCase())}</span>}
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className="text-[10px] md:text-xs text-muted-foreground font-medium whitespace-nowrap">{formatDate(dateOfFormation || createdAt)}</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground mr-1 hidden sm:inline-block"><strong>{localShareCount}</strong> {t('shares')}</span>
            <button onClick={handleSaveToggle} className={`p-1.5 rounded-full transition-all shadow-sm border ${isSaved ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20" : "bg-card text-muted-foreground border-border hover:bg-muted/80 hover:text-foreground"}`} title={isSaved ? t('remove_saved') : t('save_issue')}><Bookmark size={14} className={isSaved ? "fill-primary" : ""} /></button>
            <button onClick={handleWhatsappShare} className="p-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 hover:bg-green-500 hover:text-white transition-all shadow-sm" title={t('share_whatsapp')}><WhatsappIcon size={14} /></button>
            <button onClick={handleCopyLink} className={`p-1.5 rounded-full transition-all shadow-sm border ${isCopied ? "bg-green-500 text-white border-green-500" : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted/80"}`} title={t('copy_link')}>{isCopied ? <Check size={14} /> : <Copy size={14} />}</button>
          </div>
        </div>
      </div>

      {hasMedia && (
        <div className="relative group mb-3 overflow-hidden rounded-lg bg-black flex-shrink-0" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
          <div className="relative h-40 sm:h-56 w-full overflow-hidden">
            {isVideo ? (
              loadedVideos[currentImageIndex] ? (
                // ACTUAL VIDEO LOADED
                <video
                  src={displayImage}
                  className="w-full h-full object-contain bg-black animate-in fade-in duration-300"
                  controls
                  autoPlay
                  playsInline
                  onPlay={(e) => { e.stopPropagation(); setIsVideoPlaying(true); }}
                  onPause={(e) => { e.stopPropagation(); setIsVideoPlaying(false); }}
                  onEnded={(e) => { e.stopPropagation(); setIsVideoPlaying(false); }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                // 🚀 FROZEN VIDEO FACADE (Solves the empty poster issue!)
                <div
                  className="w-full h-full relative cursor-pointer flex items-center justify-center bg-black group-hover:opacity-90 transition-opacity"
                  onClick={(e) => handleVideoPlayClick(e, currentImageIndex)}
                >
                  <video
                    src={`${displayImage}#t=0.001`}
                    preload="metadata"
                    className="w-full h-full object-cover opacity-80 pointer-events-none"
                    muted
                    playsInline
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-xl transition-transform group-hover:scale-110 group-hover:bg-primary">
                      <PlayCircle className="w-8 h-8 text-white group-hover:text-primary-foreground transition-colors" />
                    </div>
                  </div>
                </div>
              )
            ) : (
              <img
                src={displayImage}
                alt="issue"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            )}

            {!loadedVideos[currentImageIndex] && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
            )}
          </div>

          {hasMultipleMedia && !loadedVideos[currentImageIndex] && (
            <>
              <button onClick={handlePrevious} className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 text-white p-1.5 md:p-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 z-10 drop-shadow-lg bg-black/20 md:bg-transparent rounded-full"><ChevronLeft size={24} strokeWidth={2.5} /></button>
              <button onClick={handleNext} className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 text-white p-1.5 md:p-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 z-10 drop-shadow-lg bg-black/20 md:bg-transparent rounded-full"><ChevronRight size={24} strokeWidth={2.5} /></button>
              <div className="absolute top-2 right-2 md:top-3 md:right-3 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-medium z-10">{currentImageIndex + 1} / {mediaCount}</div>
              <div className="absolute bottom-2 md:bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 md:gap-2 z-10">
                {validMedia.map((_, index) => <button key={index} onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(index); }} className={`transition-all duration-300 rounded-full ${index === currentImageIndex ? "w-4 md:w-6 h-1.5 md:h-2 bg-white shadow-lg" : "w-1.5 h-1.5 md:w-2 md:h-2 bg-white/60 hover:bg-white/80"}`} />)}
              </div>
            </>
          )}
        </div>
      )}

      <h4 className="font-semibold text-base md:text-lg text-foreground mb-1.5 md:mb-2 line-clamp-2">{title}</h4>
      <p className="text-xs md:text-sm text-muted-foreground mb-3 leading-relaxed flex-grow">{truncateDescription(description)}</p>

      <div className="flex flex-col gap-2 text-[11px] md:text-sm text-muted-foreground mb-3 md:mb-4">
        <div className="flex items-center gap-1.5 md:gap-2 line-clamp-1"><MapPin size={14} className="flex-shrink-0 text-primary" /><span className="truncate">{typeof location === 'string' ? location : location?.address || location?.city || t('location_not_specified')}</span></div>
        <div className="flex items-center gap-2 flex-wrap">
          {isAnonymous ? <span className="flex items-center gap-1 text-muted-foreground"><User size={14} /> {t('anonymous')}</span> : reportedBy?.name ? <span className="flex items-center gap-1 text-muted-foreground"><User size={14} /> {reportedBy.name}</span> : null}
          {isVerified && <span className="flex items-center gap-1 text-accent"><ShieldCheck size={14} /> {t('verified')}</span>}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/50 mt-auto">
        <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm">
          <span className="text-foreground whitespace-nowrap"><strong>{localConfirmationCount}</strong> {t('confirmed')}</span>
          <span className="text-foreground whitespace-nowrap"><strong>{impactScore || impact || 0}</strong> {t('impact')}</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-1 min-w-[fit-content] justify-end">
          <button onClick={handleFlagClickAction} className="flex-1 sm:flex-none max-w-[120px] flex items-center justify-center gap-1 px-3 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-medium transition-all bg-red-100 text-red-700 border border-red-200 hover:bg-red-200">
            <Flag size={14} /> {t('flag')}
          </button>

          <button
            onClick={handleConfirm}
            disabled={confirmLoading}
            className={`flex-1 sm:flex-none max-w-[140px] flex items-center justify-center px-4 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-medium transition-all whitespace-nowrap shadow-sm hover:shadow-md ${isConfirmedByUser
              ? "bg-green-500/20 text-green-600 border border-green-500/30 hover:bg-green-500/30"
              : status?.toUpperCase() === 'OPEN'
                ? "btn-gradient text-white border border-transparent"
                : "bg-secondary/20 text-secondary border border-secondary/30 hover:bg-secondary/30"
              }`}
          >
            {confirmLoading ? "..." : isConfirmedByUser ? (
              <><CheckCircle2 size={14} className="mr-1" /> {t('confirmed')}</>
            ) : (
              t('i_confirm')
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IssueCard;