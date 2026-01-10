import { ArrowRight, Award, Users, MessageSquare } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="min-h-screen bg-texture flex items-center pt-20 pb-16 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 glass-card px-4 py-2 rounded-full mb-8 animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-sm font-medium text-foreground/80">
              Empowering Communities, One Voice at a Time
            </span>
          </div>

          {/* Headline */}
          <h1 className=" max-w-5xl text-4xl md:text-5xl lg:text-6xl font-bold font-display leading-tight mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Your Voice Matters.
            <br />
            <span className="text-gradient">Make It Heard.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            LocalAwaaz is an independent platform where citizens can report local issues, 
            track their resolution, and earn recognition badges for making a difference in their community.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <button className="btn-gradient px-5 py-3 rounded-full font-semibold text-lg flex items-center gap-2 group">
              Report an Issue
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="glass-card px-8 py-3 rounded-full font-semibold text-lg text-foreground hover:bg-muted/50 transition-colors">
              Learn More
            </button>
          </div>

          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto stagger-children">
            <div className="glass-card p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 rounded-xl bg-secondary/10 dark:bg-secondary/15 flex items-center justify-center mb-4 mx-auto">
                <MessageSquare className="w-7 h-7 text-secondary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Report Local Issues</h3>
              <p className="text-muted-foreground text-sm">Easily report community problems and safety concerns.</p>
            </div>

            <div className="glass-card p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 rounded-xl bg-secondary/10 dark:bg-secondary/15 flex items-center justify-center mb-4 mx-auto">
                <Award className="w-7 h-7 text-secondary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Track Resolutions</h3>
              <p className="text-muted-foreground text-sm">Track the status and progress of your reported issues.</p>
            </div>

            <div className="glass-card p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 rounded-xl bg-secondary/10 dark:bg-secondary/15 flex items-center justify-center mb-4 mx-auto">
                <Users className="w-7 h-7 text-secondary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Earn Badges & Rewards</h3>
              <p className="text-muted-foreground text-sm">Gain recognition badges for contributing to your community.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
