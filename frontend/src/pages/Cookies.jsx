import React, { useEffect } from 'react';
import { ArrowLeft, Cookie } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Cookies = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

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
                        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border/50">
                            <div className="w-12 h-12 bg-cyan-600/10 rounded-xl flex items-center justify-center border border-cyan-600/20 shrink-0">
                                <Cookie className="w-6 h-6 text-cyan-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-foreground">Cookie Policy</h1>
                                <p className="text-sm text-muted-foreground">Last Updated: March 2026</p>
                            </div>
                        </div>

                        <div className="space-y-8 text-muted-foreground leading-relaxed text-sm md:text-base">
                            <section>
                                <h2 className="text-lg md:text-xl font-semibold text-foreground mb-3">1. What Are Cookies?</h2>
                                <p>Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to the owners of the site.</p>
                            </section>

                            <section>
                                <h2 className="text-lg md:text-xl font-semibold text-foreground mb-3">2. How We Use Cookies</h2>
                                <p className="mb-2">LocalAwaaz uses cookies for the following purposes:</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li><strong>Essential Cookies:</strong> Required to keep you logged in and keep your session secure (like JWT tokens).</li>
                                    <li><strong>Preferences:</strong> To remember your UI choices, such as Light/Dark mode and your last searched location.</li>
                                    <li><strong>Analytics:</strong> To understand how users interact with our platform so we can improve the user experience.</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-lg md:text-xl font-semibold text-foreground mb-3">3. Managing Cookies</h2>
                                <p>Most web browsers allow you to control cookies through their settings preferences. However, if you limit the ability of websites to set cookies, you may worsen your overall user experience and lose the ability to stay logged into your LocalAwaaz account securely.</p>
                            </section>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Cookies;