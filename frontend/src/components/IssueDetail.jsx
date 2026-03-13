import { X, MapPin, User, AlertTriangle, Calendar, ShieldCheck, ChevronLeft, ChevronRight, Play, Flag, CheckCircle, FileText, Copy, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axiosInstance from "../utils/axios";
import { showToast } from "../utils/toast";

const WhatsappIcon = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.305-.885-.653-1.482-1.459-1.655-1.756-.173-.298-.019-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
  </svg>
);

const IssueDetail = ({ issue, isOpen, onClose, onFlagClick }) => {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const currentUser = useSelector((state) => state.auth?.user);

  const [localShareCount, setLocalShareCount] = useState(0);
  const [localFlagCount, setLocalFlagCount] = useState(0);
  const [localConfirmationCount, setLocalConfirmationCount] = useState(0);
  const [isConfirmedByUser, setIsConfirmedByUser] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const {
    _id, title, category, status, priority, description, location,
    isAnonymous, reportedBy, media, impactScore, createdAt, isPublic,
    confirmations, hasConfirmed
  } = issue || {};

  useEffect(() => {
    if (isOpen && issue) {
      setCurrentMediaIndex(0);
      setLocalShareCount(issue.shareCount || 0);
      setLocalFlagCount(issue.flagCount || 0);
      setLocalConfirmationCount(issue.confirmationCount || 0);
      setIsCopied(false);

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

  const statusColors = {
    OPEN: "bg-green-100 text-green-700 border border-green-200",
    IN_PROGRESS: "bg-yellow-100 text-yellow-700 border border-yellow-200",
    RESOLVED: "bg-blue-100 text-blue-700 border border-blue-200",
    CLOSED: "bg-gray-100 text-gray-700 border border-gray-200",
    UNDER_REVIEW: "bg-orange-100 text-orange-700 border border-orange-200"
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
    if (hasMultipleMedia) setCurrentMediaIndex((prev) => (prev - 1 + mediaCount) % mediaCount);
  };

  const handleNext = () => {
    if (hasMultipleMedia) setCurrentMediaIndex((prev) => (prev + 1) % mediaCount);
  };

  const incrementShare = async () => {
    try {
      await axiosInstance.put(`/issue/${_id}/share`);
    } catch (err) {
      console.log("Share update handled/throttled by backend:", err.message);
    }
  };

  const handleWhatsappShare = () => {
    setLocalShareCount(prev => prev + 1);
    incrementShare();

    const url = `${window.location.origin}/issue/${_id}`;
    const text = encodeURIComponent(`Check out this issue on LocalAwaaz: ${title}\n\n${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleCopyLink = () => {
    setLocalShareCount(prev => prev + 1);
    incrementShare();

    const url = `${window.location.origin}/issue/${_id}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    showToast({ icon: 'success', title: 'Link copied to clipboard!' });

    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleConfirm = async () => {
    if (!_id) return;
    try {
      setConfirmLoading(true);
      const coords = JSON.parse(localStorage.getItem('cached_geo_location')) || JSON.parse(localStorage.getItem('currentLocation'));
      const longitude = coords?.longitude;
      const latitude = coords?.latitude;

      let url = `/issue/${_id}/confirm`;
      if (longitude && latitude) {
        url += `?lng=${longitude}&lat=${latitude}`;
      }

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
        showToast({
          icon: 'error',
          title: error.response?.data?.message || 'Action completed or already applied.'
        });
      }
    } finally {
      setConfirmLoading(false);
    }
  };

  function formatDate(isoDate) {
    if (!isoDate) return "";
    const date = new Date(isoDate);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
  }

  const safeStatus = status?.toUpperCase() || 'OPEN';
  const statusBadgeColor = statusColors[safeStatus] || statusColors.OPEN;

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 transition-all duration-300 ease-in-out ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
    >
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"
          }`}
        onClick={onClose}
      />

      <div
        className={`relative w-full max-w-4xl bg-card dark:glass-card rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col transform transition-all duration-400 ease-out border border-border/50 ${isOpen ? "translate-y-0 sm:scale-100 opacity-100" : "translate-y-full sm:translate-y-8 sm:scale-95 opacity-0"
          }`}
      >
        {issue && (
          <>
            <div className="flex justify-between items-center p-4 md:px-6 border-b border-border/50 bg-background/80 backdrop-blur-xl z-20 rounded-t-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2.5 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider ${statusBadgeColor}`}>
                  {safeStatus}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border text-[10px] md:text-xs font-medium">
                  {category}
                </span>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-full bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border/50 flex-shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto w-full no-scrollbar p-4 md:p-6 flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-8 mb-6 md:mb-8">
                <div className="space-y-4">
                  {hasMedia ? (
                    <div className="relative group overflow-hidden rounded-xl md:rounded-2xl bg-muted ring-1 ring-border/50">
                      <div className="relative h-56 sm:h-72 md:h-[340px] w-full overflow-hidden">
                        {isVideo ? (
                          <video key={displayImage} src={displayImage} className="w-full h-full object-cover" controls poster={displayImage} />
                        ) : (
                          <img key={displayImage} src={displayImage} alt="issue" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                      </div>

                      {hasMultipleMedia && (
                        <>
                          <button onClick={handlePrevious} className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 text-white p-2 md:p-3 bg-black/50 backdrop-blur-sm rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all hover:bg-black/80 hover:scale-110">
                            <ChevronLeft size={20} className="md:w-6 md:h-6" />
                          </button>
                          <button onClick={handleNext} className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 text-white p-2 md:p-3 bg-black/50 backdrop-blur-sm rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all hover:bg-black/80 hover:scale-110">
                            <ChevronRight size={20} className="md:w-6 md:h-6" />
                          </button>
                        </>
                      )}

                      {hasMultipleMedia && (
                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-xs font-medium">
                          {currentMediaIndex + 1} / {mediaCount}
                        </div>
                      )}

                      {isVideo && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="bg-black/40 backdrop-blur-md rounded-full p-4 md:p-6 shadow-lg border border-white/10">
                            <Play size={32} className="md:w-12 md:h-12 text-white ml-1" fill="white" />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-56 sm:h-72 md:h-[340px] rounded-xl md:rounded-2xl bg-muted flex items-center justify-center ring-1 ring-border/50">
                      <div className="text-center opacity-60">
                        <AlertTriangle size={48} className="mx-auto mb-4 text-muted-foreground" />
                        <p className="text-sm md:text-base font-medium">No media provided</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-5 md:space-y-6 flex flex-col justify-center">
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3 leading-tight tracking-tight">
                      {title}
                    </h3>
                    {priority && (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs md:text-sm font-semibold ${priorityColors[priority]}`}>
                        <AlertTriangle size={14} /> {priority} Priority
                      </span>
                    )}
                  </div>

                  <div className="bg-blue-500/10 rounded-xl p-4 md:p-5 border border-blue-500/20">
                    <h4 className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                      <MapPin size={16} /> Location
                    </h4>
                    <div className="space-y-1 text-sm md:text-base text-foreground font-medium">
                      <p>{location?.address || 'Address not specified'}</p>
                      {location?.city && <p className="text-muted-foreground font-normal">{location?.city}, {location?.state} {location?.pinCode}</p>}
                    </div>
                  </div>

                  <div className="bg-purple-500/10 rounded-xl p-4 md:p-5 border border-purple-500/20">
                    <h4 className="text-sm font-bold text-purple-600 dark:text-purple-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                      <User size={16} /> Reported By
                    </h4>
                    {!isAnonymous && reportedBy ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-foreground text-base">{reportedBy.name}</p>
                          {reportedBy.civilScore > 100 && (
                            <span className="flex items-center gap-1 text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                              <ShieldCheck size={12} /> Verified
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">@{reportedBy.userName}</p>
                        <div className="items-center gap-3 mt-2 text-xs text-muted-foreground bg-background/50 p-2.5 rounded-lg border border-border/50 inline-flex w-fit">
                          <span>Civil Score: <strong className="text-foreground">{reportedBy.civilScore}</strong></span>
                          <span className="w-px h-3 bg-border"></span>
                          <span>Reports: <strong className="text-foreground">{reportedBy.issuesReported}</strong></span>
                        </div>
                      </div>
                    ) : (
                      <div className="items-center gap-2 text-sm text-muted-foreground bg-background/50 border border-border/50 p-3 rounded-lg inline-flex">
                        <User size={16} /> <span className="font-medium">Anonymous Citizen</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-muted/30 rounded-2xl p-5 md:p-6 mb-6 md:mb-8 border border-border/50">
                <h4 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                  <FileText size={18} className="text-accent" /> Description
                </h4>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {description}
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4">
                <div className="bg-background border border-border/50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-black text-green-500 mb-1">{localConfirmationCount}</div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Confirmations</div>
                </div>
                <div className="bg-background border border-border/50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-black text-orange-500 mb-1">{impactScore || 0}</div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Impact Score</div>
                </div>
                <div className="bg-background border border-border/50 rounded-xl p-4 text-center">
                  <div className="text-sm font-bold text-foreground mb-1 mt-1 truncate">{formatDate(createdAt)}</div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reported</div>
                </div>
                <div className="bg-background border border-border/50 rounded-xl p-4 text-center">
                  <div className="text-sm font-bold text-foreground mb-1 mt-1 truncate">{isPublic ? 'Public' : 'Private'}</div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Visibility</div>
                </div>
              </div>
            </div>

            <div className="p-4 md:px-6 border-t border-border/50 bg-background/80 backdrop-blur-xl z-20 rounded-b-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                <div className="text-sm text-muted-foreground font-medium flex gap-3">
                  <span><strong>{localShareCount}</strong> Shares</span>
                  <span>•</span>
                  <span><strong>{localFlagCount}</strong> Flags</span>
                </div>

                <div className="flex items-center gap-2 pl-3 border-l border-border/50">
                  <button
                    onClick={handleWhatsappShare}
                    className="p-2 rounded-full bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white transition-all shadow-sm"
                    title="Share to WhatsApp"
                  >
                    <WhatsappIcon size={18} />
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className={`p-2 rounded-full transition-all shadow-sm ${isCopied ? "bg-green-500 text-white" : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 border border-border"}`}
                    title="Copy Link"
                  >
                    {isCopied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => {
                    if (onFlagClick) onFlagClick(issue);
                    onClose();
                  }}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all bg-red-100 text-red-700 hover:bg-red-200 border border-red-200"
                >
                  <Flag size={16} /> Flag
                </button>

                <button
                  onClick={handleConfirm}
                  disabled={confirmLoading}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap shadow-md hover:shadow-lg ${isConfirmedByUser
                    ? "bg-green-500/20 text-green-600 border border-green-500/30 hover:bg-green-500/30"
                    : safeStatus === 'OPEN'
                      ? "btn-gradient text-white"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                    }`}
                >
                  {confirmLoading ? (
                    <span className="animate-pulse">Confirming...</span>
                  ) : isConfirmedByUser ? (
                    <><CheckCircle size={18} /> Confirmed</>
                  ) : (
                    <><CheckCircle size={18} /> I Confirm This</>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default IssueDetail;