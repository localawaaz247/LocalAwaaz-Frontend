import React, { useEffect } from 'react';
import { ArrowLeft, Briefcase, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Careers = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const openPositions = [
    { title: "Full Stack Engineer (MERN)", department: "Engineering", location: "Remote / Hybrid" },
    { title: "Community Manager", department: "Operations", location: "Remote" },
    { title: "UI/UX Product Designer", department: "Design", location: "Remote / Hybrid" }
  ];

  return (
    <div className="min-h-screen bg-texture flex flex-col">
      <Navbar />
      <main className="flex-grow pt-28 pb-20 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6 group text-sm md:text-base font-medium"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>

          <div className="glass-card p-6 md:p-10 rounded-2xl border border-border/50 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-border/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-cyan-600/10 rounded-xl flex items-center justify-center border border-cyan-600/20 shrink-0">
                  <Briefcase className="w-6 h-6 text-cyan-600" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">Careers at LocalAwaaz</h1>
                  <p className="text-sm text-muted-foreground">Join us in building the future of civic tech</p>
                </div>
              </div>
            </div>

            <div className="space-y-10 text-muted-foreground leading-relaxed text-sm md:text-base">
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">Our Mission</h2>
                <p>
                  At LocalAwaaz, we are on a mission to empower citizens and bridge the gap between communities and local authorities. We believe that technology can be a catalyst for real-world change, making neighborhoods safer, cleaner, and more connected. 
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">Open Positions</h2>
                <div className="space-y-4">
                  {openPositions.map((job, index) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-5 rounded-xl border border-border/50 bg-background/50 hover:border-cyan-600/30 transition-all group">
                      <div>
                        <h3 className="font-semibold text-foreground text-base md:text-lg group-hover:text-cyan-600 transition-colors">{job.title}</h3>
                        <div className="flex gap-3 text-xs md:text-sm mt-1">
                          <span className="text-muted-foreground">{job.department}</span>
                          <span className="text-border">•</span>
                          <span className="text-muted-foreground">{job.location}</span>
                        </div>
                      </div>
                      <button className="mt-3 sm:mt-0 px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-cyan-600 hover:text-white transition-colors inline-flex items-center gap-2 w-fit">
                        Apply Now <ArrowRight size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-cyan-600/5 rounded-xl p-6 border border-cyan-600/10 text-center">
                <h3 className="text-lg font-semibold text-foreground mb-2">Don't see a fit?</h3>
                <p className="mb-4 text-sm">We're always looking for passionate people to join our civic tech movement.</p>
                <a href="mailto:careers@localawaaz.com" className="font-medium text-cyan-600 hover:text-cyan-700 transition-colors">
                  Send your resume to careers@localawaaz.com
                </a>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Careers;