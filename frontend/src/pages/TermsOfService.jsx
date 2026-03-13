import React, { useEffect } from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO'; // <-- Added SEO Import

const TermsOfService = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-texture flex flex-col">
            {/* 🟢 SEO Metadata for the Terms page */}
            <SEO
                title="Terms of Service | Platform Usage & Conduct"
                description="Review the terms of service for LocalAwaaz. Understand our guidelines for civic reporting, community conduct, and how the Civil Score system works."
                url="/terms"
                keywords="LocalAwaaz terms, civic reporting guidelines, community conduct, civil score rules, localawaaz usage"
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
                                <FileText className="w-6 h-6 text-cyan-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-foreground">Terms of Service</h1>
                                <p className="text-sm text-muted-foreground">Last Updated: March 2026</p>
                            </div>
                        </div>

                        <div className="space-y-8 text-muted-foreground leading-relaxed text-sm md:text-base">
                            <section>
                                <h2 className="text-lg md:text-xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
                                <p>By accessing or using LocalAwaaz, you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform.</p>
                            </section>

                            <section>
                                <h2 className="text-lg md:text-xl font-semibold text-foreground mb-3">2. User Conduct & Reporting</h2>
                                <p className="mb-2">LocalAwaaz relies on the honesty of its community. You agree that:</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>You will only report genuine civic issues.</li>
                                    <li>You will not submit false, misleading, or malicious reports.</li>
                                    <li>You will not upload inappropriate, offensive, or illegal media.</li>
                                </ul>
                                <p className="mt-2">Violation of these rules may result in the immediate suspension of your account and a reset of your Civil Score.</p>
                            </section>

                            <section>
                                <h2 className="text-lg md:text-xl font-semibold text-foreground mb-3">3. Civil Score & Verification</h2>
                                <p>LocalAwaaz utilizes a "Civil Score" system to gauge user credibility. We reserve the right to adjust, deduct, or reset Civil Scores based on community flags and administrative reviews. The "Verified" badge is a privilege, not a right, and can be revoked at our discretion.</p>
                            </section>

                            <section>
                                <h2 className="text-lg md:text-xl font-semibold text-foreground mb-3">4. Content Ownership</h2>
                                <p>By submitting text, photos, or other media to LocalAwaaz, you grant us a worldwide, royalty-free license to use, display, and distribute that content for the purpose of operating the platform and resolving civic issues.</p>
                            </section>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default TermsOfService;