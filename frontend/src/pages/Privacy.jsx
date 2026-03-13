import React, { useEffect } from 'react';
import { ArrowLeft, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Privacy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-texture flex flex-col">
      <SEO
        title="Privacy Policy | Data Security & Transparency"
        description="Read the LocalAwaaz Privacy Policy to understand how we protect your account data, GPS location, and anonymity while you contribute to your community."
        url="/privacy"
        keywords="LocalAwaaz privacy, data protection, anonymous reporting, civic tech security, GPS data privacy"
      />
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
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border/50">
              <div className="w-12 h-12 bg-cyan-600/10 rounded-xl flex items-center justify-center border border-cyan-600/20 shrink-0">
                <Shield className="w-6 h-6 text-cyan-600" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">Privacy Policy</h1>
                <p className="text-sm text-muted-foreground">Last Updated: March 2026</p>
              </div>
            </div>

            <div className="space-y-8 text-muted-foreground leading-relaxed text-sm md:text-base">
              <section>
                <h2 className="text-lg md:text-xl font-semibold text-foreground mb-3">1. Information We Collect</h2>
                <p className="mb-2">We collect information you provide directly to us when using LocalAwaaz, including:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Account Information:</strong> Name, username, email address, and profile details.</li>
                  <li><strong>Issue Reports:</strong> Photos, descriptions, and categories of the issues you report.</li>
                  <li><strong>Location Data:</strong> GPS coordinates (latitude and longitude) are collected <em>only</em> when you explicitly grant permission to pin an issue on the map. We do not track your background location.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg md:text-xl font-semibold text-foreground mb-3">2. How We Use Your Information</h2>
                <p>Your data is used to maintain the LocalAwaaz platform, verify the authenticity of civic reports, prevent spam, and calculate your Civil Score. Publicly posted issues will display your username unless you select the "Post Anonymously" option.</p>
              </section>

              <section>
                <h2 className="text-lg md:text-xl font-semibold text-foreground mb-3">3. Anonymity & Public Data</h2>
                <p>If you choose to post an issue anonymously, your identity will be shielded from the public feed and other users. However, LocalAwaaz administrators retain access to the original poster's information for moderation and legal compliance purposes.</p>
              </section>

              <section>
                <h2 className="text-lg md:text-xl font-semibold text-foreground mb-3">4. Information Sharing</h2>
                <p>We do not sell your personal data. We may share aggregated, non-personally identifiable data with local municipal authorities or civic bodies to help them understand community needs and address reported issues.</p>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;