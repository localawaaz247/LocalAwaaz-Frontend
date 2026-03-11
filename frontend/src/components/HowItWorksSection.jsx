import React from 'react';
import { Camera, Send, Eye, Award } from 'lucide-react';
import Tilt from 'react-parallax-tilt';

const steps = [
  {
    number: '01',
    icon: Camera,
    title: 'Capture the Issue',
    description: 'Take a photo of the issue and add a description with location details.',
  },
  {
    number: '02',
    icon: Send,
    title: 'Submit Your Report',
    description: 'Submit your report to the platform. It gets routed to the right authorities.',
  },
  {
    number: '03',
    icon: Eye,
    title: 'Track Progress',
    description: 'Monitor real-time updates as authorities work on resolving the issue.',
  },
  {
    number: '04',
    icon: Award,
    title: 'Earn Your Badge',
    description: 'When resolved, earn recognition badges for your contribution to the community.',
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 bg-muted/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-texture opacity-50 pointer-events-none" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 glass-card rounded-full text-sm font-medium text-secondary mb-4">
            How It Works
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-display mb-6">
            Four Simple Steps to{' '}
            <span className="text-gradient">Create Change</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Making your voice heard has never been easier. Follow these simple steps to report and track local issues.
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-5xl mx-auto">
          {/* Added relative z-20 to ensure cards sit above the connector lines for clean interactions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 stagger-children relative z-20">
            {steps.map((step, index) => (
              <div key={index} className="relative h-full w-full">
                {/* Connector Line (hidden on last item and mobile) - kept absolute behind the cards */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-[calc(50%+3rem)] w-[calc(100%-3rem)] h-0.5 bg-gradient-to-r from-primary/30 via-secondary/30 to-accent/30 -z-10" />
                )}
                
                <Tilt
                  tiltMaxAngleX={3} // Barely there tilt for a grounded feel
                  tiltMaxAngleY={3} // Barely there tilt for a grounded feel
                  perspective={1000}
                  scale={1.01}      // Tiny pop
                  transitionSpeed={2000}
                  gyroscope={true}
                  glareEnable={true}
                  glareMaxOpacity={0.15}
                  glareColor="#ffffff"
                  glarePosition="all"
                  glareBorderRadius="1rem"
                  className="h-full w-full rounded-2xl"
                >
                  {/* Removed hover:-translate-y-2 in favor of Tilt's scaling effect */}
                  <div className="glass-card p-6 h-full rounded-2xl text-center hover:shadow-xl transition-shadow duration-300 group">
                    {/* Step Number */}
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full badge-shimmer text-white text-sm font-bold mb-4">
                      {step.number}
                    </div>
                    
                    {/* Icon */}
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                      <step.icon className="w-8 h-8 text-primary" />
                    </div>
                    
                    {/* Content */}
                    <h3 className="text-lg font-bold font-display mb-2 text-foreground">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </Tilt>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16 animate-fade-in-up">
          <button className="btn-gradient px-8 md:py-3 py-2 rounded-full font-semibold text-lg">
            Start Reporting Today
          </button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;