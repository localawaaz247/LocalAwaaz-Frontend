import React, { useState, useEffect, useRef } from "react";
import { useNotifications } from "../hooks/useNotifications";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Bell, CheckCircle, Flag, Share2, Sparkles,
  FileText, MessageSquare, AtSign, Heart, Trash2
} from "lucide-react";

// --- Skeleton Loader Component ---
const NotificationSkeleton = () => {
  return (
    <div className="flex flex-col gap-3 w-full">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-start gap-4 p-5 w-full bg-background/40 border border-border/50 rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-muted/40 animate-pulse flex-shrink-0" />
          <div className="flex-1 min-w-0 pt-1 space-y-3">
            <div className="h-4 bg-muted/40 rounded w-3/4 animate-pulse" />
            <div className="h-3 bg-muted/40 rounded w-1/2 animate-pulse" />
          </div>
          <div className="flex flex-col items-end pt-1 h-full min-h-[48px]">
            <div className="w-10 h-3 bg-muted/40 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
};

const Notifications = () => {
  const user = useSelector((state) => state.auth?.user);

  const {
    notifications,
    unreadCount,
    markAsRead,
    loading,
    deleteNotification,
    clearAllNotifications
  } = useNotifications(user);

  const navigate = useNavigate();
  const prevNotifCount = useRef(notifications?.length || 0);
  const isFirstLoad = useRef(true);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const animationTimer = requestAnimationFrame(() => {
      setIsMounted(true);
    });
    return () => cancelAnimationFrame(animationTimer);
  }, []);

  useEffect(() => {
    if (isFirstLoad.current) {
      if (!loading && notifications) {
        prevNotifCount.current = notifications.length;
        isFirstLoad.current = false;
      }
      return;
    }

    if (notifications && notifications.length > prevNotifCount.current) {
      const audio = new Audio('/ting.mp3');
      audio.play().catch((err) => {
        console.log("Audio autoplay prevented by browser.", err);
      });
    }

    prevNotifCount.current = notifications?.length || 0;
  }, [notifications, loading]);

  const handleNotificationClick = (notification) => {
    if (notification.issue?._id) {
      navigate('/dashboard', {
        state: { selectedIssueId: notification.issue._id }
      });
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMs = now - notificationTime;
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMins < 1) return "Just now";
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${diffInDays}d ago`;
  };

  const getNotificationStyle = (type) => {
    switch (type) {
      case 'ISSUE_CONFIRMED': return { icon: <CheckCircle className="w-5 h-5 text-emerald-500" />, bg: 'bg-emerald-500/10' };
      case 'ISSUE_FLAGGED': return { icon: <Flag className="w-5 h-5 text-rose-500" />, bg: 'bg-rose-500/10' };
      case 'ISSUE_SHARED': return { icon: <Share2 className="w-5 h-5 text-blue-500" />, bg: 'bg-blue-500/10' };
      case 'ISSUE_RESOLVED': return { icon: <Sparkles className="w-5 h-5 text-amber-500" />, bg: 'bg-amber-500/10' };
      case 'ISSUE_CREATED': return { icon: <FileText className="w-5 h-5 text-indigo-500" />, bg: 'bg-indigo-500/10' };
      case 'COMMENT': return { icon: <MessageSquare className="w-5 h-5 text-purple-500" />, bg: 'bg-purple-500/10' };
      case 'MENTION': return { icon: <AtSign className="w-5 h-5 text-cyan-500" />, bg: 'bg-cyan-500/10' };
      case 'LIKE': return { icon: <Heart className="w-5 h-5 text-pink-500" />, bg: 'bg-pink-500/10' };
      default: return { icon: <Bell className="w-5 h-5 text-slate-500" />, bg: 'bg-slate-500/10' };
    }
  };

  const getNotificationMessage = (notification) => {
    const { type, sender, issue } = notification;
    const senderName = sender?.name || 'Someone';
    const issueTitle = issue?.title || 'an issue';

    const Name = () => <span className="font-semibold text-foreground">{senderName}</span>;
    const Title = () => <span className="font-medium text-foreground">"{issueTitle}"</span>;

    switch (type) {
      case 'ISSUE_CONFIRMED': return <><Name /> confirmed your issue <Title /></>;
      case 'ISSUE_FLAGGED': return <><Name /> flagged your issue <Title /></>;
      case 'ISSUE_SHARED': return <><Name /> shared your issue <Title /></>;
      case 'ISSUE_RESOLVED': return <>Your issue <Title /> has been resolved</>;
      case 'ISSUE_CREATED': return <><Name /> reported a new issue <Title /></>;
      case 'COMMENT': return <><Name /> commented on <Title /></>;
      case 'MENTION': return <><Name /> mentioned you in <Title /></>;
      case 'LIKE': return <><Name /> liked your issue <Title /></>;
      default: return notification.message || <><Name /> sent you a notification</>;
    }
  };

  return (
    // 1. Strict Outer Container: Locks to viewport height, kills global scrollbars
    <div className="h-[100dvh] w-full bg-texture flex flex-col overflow-hidden">

      {/* 2. Inner Scrollable Container: Handles the overflow internally */}
      <div
        className={`flex-1 overflow-y-auto w-full flex justify-center pt-6 pb-24 md:pt-10 transition-all duration-500 ease-out ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
      >
        {/* Added h-max so this wrapper only takes up as much height as its content needs */}
        <div className="w-full max-w-3xl px-4 flex flex-col h-max">

          {/* Header Section */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-xl shadow-primary/20 flex-shrink-0">
                <Bell className="w-6 h-6 md:w-7 md:h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-foreground mb-1">
                  Notifications
                </h1>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">
                  {unreadCount > 0
                    ? <span className="text-primary">{unreadCount} unread messages</span>
                    : "You're all caught up!"}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 md:gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={markAsRead}
                  className="group flex items-center gap-1.5 px-3 py-1.5 md:px-3.5 md:py-2 rounded-full bg-muted/50 text-[10px] md:text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 shadow-sm"
                >
                  <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 group-hover:scale-110 transition-transform" />
                  Mark read
                </button>
              )}
              {notifications?.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="group flex items-center gap-1.5 px-3 py-1.5 md:px-3.5 md:py-2 rounded-full bg-red-500/10 text-[10px] md:text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-500/20 transition-all duration-200 shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4 group-hover:scale-110 transition-transform" />
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Notifications Directly Rendered */}
          <div className="w-full">
            {loading ? (
              <NotificationSkeleton />
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4 w-full">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-muted/50 rounded-full flex items-center justify-center mb-6">
                  <Bell className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground/50" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">No notifications yet</h3>
                <p className="text-xs md:text-sm text-muted-foreground max-w-sm">
                  When there is activity on your issues or someone mentions you, it will show up right here.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {notifications.map((notification, index) => {
                  const style = getNotificationStyle(notification.type);

                  return (
                    <div
                      key={notification._id || index}
                      onClick={() => handleNotificationClick(notification)}
                      className={`group relative flex items-start gap-3 md:gap-4 p-4 md:p-5 cursor-pointer bg-background/60 backdrop-blur-md border border-border/50 rounded-2xl shadow-sm hover:bg-muted/40 transition-all duration-200 ${!notification.isRead ? 'ring-1 ring-primary/50' : ''
                        }`}
                    >
                      {/* Unread Indicator Dot */}
                      {!notification.isRead && (
                        <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-8 bg-primary rounded-r-full shadow-[0_0_8px_rgba(var(--primary),0.5)]"></div>
                      )}

                      {/* Dynamic Icon */}
                      <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${style.bg}`}>
                        {style.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-0.5 md:pt-1">
                        <p className="text-sm md:text-[15px] leading-relaxed text-foreground">
                          {getNotificationMessage(notification)}
                        </p>
                        {notification.issue && (
                          <div className="flex items-center gap-2 mt-1.5 md:mt-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] md:text-xs font-medium bg-muted text-muted-foreground">
                              {notification.issue.status}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Timestamp & Delete Button */}
                      <div className="flex flex-col items-end justify-between gap-2 flex-shrink-0 pt-0.5 md:pt-1 h-full min-h-[40px] md:min-h-[48px]">
                        <div className="flex items-center gap-1.5 md:gap-2">
                          {!notification.isRead && (
                            <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-primary rounded-full ring-4 ring-primary/20"></div>
                          )}
                          <span className="text-[10px] md:text-xs font-medium text-muted-foreground/70 whitespace-nowrap">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (deleteNotification) deleteNotification(notification._id);
                          }}
                          className="p-1 md:p-1.5 text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all duration-200 opacity-60 md:opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Delete notification"
                        >
                          <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;