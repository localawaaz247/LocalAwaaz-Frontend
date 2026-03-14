import React, { useEffect, useRef } from "react";
import { useNotifications } from "../hooks/useNotifications";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Bell, CheckCircle, Flag, Share2, Sparkles,
  FileText, MessageSquare, AtSign, Heart, Trash2
} from "lucide-react";

const Notifications = () => {
  const user = useSelector((state) => state.auth?.user);

  // Destructuring all functions and states from your custom hook
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

  // Play sound when a new notification drops
  useEffect(() => {
    if (notifications && notifications.length > prevNotifCount.current) {
      const audio = new Audio('/ting.mp3');
      audio.play().catch((err) => {
        console.log("Audio autoplay prevented by browser until user interacts.", err);
      });
    }
    prevNotifCount.current = notifications?.length || 0;
  }, [notifications]);

  // Click handler: Navigates to dashboard and passes the issue ID to open the modal
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
    <div className="min-h-screen bg-texture flex justify-center py-10">
      <div className="w-full max-w-3xl px-4">

        {/* Header Section */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-xl shadow-primary/20 flex-shrink-0">
              <Bell className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-1">
                Notifications
              </h1>
              <p className="text-sm font-medium text-muted-foreground">
                {unreadCount > 0
                  ? <span className="text-primary">{unreadCount} unread messages</span>
                  : "You're all caught up!"}
              </p>
            </div>
          </div>

          {/* Action Buttons (Mark Read & Clear All) */}
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAsRead}
                className="group flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-muted/50 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 shadow-sm"
              >
                <CheckCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Mark read
              </button>
            )}
            {notifications?.length > 0 && (
              <button
                onClick={clearAllNotifications}
                className="group flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-red-500/10 text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-500/20 transition-all duration-200 shadow-sm"
              >
                <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Notification List Container */}
        <div className="glass-card rounded-2xl shadow-sm border border-border/50 overflow-hidden bg-background/50 backdrop-blur-xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground font-medium animate-pulse">Fetching updates...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center px-4">
              <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-6">
                <Bell className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No notifications yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                When there is activity on your issues or someone mentions you, it will show up right here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {notifications.map((notification, index) => {
                const style = getNotificationStyle(notification.type);

                return (
                  <div
                    key={notification._id || index}
                    onClick={() => handleNotificationClick(notification)}
                    className={`group relative flex items-start gap-4 p-5 cursor-pointer hover:bg-muted/30 transition-all duration-200 ${!notification.isRead ? 'bg-primary/5' : ''
                      }`}
                  >
                    {/* Unread Indicator Pill */}
                    {!notification.isRead && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-primary rounded-r-full shadow-[0_0_8px_rgba(var(--primary),0.5)]"></div>
                    )}

                    {/* Dynamic Icon */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${style.bg}`}>
                      {style.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-1">
                      <p className="text-[15px] leading-relaxed text-muted-foreground">
                        {getNotificationMessage(notification)}
                      </p>
                      {notification.issue && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                            {notification.issue.status}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Timestamp & Delete Button */}
                    <div className="flex flex-col items-end justify-between gap-2 flex-shrink-0 pt-1 h-full min-h-[48px]">
                      <div className="flex items-center gap-2">
                        {!notification.isRead && (
                          <div className="w-2.5 h-2.5 bg-primary rounded-full ring-4 ring-primary/20"></div>
                        )}
                        <span className="text-xs font-medium text-muted-foreground/70 whitespace-nowrap">
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                      </div>

                      {/* Individual Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevents navigating to the dashboard when deleting
                          if (deleteNotification) deleteNotification(notification._id);
                        }}
                        className="p-1.5 text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all duration-200 opacity-60 md:opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Delete notification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Links */}
        <div className="flex justify-center items-center gap-6 text-sm font-medium text-muted-foreground mt-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="hover:text-primary transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notifications;