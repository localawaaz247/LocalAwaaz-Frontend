import React from 'react';
import {
  FileText,
  MapPin,
  Award,
  Bell,
  Shield,
  TrendingUp
} from 'lucide-react';
import Tilt from 'react-parallax-tilt';

const features = [
  {
    icon: FileText,
    title: 'Easy Issue Reporting',
    description: 'Report local issues in just a few clicks with photos, location, and detailed descriptions.',
    color: 'primary',
  },
  {
    icon: MapPin,
    title: 'Location-Based Tracking',
    description: 'Track issues on an interactive map and see what\'s happening in your neighborhood.',
    color: 'secondary',
  },
  {
    icon: Award,
    title: 'Earn Recognition Badges',
    description: 'Get rewarded with badges for your contributions when issues you report get resolved.',
    color: 'accent',
  },
  {
    icon: Bell,
    title: 'Real-Time Updates',
    description: 'Receive instant notifications when there\'s progress on issues you care about.',
    color: 'primary',
  },
  {
    icon: Shield,
    title: 'Anonymous Reporting',
    description: 'Report sensitive issues anonymously while still tracking their resolution.',
    color: 'secondary',
  },
  {
    icon: TrendingUp,
    title: 'Community Impact',
    description: 'See the collective impact of your community with detailed analytics and insights.',
    color: 'accent',
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="w-full py-24 px-2 md:px-6 bg-texture relative">
      {/* Decorative elements */}
      <div className="absolute top-40 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 glass-card rounded-full text-sm font-medium text-secondary mb-4">
            Features
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-display mb-6">
            Everything You Need to{' '}
            <span className="text-gradient">Make a Difference</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Powerful tools designed to amplify your voice and create real change in your community.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children relative z-20">
          {features.map((feature, index) => (
            <div key={index} className="h-full w-full">
              <Tilt
                tiltMaxAngleX={3} // Subtle, grounded tilt
                tiltMaxAngleY={3} // Subtle, grounded tilt
                perspective={1000}
                scale={1.01}      // Tiny, professional pop
                transitionSpeed={2000}
                gyroscope={true}
                glareEnable={true}
                glareMaxOpacity={0.15}
                glareColor="#ffffff"
                glarePosition="all"
                glareBorderRadius="1rem"
                className="h-full w-full rounded-2xl"
              >
                <div className="glass-card p-8 h-full hover:shadow-xl transition-shadow duration-300 group">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 bg-secondary/10 dark:bg-secondary/15">
                    <feature.icon className="w-7 h-7 text-secondary" />
                  </div>
                  <h3 className="text-xl font-bold font-display mb-3 text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </Tilt>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;