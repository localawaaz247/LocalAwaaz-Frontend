import {
  Megaphone,
  Construction,
  Droplet,
  Zap,
  Trash2,
  Waves,
  Lightbulb,
  TrafficCone,
  AlertTriangle,
  Camera,
} from "lucide-react";

const categories = [
  { label: "Roads & Potholes", icon: Construction },
  { label: "Water Supply", icon: Droplet },
  { label: "Electricity", icon: Zap },
  { label: "Sanitation", icon: Trash2 },
  { label: "Garbage Collection", icon: Trash2 },
  { label: "Drainage", icon: Waves },
  { label: "Street Lights", icon: Lightbulb },
  { label: "Traffic", icon: TrafficCone },
  { label: "Encroachment", icon: AlertTriangle },
];

export default function ReportIssue() {
  return (
    <div className="min-h-screen bg-texture">
      {/* Header */}
      <header className="glass-card sticky top-0 z-50 mx-4 mt-4 rounded-2xl">
        <div className="flex items-center justify-between px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-teal-600 shadow-lg">
              <Megaphone className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gradient">LocalAwaaz</h1>
              <p className="text-xs text-muted-foreground">Community Voice Platform</p>
            </div>
          </div>
          <button className="btn-gradient rounded-full px-6 py-3 font-semibold shadow-lg transition-all hover:scale-105">
            Submit Issue
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-6 mt-8 rounded-3xl glass-card p-8 text-center shadow-xl">
        <div className="animate-fade-in-up">
          <h1 className="mb-4 text-4xl font-bold text-gradient md:text-5xl">
            Report a Local Issue
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Help improve your neighborhood by reporting issues directly to local authorities.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <div className="flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
              <div className="h-2 w-2 rounded-full bg-white animate-pulse"></div>
              Active Community
            </div>
            <div className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-accent-foreground bg-accent">
              247 Issues Resolved
            </div>
          </div>
        </div>
      </section>

      {/* Main Card */}
      <div className="mx-auto mt-10 max-w-7xl px-4 pb-16">
        <div className="glass-card p-8 shadow-xl">
          {/* Categories */}
          <div className="mb-8">
            <h2 className="mb-2 text-2xl font-bold text-foreground">Select Issue Category</h2>
            <p className="text-sm text-muted-foreground">Choose the category that best describes your issue</p>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {categories.map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="group flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-border bg-card p-4 text-sm text-card-foreground transition-all hover:-translate-y-1 hover:border-primary hover:bg-accent/50 hover:shadow-lg"
              >
                <div className="rounded-lg bg-muted p-3 transition-colors group-hover:bg-white group-hover:text-accent">
                  <Icon className="h-6 w-6 text-muted-foreground transition-colors group-hover:text-accent" />
                </div>
                <span className="text-center font-medium">{label}</span>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {/* Left */}
            <div className="space-y-6 md:col-span-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  Issue Title
                </label>
                <input
                  type="text"
                  placeholder="Brief title of the issue"
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <p className="mt-1 text-xs text-muted-foreground">0/100 characters</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  Detailed Description
                </label>
                <textarea
                  placeholder="Provide more details about the issue..."
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                  rows={4}
                />
                <p className="mt-1 text-xs text-muted-foreground">0/500 characters</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  Specific Location
                </label>
                <input
                  type="text"
                  placeholder="e.g., Near SBI Bank, Main Road"
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <div className="mt-2 rounded-lg bg-secondary/10 p-3">
                  <p className="text-xs text-secondary">
                    <strong>Your detected locality:</strong> Cuffe Parade, Ward A – Colaba
                  </p>
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  Add Photos
                  <span className="font-normal text-muted-foreground"> (Optional)</span>
                </label>
                <div className="group relative h-44 cursor-pointer rounded-xl border-2 border-dashed border-border bg-muted/50 transition-all hover:border-primary hover:bg-accent">
                  <input
                    type="file"
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    accept="image/*"
                    multiple
                  />
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                    <Camera className="h-8 w-8 text-muted-foreground transition-colors group-hover:text-primary" />
                    <span className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                      Upload Photo
                    </span>
                    <span className="text-xs text-muted-foreground">
                      JPG, PNG up to 5MB
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  Priority Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Low', 'Medium', 'High'].map((priority) => (
                    <button
                      key={priority}
                      type="button"
                      className="rounded-lg border-2 border-border bg-background px-3 py-2 text-sm font-medium transition-all hover:border-primary hover:bg-accent"
                    >
                      {priority}
                    </button>
                  ))}
                </div>
              </div>

              <button className="btn-gradient w-full rounded-xl py-3 font-semibold text-white shadow-lg transition-all hover:scale-105">
                Submit Issue
              </button>

              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <p className="text-xs text-muted-foreground">
                  Your report will be reviewed and forwarded to the appropriate department.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
