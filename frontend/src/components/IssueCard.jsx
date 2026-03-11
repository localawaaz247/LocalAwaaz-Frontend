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
    isVerified,
    priority,
    reportedBy,
    isAnonymous,
    media,
    createdAt
  } = issue || {};

  // --- BULLETPROOF MEDIA CHECK ---
  // Handle both array of strings and array of objects, and filter out invalid ones
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
      if (!longitude || !latitude) throw new Error("Location permission is needed to confirm.");
      await axiosInstance.post(`/issue/${issue?._id}/confirm?lng=${longitude}&lat=${latitude}`);
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

  // --- BULLETPROOF DATE CHECK ---
  function formatDate(isoDate) {
    if (!isoDate) return 'Recent';
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return 'Recent';
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }

  function truncateDescription(text, maxWords = 25) {
    if (!text) return 'View details to see more information about this issue.';
    const words = text.split(' ');
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(' ') + '...';
  }

  return (
    <div
      className="bg-card/60 backdrop-blur-sm p-4 rounded-xl hover:shadow-lg transition-all cursor-pointer flex flex-col h-full border border-border/50"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-3 gap-2">
        <div className="flex gap-1.5 flex-wrap">
          <span className={`text-[10px] md:text-xs px-2.5 py-0.5 md:py-1 rounded-full ${colors[color]}`}>{status || 'OPEN'}</span>
          <span className="text-[10px] md:text-xs px-2.5 py-0.5 md:py-1 rounded-full bg-muted text-muted-foreground border border-border">{category}</span>
          {priority && (
            <span className={`text-[10px] md:text-xs px-2.5 py-0.5 md:py-1 rounded-full ${priorityColors[priority]} flex items-center gap-1`}>
              <AlertTriangle size={10} /> {priority}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatDate(createdAt)}</span>
        </div>
      </div>

      <h4 className="font-semibold text-sm md:text-base text-foreground mb-1.5 line-clamp-2">{title}</h4>
      <p className="text-[11px] md:text-xs text-muted-foreground mb-3 leading-relaxed flex-grow">{truncateDescription(description)}</p>

      {/* Media Container - ONLY RENDERS IF VALID MEDIA EXISTS */}
      {hasMedia && (
        <div
          className="relative group mb-3 overflow-hidden rounded-lg bg-muted flex-shrink-0"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="relative h-32 sm:h-40 w-full overflow-hidden">
            {isVideo ? (
              <video key={displayImage} src={displayImage} className="w-full h-full object-cover" controls poster={displayImage} />
            ) : (
              <img key={displayImage} src={displayImage} alt="issue" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            )}
          </div>

          {hasMultipleMedia && (
            <>
              <button onClick={handlePrevious} className="absolute left-1 top-1/2 -translate-y-1/2 text-white p-1 bg-black/40 rounded-full hover:bg-black/60 transition-colors z-10">
                <ChevronLeft size={16} />
              </button>
              <button onClick={handleNext} className="absolute right-1 top-1/2 -translate-y-1/2 text-white p-1 bg-black/40 rounded-full hover:bg-black/60 transition-colors z-10">
                <ChevronRight size={16} />
              </button>
              <div className="absolute top-1 right-1 bg-black/60 backdrop-blur-sm text-white px-1.5 py-0.5 rounded-full text-[9px] font-medium z-10">
                {currentImageIndex + 1} / {mediaCount}
              </div>
            </>
          )}
        </div>
      )}

      {/* Info Section */}
      <div className="flex flex-col gap-1.5 text-[10px] md:text-[11px] text-muted-foreground mb-3">
        <div className="flex items-center gap-1.5 line-clamp-1">
          <MapPin size={12} className="flex-shrink-0 text-primary" />
          <span className="truncate">{location?.address || location?.city || 'Location not specified'}</span>
        </div>
      </div>

      {/* Footer Section */}
      <div className="flex justify-between items-center gap-2 pt-2.5 border-t border-border/50 mt-auto">
        <div className="flex gap-3 text-[11px] md:text-xs">
          <span className="text-foreground"><strong>{confirmationCount || 0}</strong> Confirmed</span>
          <span className="text-foreground"><strong>{impactScore || 0}</strong> Impact</span>
        </div>
        <div className="flex gap-1.5">
          <button onClick={handleShare} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
            <Share2 size={14} />
          </button>
          <button onClick={handleFlagClickAction} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all">
            <Flag size={14} />
          </button>
        </div>
      </div>

      <ShareLinkModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareLink={`${window.location.origin}/issue/${_id}`}
      />
    </div>
  );
};

export default IssueCard;