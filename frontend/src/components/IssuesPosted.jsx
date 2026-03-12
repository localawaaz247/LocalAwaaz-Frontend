import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Calendar, CheckCircle, Flag, TrendingUp, Image as ImageIcon, Edit2, X, Loader2 } from "lucide-react";
import axiosInstance from "../utils/axios";
import { showToast } from "../utils/toast"; // Assuming you have a toast utility

const IssuesPosted = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [displayedIssues, setDisplayedIssues] = useState([]);

  // Edit Modal State
  const [editingIssue, setEditingIssue] = useState(null);

  useEffect(() => {
    fetchPostedIssues();
  }, [page]);

  const fetchPostedIssues = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/me/issues?page=${page}&limit=10`);
      const newIssues = res.data.data || [];

      if (page === 1) {
        setIssues(newIssues);
        setDisplayedIssues(newIssues.slice(0, 5));
      } else {
        setIssues(prev => [...prev, ...newIssues]);
        setDisplayedIssues(prev => [...prev, ...newIssues]);
      }

      setHasMore(newIssues.length === 10);
    } catch (error) {
      console.error("Error fetching posted issues:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  // Update specific issue in local state instantly after successful edit
  const handleIssueUpdated = (updatedIssue) => {
    setIssues(prev => prev.map(issue => issue._id === updatedIssue._id ? updatedIssue : issue));
    setDisplayedIssues(prev => prev.map(issue => issue._id === updatedIssue._id ? updatedIssue : issue));
    setEditingIssue(null);
  };

  // Helper for consistent status colors
  const getStatusStyles = (status) => {
    const s = status?.toUpperCase() || 'OPEN';
    if (s === 'RESOLVED') return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    if (s === 'IN_PROGRESS' || s === 'UNDER_REVIEW') return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    if (s === 'CLOSED' || s === 'REJECTED') return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    return 'bg-green-500/10 text-green-600 border-green-500/20';
  };

  if (loading && page === 1) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {issues.length === 0 && !loading ? (
        <div className="text-center py-12 bg-muted/30 rounded-xl border border-border/50">
          <p className="text-muted-foreground">You haven't posted any issues yet.</p>
        </div>
      ) : (
        <>
          <div className="space-y-4 max-h-[600px] overflow-y-auto thin-scrollbar pr-2">
            {displayedIssues.map((issue) => {
              const displayMedia = issue.media && issue.media.length > 0 ? issue.media[0].url : null;
              const isVideo = displayMedia && (displayMedia.match(/\.(mp4|webm|ogg)$/i));

              return (
                <div
                  key={issue._id}
                  onClick={() => navigate('/dashboard', { state: { selectedIssueId: issue._id } })}
                  className="glass-card rounded-xl p-4 md:p-5 flex flex-col sm:flex-row justify-between items-start gap-4 hover:shadow-md transition-all border border-border/50 cursor-pointer group relative"
                >
                  <div className="flex-1 min-w-0 w-full">

                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`text-[10px] md:text-xs px-2.5 py-1 rounded-lg border font-bold uppercase tracking-wider ${getStatusStyles(issue.status)}`}>
                          {issue.status || 'OPEN'}
                        </span>
                        <span className="text-[10px] md:text-xs px-2.5 py-1 rounded-lg bg-muted text-muted-foreground border border-border font-medium">
                          {issue.category}
                        </span>
                      </div>

                      {/* EDIT BUTTON - Only show if OPEN */}
                      {issue.status === 'OPEN' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Prevents navigating to dashboard
                            setEditingIssue(issue);
                          }}
                          className="p-1.5 md:p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Edit Issue"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                    </div>

                    <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1 pr-8">
                      {issue.title}
                    </h4>

                    <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">
                      {issue.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 mt-4 text-xs font-medium text-muted-foreground">
                      <span className="flex items-center gap-1.5" title="Reported Date">
                        <Calendar size={14} className="opacity-70" />
                        {new Date(issue.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>

                      <div className="w-px h-3 bg-border hidden sm:block"></div>

                      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400/80 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                        <CheckCircle size={14} />
                        {issue.confirmationCount || 0} Confirmed
                      </span>

                      <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400/80 bg-rose-500/10 px-2 py-0.5 rounded-md">
                        <Flag size={14} />
                        {issue.flagCount || 0} Flags
                      </span>

                      <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded-md">
                        <TrendingUp size={14} />
                        {issue.impactScore || 0} Impact
                      </span>
                    </div>
                  </div>

                  {/* Issue Image / Media Thumbnail */}
                  <div className="w-full sm:w-28 sm:h-28 h-40 rounded-xl bg-muted flex-shrink-0 sm:ml-2 overflow-hidden border border-border/50 relative">
                    {displayMedia ? (
                      isVideo ? (
                        <video src={displayMedia} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                      ) : (
                        <img src={displayMedia} alt={issue.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      )
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/50">
                        <ImageIcon size={24} />
                        <span className="text-[10px] mt-1 font-medium">No Media</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {(displayedIssues.length >= 5 || issues.length > 5) && (
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-border/50 gap-4">
              <button
                onClick={() => {
                  if (displayedIssues.length > 5) {
                    setDisplayedIssues(issues.slice(Math.max(0, displayedIssues.length - 10), Math.min(displayedIssues.length - 5, issues.length)));
                  }
                }}
                disabled={displayedIssues.length <= 5}
                className="px-4 py-2 bg-card/50 border border-border/50 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-xs md:text-sm font-medium text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                {Math.min(displayedIssues.length, issues.length)} of {issues.length} issues
              </span>
              <button
                onClick={() => {
                  const nextIndex = Math.min(displayedIssues.length + 5, issues.length);
                  setDisplayedIssues(issues.slice(0, nextIndex));
                  if (nextIndex >= issues.length && hasMore) {
                    loadMore();
                  }
                }}
                disabled={displayedIssues.length >= issues.length && !hasMore}
                className="px-4 py-2 bg-card/50 border border-border/50 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Render Edit Modal if an issue is selected */}
      {editingIssue && (
        <EditIssueModal
          issue={editingIssue}
          onClose={() => setEditingIssue(null)}
          onSuccess={handleIssueUpdated}
        />
      )}
    </div>
  );
};

// --- NEW EDIT MODAL COMPONENT ---
const EditIssueModal = ({ issue, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: issue.title,
    category: issue.category,
    description: issue.description,
  });
  const [isSaving, setIsSaving] = useState(false);

  const categories = [
    "SAFETY", "HEALTH", "CORRUPTION", "WATER_SUPPLY", "ELECTRICITY",
    "EDUCATION", "SANITATION", "ROAD_&_POTHOLES", "GARBAGE", "STREET_LIGHTS", "TRAFFIC"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Patch to the specific issue ID route
      const response = await axiosInstance.patch(`/issue/${issue._id}`, formData);
      if (response.data.success) {
        showToast({ icon: "success", title: "Issue updated successfully!" });
        onSuccess(response.data.issue); // Pass updated issue back to parent
      }
    } catch (error) {
      console.error("Update failed:", error);
      showToast({ icon: "error", title: error?.response?.data?.message || "Failed to update issue" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-card glass-card border border-border/50 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 md:p-6 border-b border-border/50">
          <h3 className="text-xl font-bold text-foreground">Edit Issue</h3>
          <button onClick={onClose} className="p-2 rounded-full text-muted-foreground hover:bg-muted transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 md:p-6 overflow-y-auto thin-scrollbar flex-1">
          <form id="edit-issue-form" onSubmit={handleSubmit} className="space-y-5">

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-muted-foreground ml-1">Issue Title <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder="Brief title of the issue"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-muted-foreground ml-1">Category <span className="text-red-500">*</span></label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
              >
                <option value="" disabled>Select a category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-muted-foreground ml-1">Description <span className="text-red-500">*</span></label>
              <textarea
                required
                rows={5}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors resize-none"
                placeholder="Provide details about the issue..."
              />
            </div>

            <p className="text-xs text-muted-foreground italic ml-1">
              Note: To update location or media, please delete and report a new issue.
            </p>

          </form>
        </div>

        {/* Modal Footer */}
        <div className="p-4 md:p-6 border-t border-border/50 bg-muted/20 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 py-3 rounded-xl font-semibold border border-border bg-card hover:bg-muted transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-issue-form"
            disabled={isSaving || !formData.title || !formData.category || !formData.description}
            className="flex-1 btn-gradient py-3 rounded-xl font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 text-sm"
          >
            {isSaving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            ) : "Save Changes"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default IssuesPosted;