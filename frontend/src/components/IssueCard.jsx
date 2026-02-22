import { MapPin, ShieldCheck, User, AlertTriangle, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useState } from "react";

const IssueCard = ({
  status,
  color,
  category,
  title,
  description,
  image,
  location,
  confirmed,
  impact,
  action,
  primary,
  verified,
  priority,
  reportedBy,
  isAnonymous,
  media,
  impactScore,
  confirmationCount,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  

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

  const hasMedia = media && media.length > 0;
  const mediaCount = hasMedia ? media.length : 0;
  const hasMultipleMedia = mediaCount > 1;

  const currentMedia = hasMedia ? media[currentImageIndex] : null;
  const displayImage = currentMedia ? currentMedia.url : image;
  const isVideo = currentMedia && (currentMedia.url?.match(/\.(mp4|webm|ogg)$/i) || currentMedia.type?.startsWith('video/'));

  const handlePrevious = () => {
    if (hasMultipleMedia) {
      setCurrentImageIndex((prev) => (prev - 1 + mediaCount) % mediaCount);
    }
  };

  const handleNext = () => {
    if (hasMultipleMedia) {
      setCurrentImageIndex((prev) => (prev + 1) % mediaCount);
    }
  };

  return (
    <div className="glass-card p-5 rounded-xl hover:shadow-lg transition-all">
      <div className="flex justify-between mb-3">
        <div className="flex gap-2 flex-wrap">
          <span className={`text-xs px-3 py-1 rounded-full ${colors[color]}`}>
            {status}
          </span>
          <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground border border-border">
            {category}
          </span>
          {priority && (
            <span className={`text-xs px-3 py-1 rounded-full ${priorityColors[priority]} flex items-center gap-1`}>
              <AlertTriangle size={12} />
              {priority}
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">2 hrs ago</span>
      </div>

      <h4 className="font-semibold text-foreground mb-2">{title}</h4>
      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{description}</p>

      <div className="relative group mb-3 overflow-hidden rounded-lg bg-muted">
        {/* Media Container */}
        <div className="relative h-48 w-full overflow-hidden">
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
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Navigation Chevrons - appear on hover when multiple images exist */}
        {hasMultipleMedia && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevious();
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 z-10 drop-shadow-lg"
              aria-label="Previous image"
            >
              <ChevronLeft size={28} strokeWidth={2.5} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 z-10 drop-shadow-lg"
              aria-label="Next image"
            >
              <ChevronRight size={28} strokeWidth={2.5} />
            </button>
          </>
        )}

        {/* Image Counter Badge */}
        {hasMedia && (
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium z-10">
            {currentImageIndex + 1} / {mediaCount}
          </div>
        )}

        {/* Dot Indicators at Bottom */}
        {hasMultipleMedia && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
            {media.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(index);
                }}
                className={`transition-all duration-300 rounded-full ${
                  index === currentImageIndex 
                    ? "w-6 h-2 bg-white shadow-lg" 
                    : "w-2 h-2 bg-white/60 hover:bg-white/80"
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Video Play Icon Indicator */}
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/40 backdrop-blur-sm rounded-full p-4">
              <Play size={32} className="text-white ml-1" fill="white" />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
        <div className="flex items-center gap-2">
          <MapPin size={14} />
          {location}
        </div>
        <div className="flex items-center gap-2">
          {isAnonymous ? (
            <span className="flex items-center gap-1 text-muted-foreground">
              <User size={14} />
              Anonymous
            </span>
          ) : reportedBy?.name ? (
            <span className="flex items-center gap-1 text-muted-foreground">
              <User size={14} />
              {reportedBy.name}
            </span>
          ) : null}
          {verified && (
            <span className="flex items-center gap-1 text-accent">
              <ShieldCheck size={14} />
              Verified
            </span>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex gap-6 text-sm">
          <span className="text-foreground">
            <strong>{confirmationCount || confirmed}</strong> Confirmed
          </span>
          <span className="text-foreground">
            <strong>{impactScore || impact}</strong> Impact
          </span>
        </div>

        <button
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            primary
              ? "btn-gradient"
              : "bg-secondary/20 text-secondary border border-secondary/30 hover:bg-secondary/30"
          }`}
        >
          {action}
        </button>
      </div>
    </div>
  );
};

export default IssueCard;