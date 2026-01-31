import React from "react";

const notifications = [
  {
    name: "Sarah Johnson",
    action: "commented on your post",
    message: "Loved the way you highlighted the local issue!",
    time: "2m ago",
    avatar: "https://i.pravatar.cc/40?img=1",
  },
  {
    name: "Michael Chen",
    action: "liked your report",
    message: "Road Repair Request · Ward 12",
    time: "15m ago",
    avatar: "https://i.pravatar.cc/40?img=2",
  },
  {
    name: "Emma Wilson",
    action: "mentioned you in a comment",
    message: "@localAwaaz What do you think about this?",
    time: "1h ago",
    avatar: "https://i.pravatar.cc/40?img=3",
  },
  {
    name: "David Park",
    action: "started following you",
    message: "Check their profile",
    time: "3h ago",
    avatar: "https://i.pravatar.cc/40?img=4",
  },
  {
    name: "Lisa Anderson",
    action: "shared your post",
    message: "Water Supply Issue · Sector 9",
    time: "5h ago",
    avatar: "https://i.pravatar.cc/40?img=5",
  },
  {
    name: "James Taylor",
    action: "liked your comment",
    message: "“This needs urgent attention.”",
    time: "8h ago",
    avatar: "https://i.pravatar.cc/40?img=6",
  },
  {
    name: "Rachel Green",
    action: "mentioned you in a report",
    message: "Garbage Collection Delay",
    time: "1d ago",
    avatar: "https://i.pravatar.cc/40?img=7",
  },
  {
    name: "Tom Harris",
    action: "commented on your post",
    message: "Great explanation of the problem!",
    time: "1d ago",
    avatar: "https://i.pravatar.cc/40?img=8",
  },
  {
    name: "Nina Patel",
    action: "liked your report",
    message: "Street Light Not Working",
    time: "2d ago",
    avatar: "https://i.pravatar.cc/40?img=9",
  },
  {
    name: "Chris Martinez",
    action: "started following you",
    message: "Community Volunteer",
    time: "2d ago",
    avatar: "https://i.pravatar.cc/40?img=10",
  },
];

const Notifications = () => {
  return (
    <div className="min-h-screen bg-texture flex justify-center py-10">
      <div className="w-full max-w-4xl px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gradient mb-2">
              Notifications
            </h1>
            <p className="text-sm text-muted-foreground">
              Stay updated with your local activity
            </p>
          </div>
          <button className="text-sm font-medium text-accent/80 hover:text-accent transition-colors">
            Mark all as read
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <button className="btn-gradient px-4 py-1.5 text-sm rounded-full">
            All
          </button>
          <button className="px-4 py-1.5 text-sm rounded-full bg-card border border-border text-card-foreground hover:bg-muted transition-colors">
            Mentions
          </button>
          <button className="px-4 py-1.5 text-sm rounded-full bg-card border border-border text-card-foreground hover:bg-muted transition-colors">
            Likes
          </button>
        </div>

        {/* Notification List */}
        <div className="glass-card rounded-xl divide-y divide-border">
          {notifications.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-3 px-4 py-4 hover:bg-muted/50 transition-colors"
            >
              <img
                src={item.avatar}
                alt={item.name}
                className="w-10 h-10 rounded-full"
              />

              <div className="flex-1">
                <p className="text-sm text-foreground">
                  <span className="font-semibold text-foreground">{item.name}</span>{" "}
                  <span className="text-muted-foreground">{item.action}</span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">{item.message}</p>
              </div>

              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {item.time}
              </span>
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="flex justify-center mt-6">
          <button className="px-6 py-2 text-sm border border-border rounded-lg bg-card text-card-foreground hover:bg-muted transition-colors">
            Load More Notifications
          </button>
        </div>

        {/* Footer Links */}
        <div className="flex justify-center gap-4 text-sm text-accent mt-6">
          <button className="hover:text-accent/80 transition-colors">Back to Profile</button>
          <span>•</span>
          <button className="hover:text-accent/80 transition-colors">Edit Profile</button>
          <span>•</span>
          <button className="hover:text-accent/80 transition-colors">Settings</button>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
