import React, { useState } from 'react';
import { ChevronDown, Search, MessageCircle, Mail, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO'; // <-- Added SEO Import

const faqs = [
    {
        id: 1,
        category: "General",
        question: "What is LocalAwaaz?",
        answer: "LocalAwaaz is a community-driven civic tech platform where citizens can report, track, and resolve local issues in their neighborhood. We connect community voices with local authorities to create meaningful positive change."
    },
    {
        id: 2,
        category: "General",
        question: "Is LocalAwaaz free to use?",
        answer: "Yes, LocalAwaaz is completely free for all citizens. Our mission is to empower communities without any financial barriers."
    },
    {
        id: 3,
        category: "Reporting",
        question: "How do I report an issue?",
        answer: "Once logged in, click the 'New Issue' or 'Report' button on your dashboard. You will need to select a category, provide a brief description, add your GPS location, and upload photos of the problem."
    },
    {
        id: 4,
        category: "Reporting",
        question: "Can I report an issue anonymously?",
        answer: "Absolutely. When filling out the issue report form, simply check the 'Post Anonymously' box. Your name and profile details will be completely hidden from the public feed."
    },
    {
        id: 5,
        category: "Reporting",
        question: "What happens after I report an issue?",
        answer: "Your issue becomes visible to other users in your area who can 'Confirm' it. Issues with high community impact scores are prioritized and forwarded to the relevant local authorities for resolution."
    },
    {
        id: 6,
        category: "Account & Verification",
        question: "How does the Civil Score work?",
        answer: "Your Civil Score is a reputation metric based on your activity. You earn points by reporting valid issues, confirming existing ones, and engaging positively. A higher score increases the visibility and credibility of your reports."
    },
    {
        id: 7,
        category: "Account & Verification",
        question: "How do I get a 'Verified' badge?",
        answer: "The 'Verified' badge is automatically awarded to users who have successfully verified their email addresses. It helps the community know that the report is coming from an authentic, registered citizen."
    },
    {
        id: 8,
        category: "Privacy",
        question: "Is my location data safe?",
        answer: "Yes. We only use your GPS data to accurately pin the issue on the local map. We do not track your background location or share your precise personal whereabouts with third parties."
    },
    {
        id: 9,
        category: "Reporting",
        question: "What is the 'Impact Score' and 'Confirm' button?",
        answer: "When other citizens see an issue you posted and are experiencing the same problem, they can click 'I Confirm'. This increases the issue's Impact Score, making it more prominent and alerting authorities that this is a widespread problem affecting many people."
    },
    {
        id: 10,
        category: "General",
        question: "What is LokAi?",
        answer: "LokAi is your personal AI Assistant built into LocalAwaaz. It can help you draft better issue descriptions, figure out which category your problem falls under, or guide you through the platform's features."
    },
    {
        id: 11,
        category: "Reporting",
        question: "How do I edit or delete my issue?",
        answer: "Currently, to maintain the integrity of community confirmations, you cannot completely delete an issue once it has gained traction. However, you can mark an issue as 'Resolved' from your 'Issues Posted' tab once the authorities have fixed the problem."
    }
];

const categories = ["All", "General", "Reporting", "Account & Verification", "Privacy"];

const FAQ = () => {
    const [activeCategory, setActiveCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [openId, setOpenId] = useState(1);

    const filteredFaqs = faqs.filter(faq => {
        const matchesCategory = activeCategory === "All" || faq.category === activeCategory;
        const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const toggleAccordion = (id) => {
        setOpenId(openId === id ? null : id);
    };

    return (
        <div className="min-h-screen bg-texture flex flex-col">
            {/* Added SEO Component right at the top of the UI structure */}
            <SEO
                title="Frequently Asked Questions"
                description="Find answers to the most common questions about how to report issues, earn civil score points, and use the LocalAwaaz platform."
                url="/FAQ"
            />

            <Navbar />

            <main className="flex-grow pt-28 pb-20 px-4 md:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12 md:mb-16 animate-fade-in-up">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-border/50 text-sm font-medium text-cyan-600 mb-6">
                            <MessageCircle size={16} />
                            Help Center
                        </div>
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                            Frequently Asked <span className="text-gradient">Questions</span>
                        </h1>
                        <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                            Everything you need to know about LocalAwaaz. Can't find the answer you're looking for? Feel free to contact our team.
                        </p>
                    </div>

                    <div className="mb-10 space-y-6">
                        <div className="relative max-w-xl mx-auto">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search for answers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-border bg-card text-foreground placeholder:text-muted-foreground focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20 outline-none transition-all shadow-sm"
                            />
                        </div>

                        <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setActiveCategory(category)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${activeCategory === category
                                        ? "btn-gradient text-white shadow-md"
                                        : "glass-card border border-border/50 text-foreground/80 hover:text-foreground hover:bg-muted"
                                        }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4 min-h-[400px]">
                        {filteredFaqs.length > 0 ? (
                            filteredFaqs.map((faq) => (
                                <div
                                    key={faq.id}
                                    className={`glass-card rounded-2xl border border-border/50 overflow-hidden transition-all duration-300 ${openId === faq.id ? "ring-1 ring-cyan-600/50 shadow-md" : "hover:border-cyan-600/30"
                                        }`}
                                >
                                    <button
                                        onClick={() => toggleAccordion(faq.id)}
                                        className="w-full flex items-center justify-between p-5 md:p-6 text-left bg-transparent outline-none focus:outline-none"
                                    >
                                        <span className={`font-semibold text-base md:text-lg pr-4 ${openId === faq.id ? "text-cyan-600" : "text-foreground"}`}>
                                            {faq.question}
                                        </span>
                                        <div className={`p-1 rounded-full transition-colors ${openId === faq.id ? "bg-cyan-600/10 text-cyan-600" : "text-muted-foreground"}`}>
                                            <ChevronDown
                                                className={`w-5 h-5 transition-transform duration-300 ${openId === faq.id ? "rotate-180" : "rotate-0"}`}
                                            />
                                        </div>
                                    </button>

                                    <div
                                        className={`transition-all duration-300 ease-in-out px-5 md:px-6 overflow-hidden ${openId === faq.id ? "max-h-96 pb-5 md:pb-6 opacity-100" : "max-h-0 py-0 opacity-0"
                                            }`}
                                    >
                                        <div className="h-px w-full bg-border/50 mb-4"></div>
                                        <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                                            {faq.answer}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 glass-card rounded-2xl border border-border/50">
                                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground mb-2">No results found</h3>
                                <p className="text-muted-foreground">We couldn't find any answers matching your search.</p>
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="mt-4 text-cyan-600 font-medium hover:underline"
                                >
                                    Clear search
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="mt-16 glass-card rounded-3xl p-8 md:p-10 border border-border/50 relative overflow-hidden text-center">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-teal-600"></div>
                        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl"></div>

                        <div className="relative z-10">
                            <div className="w-16 h-16 bg-cyan-600/10 text-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-5 rotate-3">
                                <Mail size={32} />
                            </div>
                            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Still have questions?</h3>
                            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                                Can't find the answer you're looking for? Please chat to our friendly team.
                            </p>
                            <a
                                href="mailto:help@localawaaz.in"
                                className="btn-gradient px-8 py-3 rounded-xl font-semibold text-white inline-flex items-center gap-2 transition-transform hover:scale-105 shadow-lg"
                            >
                                Get in touch
                                <ArrowRight size={18} />
                            </a>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default FAQ;