import { MapPin, ShieldCheck, User, AlertTriangle, ChevronLeft, ChevronRight, Play, Flag, Share2 } from "lucide-react";
import { useState, useEffect } from "react";
import axiosInstance from "../utils/axios";
import { showToast } from "../utils/toast";
import { fetchIssues } from "../reducer/issueFeedReducer";
import ShareLinkModal from "../components/modals/ShareLinkModal";

const IssueCard = ({ issue, onClick, onFlagClick }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isPaused, setIsPaused] = useState(false); // New state for hover tracking

  const {
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

  const hasMedia = media && media.length > 0;
  const mediaCount = hasMedia ? media.length : 0;
  const hasMultipleMedia = mediaCount > 1;

  // --- AUTO-ROTATE LOGIC WITH PAUSE ON HOVER ---
  useEffect(() => {
    let interval;
    if (hasMultipleMedia && !isPaused) {
      interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % mediaCount);
      }, 3000); // 3 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [hasMultipleMedia, mediaCount, isPaused]); // Re-run if paused state changes
  // ----------------------------------------------

  const getColorFromStatus = (status) => {
    switch (status) {
      case "Resolved": return "green";
      case "Under Review":
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
  };

  const currentMedia = hasMedia ? media[currentImageIndex] : null;
  const displayImage = currentMedia ? currentMedia.url : null;
  const isVideo = currentMedia && (currentMedia.url?.match(/\.(mp4|webm|ogg)$/i) || currentMedia.type?.startsWith('video/'));

  const handlePrevious = () => {
    if (hasMultipleMedia) setCurrentImageIndex((prev) => (prev - 1 + mediaCount) % mediaCount);
  };

  const handleNext = () => {
    if (hasMultipleMedia) setCurrentImageIndex((prev) => (prev + 1) % mediaCount);
  };

  const handleShare = (e) => {
    if (e) e.stopPropagation();
    setShowShareModal(true);
  };

  const handleConfirm = async (e) => {
    if (e) e.stopPropagation();
    try {
      setConfirmLoading(true);
      const coords = JSON.parse(localStorage.getItem('currentLocation'));
      const longitude = coords?.longitude;
      const latitude = coords?.latitude;
      await axiosInstance.post(`/issue/${issue?._id}/confirm?lng=${longitude}&lat=${latitude}`);
      setConfirmLoading(false);
      fetchIssues();
    } catch (error) {
      setConfirmLoading(false);
      showToast({ icon: 'error', title: error.response?.data?.message });
    }
  };

  const handleFlagClick = (e) => {
    if (e) e.stopPropagation();
    onFlagClick();
  };

  function formatDate(isoDate) {
    const date = new Date(isoDate);
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }

  function truncateDescription(text, maxWords = 40) {
    if (!text) return '';
    const words = text.split(' ');
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(' ') + '...';
  }

  return (
    <div
      className="glass-card p-5 rounded-xl hover:shadow-lg transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between mb-3">
        <div className="flex gap-2 flex-wrap">
          <span className={`text-xs px-3 py-1 rounded-full ${colors[color]}`}>{status}</span>
          <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground border border-border">{category}</span>
          {priority && (
            <span className={`text-xs px-3 py-1 rounded-full ${priorityColors[priority]} flex items-center gap-1`}>
              <AlertTriangle size={12} />
              {priority}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleShare} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
            <Share2 size={16} />
          </button>
          <span className="text-xs text-muted-foreground">{formatDate(dateOfFormation || createdAt)}</span>
        </div>
      </div>

      <h4 className="font-semibold text-foreground mb-2">{title}</h4>
      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{truncateDescription(description)}</p>

      {/* Media Container with Pause listeners */}
      <div
        className="relative group mb-3 overflow-hidden rounded-lg bg-muted"
        onMouseEnter={() => setIsPaused(true)}   // PAUSE ON HOVER
        onMouseLeave={() => setIsPaused(false)}  // RESUME ON LEAVE
      >
        <div className="relative h-48 w-full overflow-hidden">
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
              onClick={(e) => { e.stopPropagation(); handlePrevious(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 z-10 drop-shadow-lg"
            >
              <ChevronLeft size={28} strokeWidth={2.5} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 z-10 drop-shadow-lg"
            >
              <ChevronRight size={28} strokeWidth={2.5} />
            </button>
          </>
        )}

        {hasMedia && (
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium z-10">
            {currentImageIndex + 1} / {mediaCount}
          </div>
        )}

        {hasMultipleMedia && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
            {media.map((_, index) => (
              <button
                key={index}
                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(index); }}
                className={`transition-all duration-300 rounded-full ${index === currentImageIndex ? "w-6 h-2 bg-white shadow-lg" : "w-2 h-2 bg-white/60 hover:bg-white/80"}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom Section */}
      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
        <div className="flex items-center gap-2">
          <MapPin size={14} />
          {typeof location === 'string' ? location : location?.address || 'Unknown location'}
        </div>
        <div className="flex items-center gap-2">
          {isAnonymous ? (
            <span className="flex items-center gap-1 text-muted-foreground"><User size={14} /> Anonymous</span>
          ) : reportedBy?.name ? (
            <span className="flex items-center gap-1 text-muted-foreground"><User size={14} /> {reportedBy.name}</span>
          ) : null}
          {isVerified && <span className="flex items-center gap-1 text-accent"><ShieldCheck size={14} /> Verified</span>}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex gap-6 text-sm">
          <span className="text-foreground"><strong>{confirmationCount || 0}</strong> Confirmed</span>
          <span className="text-foreground"><strong>{impactScore || impact || 0}</strong> Impact</span>
        </div>
        <div className="flex gap-2">
          <button onClick={handleFlagClick} className="px-3 py-2 rounded-xl text-sm font-medium transition-all bg-red-100 text-red-700 border border-red-200 hover:bg-red-200 flex items-center gap-1">
            <Flag size={14} /> Flag
          </button>
          <button onClick={handleConfirm} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${status === 'Open' ? "btn-gradient" : "bg-secondary/20 text-secondary border border-secondary/30 hover:bg-secondary/30"}`}>
            {confirmLoading ? "Confirming..." : "I Confirm"}
          </button>
        </div>
      </div>

      <ShareLinkModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareLink={`${window.location.origin}/issue/${issue?._id}`}
      />
    </div>
  );
};

export default IssueCard;