import { X, MapPin, User, AlertTriangle, Calendar, Share2, ShieldCheck, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useState } from "react";

const IssueDetail = ({ issue, isOpen, onClose }) => {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  if (!isOpen || !issue) return null;

  // Extract fields from issue prop
  const {
    title,
    category,
    priority,
    subCategory,
    description,
    location,
    isAnonymous,
    reportedBy,
    media,
    confirmationCount,
    flagCount,
    impactScore,
    createdAt,
    updatedAt,
    shareCount,
    isPublic
  } = issue || {};

  const colors = {
    OPEN: "bg-green-100 text-green-700 border border-green-200",
    IN_PROGRESS: "bg-yellow-100 text-yellow-700 border border-yellow-200",
    RESOLVED: "bg-blue-100 text-blue-700 border border-blue-200",
    CLOSED: "bg-gray-100 text-gray-700 border border-gray-200"
  };

  const priorityColors = {
    HIGH: "bg-red-100 text-red-700 border border-red-200",
    MEDIUM: "bg-yellow-100 text-yellow-700 border border-yellow-200",
    LOW: "bg-green-100 text-green-700 border border-green-200"
  };

  const hasMedia = media && media.length > 0;
  const mediaCount = hasMedia ? media.length : 0;
  const hasMultipleMedia = mediaCount > 1;

  const currentMedia = hasMedia ? media[currentMediaIndex] : null;
  const displayImage = currentMedia ? currentMedia.url : null;
  const isVideo = currentMedia && (currentMedia.url?.match(/\.(mp4|webm|ogg)$/i) || currentMedia.type?.startsWith('video/'));

  const handlePrevious = () => {
    if (hasMultipleMedia) {
      setCurrentMediaIndex((prev) => (prev - 1 + mediaCount) % mediaCount);
    }
  };

  const handleNext = () => {
    if (hasMultipleMedia) {
      setCurrentMediaIndex((prev) => (prev + 1) % mediaCount);
    }
  };

  function formatDate(isoDate) {
    const date = new Date(isoDate);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  return (
    // Increased z-index to 60 to ensure it covers the mobile taskbar
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      {/* Align bottom on mobile, center on desktop */}
      <div className="flex min-h-full items-end sm:items-center justify-center sm:p-4">

        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-6xl bg-card dark:glass-card rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col animate-fade-in-up sm:animate-none">

          {/* Close Button - Sticky/Absolute */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 md:top-4 md:right-4 z-20 p-1.5 md:p-2 rounded-full md:rounded-lg bg-background/50 md:bg-transparent backdrop-blur-md md:backdrop-blur-none text-foreground md:text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border/50 md:border-transparent"
          >
            <X size={20} className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          {/* Scrollable Content */}
          <div className="overflow-y-auto w-full no-scrollbar p-4 md:p-6 pt-10 md:pt-6">

            {/* Hero Section with Media */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">

              {/* Left Column - Media */}
              <div className="space-y-4">
                {hasMedia ? (
                  <div className="relative group overflow-hidden rounded-xl md:rounded-2xl bg-muted">
                    <div className="relative h-56 sm:h-72 md:h-80 w-full overflow-hidden">
                      {isVideo ? (
                        <video
                          src={displayImage}
                          className="w-full h-full object-cover"
                          controls
                          poster={displayImage}
                        />
                      ) : (
                        <img
                          src={displayImage}
                          alt="issue"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    {/* Navigation */}
                    {hasMultipleMedia && (
                      <>
                        <button
                          onClick={handlePrevious}
                          className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 text-white p-2 md:p-3 bg-black/50 backdrop-blur-sm rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all hover:bg-black/70"
                        >
                          <ChevronLeft size={20} className="md:w-6 md:h-6" />
                        </button>
                        <button
                          onClick={handleNext}
                          className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 text-white p-2 md:p-3 bg-black/50 backdrop-blur-sm rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all hover:bg-black/70"
                        >
                          <ChevronRight size={20} className="md:w-6 md:h-6" />
                        </button>
                      </>
                    )}

                    {/* Media Counter */}
                    <div className="absolute top-2 right-2 md:top-4 md:right-4 bg-black/60 backdrop-blur-sm text-white px-2 py-1 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-medium">
                      {currentMediaIndex + 1} / {mediaCount}
                    </div>

                    {/* Video Play Indicator */}
                    {isVideo && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-black/40 backdrop-blur-sm rounded-full p-4 md:p-6">
                          <Play size={32} className="md:w-12 md:h-12 text-white ml-1" fill="white" />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-56 sm:h-72 md:h-80 rounded-xl md:rounded-2xl bg-muted flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 md:w-24 md:h-24 mx-auto mb-3 md:mb-4 rounded-full bg-muted flex items-center justify-center border border-border/50">
                        <AlertTriangle size={32} className="md:w-12 md:h-12 text-muted-foreground" />
                      </div>
                      <p className="text-sm md:text-base text-muted-foreground">No media available</p>
                    </div>
                  </div>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2 md:gap-3">
                  <div className="bg-green-500/10 rounded-xl p-2 md:p-3 text-center border border-green-500/20">
                    <div className="text-lg md:text-xl font-bold text-green-500">{confirmationCount || 0}</div>
                    <div className="text-[10px] md:text-xs text-muted-foreground">Confirmed</div>
                  </div>
                  <div className="bg-red-500/10 rounded-xl p-2 md:p-3 text-center border border-red-500/20">
                    <div className="text-lg md:text-xl font-bold text-red-500">{flagCount || 0}</div>
                    <div className="text-[10px] md:text-xs text-muted-foreground">Flagged</div>
                  </div>
                  <div className="bg-orange-500/10 rounded-xl p-2 md:p-3 text-center border border-orange-500/20">
                    <div className="text-lg md:text-xl font-bold text-orange-500">{impactScore || 0}</div>
                    <div className="text-[10px] md:text-xs text-muted-foreground">Impact</div>
                  </div>
                </div>
              </div>

              {/* Right Column - Title and Info */}
              <div className="space-y-4 md:space-y-6">

                {/* Title and Category */}
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3 md:mb-4">{title}</h3>
                  <div className="flex flex-wrap gap-2 mb-2 md:mb-4">
                    <span className="px-2.5 py-1 md:px-3 md:py-1 rounded-full bg-muted text-muted-foreground text-xs md:text-sm font-medium">
                      {category}
                    </span>
                    {priority && (
                      <span className={`px-2.5 py-1 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-medium flex items-center gap-1.5 ${priorityColors[priority]}`}>
                        <AlertTriangle size={14} className="md:w-4 md:h-4" />
                        {priority} Priority
                      </span>
                    )}
                    {subCategory && (
                      <span className="px-2.5 py-1 md:px-3 md:py-1 rounded-full bg-accent/20 text-accent text-xs md:text-sm font-medium">
                        {subCategory}
                      </span>
                    )}
                  </div>
                </div>

                {/* Location Card */}
                <div className="bg-blue-500/10 rounded-xl p-4 md:p-5 border border-blue-500/20">
                  <h4 className="text-base md:text-lg font-semibold text-foreground mb-2 md:mb-3 flex items-center gap-2">
                    <MapPin size={18} className="md:w-5 md:h-5 text-blue-500" />
                    Location
                  </h4>
                  <div className="space-y-1.5 md:space-y-2 text-sm md:text-base text-muted-foreground">
                    <p className="font-medium text-foreground">{location?.address || 'Unknown address'}</p>
                    {location?.city && (
                      <p>{location?.city}, {location?.state} {location?.pinCode}</p>
                    )}
                  </div>
                </div>

                {/* Reporter Card */}
                <div className="bg-purple-500/10 rounded-xl p-4 md:p-5 border border-purple-500/20">
                  <h4 className="text-base md:text-lg font-semibold text-foreground mb-3 md:mb-4">Reported By</h4>
                  {!isAnonymous && reportedBy ? (
                    <div className="flex items-start md:items-center gap-3 md:gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground text-sm md:text-base">{reportedBy.name}</p>
                          {reportedBy.civilScore > 100 && (
                            <div className="flex items-center gap-1 text-purple-500 bg-purple-500/10 px-1.5 py-0.5 rounded text-xs">
                              <ShieldCheck size={14} />
                              <span className="font-medium hidden sm:inline">Verified</span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs md:text-sm text-muted-foreground mt-0.5">@{reportedBy.userName}</p>
                        <div className="flex items-center gap-3 mt-2 md:mt-3 text-[11px] md:text-xs text-muted-foreground bg-background/50 p-2 rounded-lg w-fit">
                          <span>Civil: <strong className="text-foreground">{reportedBy.civilScore}</strong></span>
                          <span className="w-px h-3 bg-border"></span>
                          <span>Reports: <strong className="text-foreground">{reportedBy.issuesReported}</strong></span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm md:text-base text-muted-foreground bg-background/50 p-3 rounded-lg">
                      <User size={18} />
                      <span>Anonymous Reporter</span>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Description Section */}
            <div className="bg-muted rounded-xl md:rounded-2xl p-4 md:p-6 mb-6 md:mb-8">
              <h4 className="text-lg md:text-xl font-semibold text-foreground mb-3 md:mb-4 flex items-center gap-2">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <AlertTriangle size={14} className="md:w-4 md:h-4 text-accent" />
                </div>
                Description
              </h4>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">{description}</p>
            </div>

            {/* Timeline and Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-8">

              {/* Timeline */}
              <div className="bg-muted rounded-xl md:rounded-2xl p-4 md:p-6">
                <h4 className="text-base md:text-lg font-semibold text-foreground mb-3 md:mb-4 flex items-center gap-2">
                  <Calendar size={18} className="md:w-5 md:h-5 text-muted-foreground" />
                  Timeline
                </h4>
                <div className="space-y-2.5 md:space-y-3 text-sm md:text-base">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Reported</span>
                    <span className="text-foreground font-medium text-right">{formatDate(createdAt)}</span>
                  </div>
                  {updatedAt !== createdAt && (
                    <div className="flex justify-between items-center border-t border-border/50 pt-2.5 md:pt-3">
                      <span className="text-muted-foreground">Last Updated</span>
                      <span className="text-foreground font-medium text-right">{formatDate(updatedAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Share Info */}
              <div className="bg-muted rounded-xl md:rounded-2xl p-4 md:p-6">
                <h4 className="text-base md:text-lg font-semibold text-foreground mb-3 md:mb-4 flex items-center gap-2">
                  <Share2 size={18} className="md:w-5 md:h-5 text-muted-foreground" />
                  Engagement
                </h4>
                <div className="space-y-2.5 md:space-y-3 text-sm md:text-base">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Shares</span>
                    <span className="text-foreground font-medium">{shareCount || 0}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-border/50 pt-2.5 md:pt-3">
                    <span className="text-muted-foreground">Visibility</span>
                    <span className="text-foreground font-medium">{isPublic ? 'Public' : 'Private'}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueDetail;