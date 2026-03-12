import { MapPin, ShieldCheck, User, AlertTriangle, ChevronLeft, ChevronRight, Share2, Flag } from "lucide-react";
import { useState, useEffect } from "react";
import axiosInstance from "../utils/axios";
import { showToast } from "../utils/toast";
import ShareLinkModal from "./modals/ShareLinkModal";

const IssueCard = ({ issue, onClick, onFlagClick }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const {
    _id,
    status,
    category,
    title,
    description,
    location,
    confirmationCount,
    impactScore,
    impact,
    isVerified,
    priority,
    reportedBy,
    isAnonymous,
    media,
    dateOfFormation,
    createdAt
  } = issue || {};

  // --- BULLETPROOF MEDIA CHECK ---
  const validMedia = Array.isArray(media)
    ? media.map(m => typeof m === 'string' ? { url: m } : m).filter(m => m && m.url)
    : [];

  const hasMedia = validMedia.length > 0;
  const mediaCount = validMedia.length;
  const hasMultipleMedia = mediaCount > 1;

  useEffect(() => {
    let interval;
    if (hasMultipleMedia && !isPaused) {
      interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % mediaCount);
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [hasMultipleMedia, mediaCount, isPaused]);

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

  const colors = {
    red: "bg-destructive/10 text-destructive border border-destructive/20",
    yellow: "bg-secondary/20 text-secondary border border-secondary/30",
    green: "bg-accent/20 text-accent border border-accent/30",
  };

  const priorityColors = {
    HIGH: "bg-red-100 text-red-700 border border-red-200",
    MEDIUM: "bg-yellow-100 text-yellow-700 border border-yellow-200",
    LOW: "bg-green-100 text-green-700 border border-green-200",
    CRITICAL: "bg-red-200 text-red-800 border border-red-300 font-bold",
  };

  const currentMedia = hasMedia ? validMedia[currentImageIndex] : null;
  const displayImage = currentMedia ? currentMedia.url : null;
  const isVideo = currentMedia && (currentMedia.url?.match(/\.(mp4|webm|ogg)$/i) || currentMedia.type?.startsWith('video/'));

  const handlePrevious = (e) => {
    e.stopPropagation();
    if (hasMultipleMedia) setCurrentImageIndex((prev) => (prev - 1 + mediaCount) % mediaCount);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (hasMultipleMedia) setCurrentImageIndex((prev) => (prev + 1) % mediaCount);
  };

  const handleShare = (e) => {
    e.stopPropagation();
    setShowShareModal(true);
  };

  const handleConfirm = async (e) => {
    e.stopPropagation();
    try {
      setConfirmLoading(true);
      const coords = JSON.parse(localStorage.getItem('currentLocation'));
      const longitude = coords?.longitude;
      const latitude = coords?.latitude;
      
      let url = `/issue/${issue?._id}/confirm`;
      if (longitude && latitude) {
        url += `?lng=${longitude}&lat=${latitude}`;
      }
      
      await axiosInstance.post(url);
      showToast({ icon: 'success', title: 'Issue Confirmed!' });
    } catch (error) {
      showToast({ icon: 'error', title: error.response?.data?.message || error.message });
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleFlagClickAction = (e) => {
    e.stopPropagation();
    if (onFlagClick) onFlagClick();
  };

  function formatDate(isoDate) {
    if (!isoDate) return 'Recent';
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return 'Recent';
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }

  function truncateDescription(text, maxWords = 30) {
    if (!text) return 'View details to see more information about this issue.';
    const words = text.split(' ');
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(' ') + '...';
  }

  return (
    <div
      className="glass-card p-4 md:p-5 rounded-xl hover:shadow-lg transition-all cursor-pointer flex flex-col h-full border border-border/50 overflow-hidden"
      onClick={onClick}
    >
      {/* Top Header */}
      <div className="flex justify-between items-start mb-3 gap-2">
        <div className="flex gap-1.5 md:gap-2 flex-wrap">
          <span className={`text-[10px] md:text-xs px-2.5 py-1 rounded-full ${colors[color]}`}>
            {status || 'OPEN'}
          </span>
          <span className="text-[10px] md:text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border">
            {category}
          </span>
          {priority && (
            <span className={`text-[10px] md:text-xs px-2.5 py-1 rounded-full ${priorityColors[priority]} flex items-center gap-1`}>
              <AlertTriangle size={12} /> {priority}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
          <button onClick={handleShare} className="p-1.5 md:p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
            <Share2 size={16} className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <span className="text-[10px] md:text-xs text-muted-foreground whitespace-nowrap">
            {formatDate(dateOfFormation || createdAt)}
          </span>
        </div>
      </div>

      <h4 className="font-semibold text-base md:text-lg text-foreground mb-1.5 md:mb-2 line-clamp-2">{title}</h4>
      <p className="text-xs md:text-sm text-muted-foreground mb-3 leading-relaxed flex-grow">{truncateDescription(description)}</p>

      {/* Media Container */}
      {hasMedia && (
        <div
          className="relative group mb-3 md:mb-4 overflow-hidden rounded-lg bg-muted flex-shrink-0"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="relative h-40 sm:h-56 w-full overflow-hidden">
            {isVideo ? (
              <video key={displayImage} src={displayImage} className="w-full h-full object-cover" controls poster={displayImage} />
            ) : (
              <img key={displayImage} src={displayImage} alt="issue" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          {hasMultipleMedia && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 text-white p-1.5 md:p-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 z-10 drop-shadow-lg bg-black/20 md:bg-transparent rounded-full"
              >
                <ChevronLeft size={24} className="md:w-7 md:h-7" strokeWidth={2.5} />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 text-white p-1.5 md:p-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 z-10 drop-shadow-lg bg-black/20 md:bg-transparent rounded-full"
              >
                <ChevronRight size={24} className="md:w-7 md:h-7" strokeWidth={2.5} />
              </button>
            </>
          )}

          <div className="absolute top-2 right-2 md:top-3 md:right-3 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-medium z-10">
            {currentImageIndex + 1} / {mediaCount}
          </div>

          {hasMultipleMedia && (
            <div className="absolute bottom-2 md:bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 md:gap-2 z-10">
              {validMedia.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(index); }}
                  className={`transition-all duration-300 rounded-full ${index === currentImageIndex ? "w-4 md:w-6 h-1.5 md:h-2 bg-white shadow-lg" : "w-1.5 h-1.5 md:w-2 md:h-2 bg-white/60 hover:bg-white/80"}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Info Section (Location & User) */}
      <div className="flex flex-col gap-2 text-[11px] md:text-sm text-muted-foreground mb-3 md:mb-4">
        <div className="flex items-center gap-1.5 md:gap-2 line-clamp-1">
          <MapPin size={14} className="flex-shrink-0 text-primary" />
          <span className="truncate">{typeof location === 'string' ? location : location?.address || location?.city || 'Location not specified'}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isAnonymous ? (
            <span className="flex items-center gap-1 text-muted-foreground"><User size={14} /> Anonymous</span>
          ) : reportedBy?.name ? (
            <span className="flex items-center gap-1 text-muted-foreground"><User size={14} /> {reportedBy.name}</span>
          ) : null}
          {isVerified && <span className="flex items-center gap-1 text-accent"><ShieldCheck size={14} /> Verified</span>}
        </div>
      </div>

      {/* --- RESPONSIVE FOOTER SECTION --- */}
      {/* Added flex-wrap so the buttons drop down to a new row in constrained spaces (like AI Chat) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/50 mt-auto">
        
        {/* Stats */}
        <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm">
          <span className="text-foreground whitespace-nowrap"><strong>{confirmationCount || 0}</strong> Confirmed</span>
          <span className="text-foreground whitespace-nowrap"><strong>{impactScore || impact || 0}</strong> Impact</span>
        </div>
        
        {/* Buttons - These will expand to fill space if they wrap to a new line */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1 min-w-[fit-content] justify-end">
          <button 
            onClick={handleFlagClickAction} 
            className="flex-1 sm:flex-none max-w-[120px] flex items-center justify-center gap-1 px-3 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-medium transition-all bg-red-100 text-red-700 border border-red-200 hover:bg-red-200"
          >
            <Flag size={14} /> Flag
          </button>
          <button 
            onClick={handleConfirm} 
            className={`flex-1 sm:flex-none max-w-[140px] flex items-center justify-center px-4 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-medium transition-all whitespace-nowrap ${status?.toUpperCase() === 'OPEN' ? "btn-gradient text-white" : "bg-secondary/20 text-secondary border border-secondary/30 hover:bg-secondary/30"}`}
          >
            {confirmLoading ? "..." : "I Confirm"}
          </button>
        </div>

      </div>

      <ShareLinkModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareLink={`${window.location.origin}/dashboard/issue/${_id}`}
      />
    </div>
  );
};

export default IssueCard;