import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import axiosInstance from "../utils/axios";

const ConfirmedIssues = () => {
  const dispatch = useDispatch();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [displayedIssues, setDisplayedIssues] = useState([]);

  useEffect(() => {
    fetchConfirmedIssues();
  }, [page]);

  const fetchConfirmedIssues = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/me/issues/confirmed?page=${page}&limit=10`);
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
      console.error("Error fetching confirmed issues:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  if (loading && page === 1) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading confirmed issues...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground mb-4">
        Confirmed Issues
      </h3>

      {issues.length === 0 && !loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">You haven't confirmed any issues yet</p>
        </div>
      ) : (
        <>
          <div className="space-y-4 max-h-96 overflow-y-auto thin-scrollbar">
            {displayedIssues.map((issue, index) => (
              <div key={issue._id} className="glass-card rounded-lg p-4 flex justify-between items-start hover:shadow-lg transition-all">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm text-foreground">
                      {issue.title}
                    </h4>
                    <span className="text-xs bg-green-500/10 text-green-600 border border-green-500/20 px-2 py-0.5 rounded-lg">
                      Confirmed
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground mt-1 max-w-lg leading-relaxed">
                    {issue.description}
                  </p>

                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span>⏱ {new Date(issue.createdAt).toLocaleDateString()}</span>
                    <span>💬 {issue.comments?.length || 0} comments</span>
                    <span>👍 {issue.upvotes || 0} upvotes</span>
                    <span>✅ Confirmed by admin</span>
                  </div>
                </div>

                {/* Issue Image */}
                {issue.image && (
                  <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 flex-shrink-0 ml-4">
                    <img 
                      src={issue.image} 
                      alt={issue.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {(displayedIssues.length >= 5 || issues.length > 5) && (
            <div className="flex justify-between items-center mt-6 gap-4">
              <button
                onClick={() => {
                  if (displayedIssues.length > 5) {
                    setDisplayedIssues(issues.slice(Math.max(0, displayedIssues.length - 10), Math.min(displayedIssues.length - 5, issues.length)));
                  }
                }}
                disabled={displayedIssues.length <= 5}
                className="px-4 py-2 bg-card/50 border border-border/50 rounded-lg text-foreground hover:bg-card transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-muted-foreground">
                {Math.min(displayedIssues.length, issues.length)} of {issues.length} issues
              </span>
              <button
                onClick={() => {
                  const nextIndex = Math.min(displayedIssues.length + 5, issues.length);
                  setDisplayedIssues(issues.slice(0, nextIndex));
                }}
                disabled={displayedIssues.length >= issues.length}
                className="px-4 py-2 bg-card/50 border border-border/50 rounded-lg text-foreground hover:bg-card transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ConfirmedIssues;
