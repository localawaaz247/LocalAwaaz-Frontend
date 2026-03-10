import { X, MapPin, User, AlertTriangle, Calendar, Flag, Share2, ShieldCheck, ChevronLeft, ChevronRight, Play } from "lucide-react";
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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-6xl bg-white dark:glass-card rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden">
          {/* Content */}
          <div className="overflow-y-auto max-h-[90vh] no-scrollbar">
            <div className="p-6">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X size={20} />
              </button>

              {/* Hero Section with Media */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Left Column - Media */}
                <div className="space-y-4">
                  {hasMedia ? (
                    <div className="relative group overflow-hidden rounded-2xl bg-muted">
                      <div className="relative h-80 w-full overflow-hidden">
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
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-3 bg-black/50 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-black/70"
                          >
                            <ChevronLeft size={24} />
                          </button>
                          <button
                            onClick={handleNext}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-3 bg-black/50 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-black/70"
                          >
                            <ChevronRight size={24} />
                          </button>
                        </>
                      )}

                      {/* Media Counter */}
                      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
                        {currentMediaIndex + 1} / {mediaCount}
                      </div>

                      {/* Video Play Indicator */}
                      {isVideo && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="bg-black/40 backdrop-blur-sm rounded-full p-6">
                            <Play size={48} className="text-white ml-1" fill="white" />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-80 rounded-2xl bg-muted flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                          <AlertTriangle size={48} className="text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">No media available</p>
                      </div>
                    </div>
                  )}

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-green-500/10 rounded-xl p-3 text-center border border-green-500/20">
                      <div className="text-xl font-bold text-green-500">{confirmationCount || 0}</div>
                      <div className="text-xs text-muted-foreground">Confirmed</div>
                    </div>
                    <div className="bg-red-500/10 rounded-xl p-3 text-center border border-red-500/20">
                      <div className="text-xl font-bold text-red-500">{flagCount || 0}</div>
                      <div className="text-xs text-muted-foreground">Flagged</div>
                    </div>
                    <div className="bg-orange-500/10 rounded-xl p-3 text-center border border-orange-500/20">
                      <div className="text-xl font-bold text-orange-500">{impactScore || 0}</div>
                      <div className="text-xs text-muted-foreground">Impact</div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Title and Info */}
                <div className="space-y-6">
                  {/* Title and Category */}
                  <div>
                    <h3 className="text-3xl font-bold text-foreground mb-4">{title}</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm font-medium">
                        {category}
                      </span>
                      {priority && (
                        <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${priorityColors[priority]}`}>
                          <AlertTriangle size={14} />
                          {priority} Priority
                        </span>
                      )}
                      {subCategory && (
                        <span className="px-3 py-1 rounded-full bg-accent/20 text-accent text-sm font-medium">
                          {subCategory}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Location Card */}
                  <div className="bg-blue-500/10 rounded-xl p-5 border border-blue-500/20">
                    <h4 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                      <MapPin size={20} className="text-blue-500" />
                      Location
                    </h4>
                    <div className="space-y-2 text-muted-foreground">
                      <p className="font-medium text-foreground">{location?.address || 'Unknown address'}</p>
                      {location?.city && (
                        <p>{location?.city}, {location?.state} {location?.pinCode}</p>
                      )}
                    </div>
                  </div>

                  {/* Reporter Card */}
                  <div className="bg-purple-500/10 rounded-xl p-5 border border-purple-500/20">
                    <h4 className="text-lg font-semibold text-foreground mb-4">Reported By</h4>
                    {!isAnonymous && reportedBy ? (
                      <div className="flex items-center gap-4">
                        
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">{reportedBy.name}</p>
                          <p className="text-sm text-muted-foreground">@{reportedBy.userName}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span>Civil: <strong className="text-foreground">{reportedBy.civilScore}</strong></span>
                            <span>Reports: <strong className="text-foreground">{reportedBy.issuesReported}</strong></span>
                          </div>
                        </div>
                        {reportedBy.civilScore > 100 && (
                          <div className="flex items-center gap-1 text-purple-500">
                            <ShieldCheck size={18} />
                            <span className="font-medium text-sm">Verified</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User size={20} />
                        <span>Anonymous Reporter</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description Section */}
              <div className="bg-muted rounded-2xl p-6 mb-8">
                <h4 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                    <AlertTriangle size={16} className="text-accent" />
                  </div>
                  Description
                </h4>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-lg">{description}</p>
              </div>

              {/* Timeline and Additional Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Timeline */}
                <div className="bg-muted rounded-2xl p-6">
                  <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Calendar size={20} className="text-muted-foreground" />
                    Timeline
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Reported</span>
                      <span className="text-foreground font-medium">{formatDate(createdAt)}</span>
                    </div>
                    {updatedAt !== createdAt && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Last Updated</span>
                        <span className="text-foreground font-medium">{formatDate(updatedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Share Info */}
                <div className="bg-muted rounded-2xl p-6">
                  <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Share2 size={20} className="text-muted-foreground" />
                    Engagement
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Shares</span>
                      <span className="text-foreground font-medium">{shareCount || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
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
    </div>
  );
};

export default IssueDetail;
