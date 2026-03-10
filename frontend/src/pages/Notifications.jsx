
import { useNotifications } from "../hooks/useNotifications";
import { useSelector } from "react-redux";
import { Bell, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Notifications = () => {
  const user = useSelector((state) => state.auth?.user);
  const { notifications, unreadCount, markAsRead, loading } = useNotifications(user);
  const navigate = useNavigate();

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

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'ISSUE_CONFIRMED':
        return '✅';
      case 'ISSUE_FLAGGED':
        return '🚩';
      case 'ISSUE_SHARED':
        return '🔄';
      case 'ISSUE_RESOLVED':
        return '✨';
      case 'ISSUE_CREATED':
        return '📝';
      case 'COMMENT':
        return '💬';
      case 'MENTION':
        return '@';
      case 'LIKE':
        return '❤️';
      default:
        return '🔔';
    }
  };

  const getNotificationMessage = (notification) => {
    const { type, sender, issue } = notification;
    const senderName = sender?.name || 'Someone';
    const issueTitle = issue?.title || 'an issue';

    switch (type) {
      case 'ISSUE_CONFIRMED':
        return `${senderName} confirmed your issue "${issueTitle}"`;
      case 'ISSUE_FLAGGED':
        return `${senderName} flagged your issue "${issueTitle}"`;
      case 'ISSUE_SHARED':
        return `${senderName} shared your issue "${issueTitle}"`;
      case 'ISSUE_RESOLVED':
        return `Your issue "${issueTitle}" has been resolved`;
      case 'ISSUE_CREATED':
        return `${senderName} reported a new issue "${issueTitle}"`;
      case 'COMMENT':
        return `${senderName} commented on "${issueTitle}"`;
      case 'MENTION':
        return `${senderName} mentioned you in "${issueTitle}"`;
      case 'LIKE':
        return `${senderName} liked your issue "${issueTitle}"`;
      default:
        return notification.message || `${senderName} sent you a notification`;
    }
  };

  return (
    <div className="min-h-screen bg-texture flex justify-center py-10">
      <div className="w-full max-w-4xl px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-primary to-secondary flex items-center justify-center shadow-lg">
              <Bell className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gradient mb-2">
                Notifications
              </h1>
              <p className="text-sm text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} unread notifications` : "All caught up!"}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button 
              onClick={markAsRead}
              className="flex items-center gap-2 text-sm font-medium text-accent/80 hover:text-accent transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Mark all as read
            </button>
          )}
        </div>

        {/* Notification List */}
        <div className="glass-card rounded-xl divide-y divide-border">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mb-4"></div>
              <p className="text-muted-foreground">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Bell className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No notifications yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                We'll notify you when something important happens
              </p>
            </div>
          ) : (
            notifications.map((notification, index) => (
              <div
                key={notification._id || index}
                className={`flex items-start gap-3 px-4 py-4 hover:bg-muted/50 transition-colors ${
                  !notification.isRead ? 'bg-primary/5' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white font-bold flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    {getNotificationMessage(notification)}
                  </p>
                  {notification.issue && (
                    <p className="text-xs text-accent mt-1">
                      Status: {notification.issue.status}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatTimeAgo(notification.createdAt)}
                  </span>
                  {!notification.isRead && (
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Links */}
        <div className="flex justify-center gap-4 text-sm text-accent mt-6">
          <button 
            onClick={() => navigate('/dashboard')}
            className="hover:text-accent/80 transition-colors"
          >
            Back to Dashboard
          </button>
          <span>•</span>
          <button className="hover:text-accent/80 transition-colors">Settings</button>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
