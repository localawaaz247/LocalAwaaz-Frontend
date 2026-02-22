import React from "react";

const Comments = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground mb-4">
        Your Comments
      </h3>

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card rounded-lg p-4 hover:shadow-lg transition-all">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary text-sm font-semibold">Y</span>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold text-sm text-foreground">You</h4>
                  <span className="text-xs text-muted-foreground">commented on</span>
                  <h5 className="font-medium text-sm text-primary">Pothole on Main Street</h5>
                </div>
                
                <p className="text-sm text-muted-foreground leading-relaxed">
                  This is a serious issue that needs immediate attention. I've seen multiple vehicles getting damaged here. Please prioritize this repair.
                </p>

                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  <span>⏱ 1 day ago</span>
                  <span>👍 12 likes</span>
                  <span>💬 3 replies</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Comments;
