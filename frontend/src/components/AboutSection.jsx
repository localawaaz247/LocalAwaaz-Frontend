import { Heart, Target, Eye } from 'lucide-react';

const values = [
  {
    icon: Heart,
    title: 'Community First',
    description: 'We believe in the power of community voices to drive meaningful change in local governance.',
  },
  {
    icon: Target,
    title: 'Transparency',
    description: 'Every report, every update, and every resolution is tracked and visible to all stakeholders.',
  },
  {
    icon: Eye,
    title: 'Accountability',
    description: 'We hold authorities accountable by making issue resolution timelines public.',
  },
];

const AboutSection = () => {
  return (
    <section id="about" className="py-24 bg-texture relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="animate-fade-in-up max-sm:flex max-sm:flex-col  justify-center items-center">
            <span className="inline-block   px-4 py-1.5 glass-card rounded-full text-sm font-medium text-accent mb-4">
              About Us
            </span>
            <h2 className="text-3xl max-sm:text-center md:text-4xl lg:text-5xl font-bold font-display mb-6">
              Bridging the Gap Between{' '}
              <span className="text-gradient">Citizens & Government</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              LocalAwaaz was born from a simple idea - every citizen deserves a voice, 
              and every voice deserves to be heard. We're building a platform that 
              empowers communities to identify, report, and track local issues while 
              creating a transparent bridge to local authorities.
            </p>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed ">
              Our mission is to transform how citizens interact with local governance, 
              making it easier than ever to contribute to the betterment of your neighborhood. 
              Through our badge system, we recognize and celebrate the active citizens who 
              make a real difference.
            </p>

            {/* Mission Statement Card */}
            <div className="glass-card p-6 rounded-2xl border-l-4 border-primary">
              <p className="text-foreground font-medium italic font-serif">
                "We envision a world where every local issue is addressed, 
                every citizen is empowered, and every community thrives."
              </p>
              <p className="text-muted-foreground text-sm mt-2">— The LocalAwaaz Team</p>
            </div>
          </div>

          {/* Right Content - Values */}
          <div className="space-y-6 stagger-children">
            {values.map((value, index) => (
              <div
                key={index}
                className="glass-card p-6 rounded-2xl flex gap-5 hover:shadow-xl transition-all duration-300 hover:-translate-x-2 group"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <value.icon className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-display mb-2 text-foreground">
                    {value.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
