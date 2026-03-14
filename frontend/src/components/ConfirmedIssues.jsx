import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Calendar, CheckCircle, Flag, TrendingUp, Image as ImageIcon, ShieldCheck } from "lucide-react";
import axiosInstance from "../utils/axios";
import { useTranslation } from "react-i18next";

const ConfirmedIssues = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

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
          <p className="text-muted-foreground">{t('no_confirmed_issues')}</p>
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
                  className="glass-card rounded-xl p-4 md:p-5 flex flex-col sm:flex-row justify-between items-start gap-4 hover:shadow-md transition-all border border-border/50 cursor-pointer group"
                >
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`text-[10px] md:text-xs px-2.5 py-1 rounded-lg border font-bold uppercase tracking-wider ${getStatusStyles(issue.status)}`}>
                        {issue.status || 'OPEN'}
                      </span>
                      <span className="text-[10px] md:text-xs px-2.5 py-1 rounded-lg bg-muted text-muted-foreground border border-border font-medium">
                        {issue.category}
                      </span>
                      <span className="text-[10px] md:text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold flex items-center gap-1">
                        <ShieldCheck size={12} /> {t('you_confirmed')}
                      </span>
                    </div>

                    <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1">
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
                        {issue.confirmationCount || 0} {t('confirmed')}
                      </span>
                      
                      <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400/80 bg-rose-500/10 px-2 py-0.5 rounded-md">
                        <Flag size={14} /> 
                        {issue.flagCount || 0} {t('flags')}
                      </span>
                      
                      <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded-md">
                        <TrendingUp size={14} /> 
                        {issue.impactScore || 0} {t('impact')}
                      </span>
                    </div>
                  </div>

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
                        <span className="text-[10px] mt-1 font-medium">{t('no_media')}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

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
                {t('previous')}
              </button>
              <span className="text-xs md:text-sm font-medium text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                {Math.min(displayedIssues.length, issues.length)} {t('of')} {issues.length} {t('issues_label')}
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
                {t('next')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ConfirmedIssues;