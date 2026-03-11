import React, { useEffect } from 'react';
import { ArrowLeft, Newspaper, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Press = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const pressReleases = [
    { date: "March 02, 2026", title: "LocalAwaaz introduces LokAi: A Civic AI Assistant to streamline issue reporting." },
    { date: "January 15, 2026", title: "LocalAwaaz reaches milestone of 10,000 resolved community issues." },
    { date: "November 10, 2025", title: "Launch of the Community Verification system to combat false reporting." }
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
                  <Newspaper className="w-6 h-6 text-cyan-600" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">Press & Media</h1>
                  <p className="text-sm text-muted-foreground">Latest news, updates, and resources</p>
                </div>
              </div>
            </div>

            <div className="space-y-10 text-muted-foreground leading-relaxed text-sm md:text-base">
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">About LocalAwaaz</h2>
                <p>
                  LocalAwaaz is a community-driven civic technology platform designed to empower citizens to report, track, and resolve local issues. By leveraging crowd-sourced verification, GPS mapping, and AI-assisted reporting via LokAi, we bridge the communication gap between neighborhoods and local municipal authorities.
                </p>
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-background/50 rounded-xl p-6 border border-border/50">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Media Inquiries</h3>
                  <p className="text-sm mb-4">For press inquiries, interview requests, or speaker invitations, please contact our PR team.</p>
                  <a href="mailto:press@localawaaz.com" className="font-medium text-cyan-600 hover:text-cyan-700 transition-colors">
                    press@localawaaz.com
                  </a>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">Recent Announcements</h2>
                <div className="space-y-4">
                  {pressReleases.map((release, index) => (
                    <div key={index} className="pb-4 border-b border-border/50 last:border-0 last:pb-0">
                      <span className="text-xs font-medium text-cyan-600 mb-1 block">{release.date}</span>
                      <a href="#" className="text-foreground hover:text-cyan-600 transition-colors font-medium">
                        {release.title}
                      </a>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Press;