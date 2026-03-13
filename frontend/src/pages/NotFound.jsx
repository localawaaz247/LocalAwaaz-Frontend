import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { MapPinOff, Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-background overflow-hidden relative p-4">

      {/* Background Glowing Orbs for Depth */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 right-1/4 w-64 md:w-96 h-64 md:h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-64 md:w-96 h-64 md:h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Glassmorphism Card Container */}
      <div className="bg-card glass-card border border-border/50 rounded-2xl md:rounded-3xl p-6 md:p-10 max-w-lg w-full text-center relative z-10 shadow-2xl animate-fade-in-up">

        {/* Animated Icon Container */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 shadow-[0_0_30px_rgba(45,212,191,0.15)] relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            <MapPinOff className="w-10 h-10 md:w-12 md:h-12 text-primary relative z-10" />
          </div>
        </div>

        {/* Huge 404 Text */}
        <h1 className="text-6xl md:text-8xl font-black font-display text-gradient mb-2 tracking-tighter">
          404
        </h1>

        {/* App-Themed Heading */}
        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3">
          You've wandered off the map
        </h2>

        {/* Contextual Subtitle */}
        <p className="text-sm md:text-base text-muted-foreground mb-8 leading-relaxed">
          The page you are looking for at <span className="text-foreground font-mono bg-muted/50 px-2 py-0.5 rounded break-all">{location.pathname}</span> doesn't exist, has been moved, or you don't have access to it.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-background border border-border/50 text-foreground font-medium hover:bg-muted transition-colors shadow-sm"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>

          <button
            onClick={() => navigate('/')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl btn-gradient text-white font-semibold transition-all hover:scale-[1.02] shadow-md hover:shadow-lg"
          >
            <Home size={18} />
            Return Home
          </button>
        </div>
      </div>

    </div>
  );
};

export default NotFound;