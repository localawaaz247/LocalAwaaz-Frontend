import React from "react";

const SavedIssues = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground mb-4">
        Saved Issues
      </h3>

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card rounded-lg p-4 flex justify-between items-start hover:shadow-lg transition-all">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm text-foreground">
                  Water Leakage in Community Park
                </h4>
                <span className="text-xs bg-blue-500/10 text-blue-600 border border-blue-500/20 px-2 py-0.5 rounded-lg">
                  Saved
                </span>
              </div>

              <p className="text-sm text-muted-foreground mt-1 max-w-lg leading-relaxed">
                There's a significant water leakage near the children's play area that could create safety hazards.
              </p>

              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                <span>⏱ 3 days ago</span>
                <span>💬 5 comments</span>
                <span>👍 8 upvotes</span>
                <span>🔖 Saved for later</span>
              </div>
            </div>

            {/* Decorative Placeholder */}
            <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SavedIssues;
