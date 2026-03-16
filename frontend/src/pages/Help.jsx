import React, { useState } from 'react';
import {
    Search,
    ChevronDown,
    Mail,
    MessageCircle,
    ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // <-- Import translation hook

const Help = () => {
    const navigate = useNavigate();
    const { t } = useTranslation(); // <-- Initialize translation

    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategoryId, setActiveCategoryId] = useState('all'); // Safe state for i18n
    const [expandedId, setExpandedId] = useState(null);

    // 1. Move categories inside to translate labels, keeping a fixed ID for logic
    const categories = [
        { id: 'all', label: t('help_cat_all') },
        { id: 'general', label: t('help_cat_general') },
        { id: 'reporting', label: t('help_cat_reporting') },
        { id: 'account', label: t('help_cat_account') },
        { id: 'privacy', label: t('help_cat_privacy') }
    ];

    // 2. Move FAQ Data inside to access the `t()` function
    const faqData = [
        {
            id: 1,
            categoryId: 'general',
            question: t('faq_q1'),
            answer: t('faq_a1')
        },
        {
            id: 2,
            categoryId: 'reporting',
            question: t('faq_q2'),
            answer: t('faq_a2')
        },
        {
            id: 3,
            categoryId: 'reporting',
            question: t('faq_q3'),
            answer: t('faq_a3')
        },
        {
            id: 4,
            categoryId: 'general',
            question: t('faq_q4'),
            answer: t('faq_a4')
        },
        {
            id: 5,
            categoryId: 'account',
            question: t('faq_q5'),
            answer: t('faq_a5')
        },
        {
            id: 6,
            categoryId: 'privacy',
            question: t('faq_q6'),
            answer: t('faq_a6')
        }
    ];

    // Filter FAQs based on search and category ID
    const filteredFaqs = faqData.filter((faq) => {
        const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategoryId === 'all' || faq.categoryId === activeCategoryId;
        return matchesSearch && matchesCategory;
    });

    const toggleAccordion = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <div className="min-h-[100dvh] bg-texture pb-20 md:pb-8">

            {/* Header */}
            <header className="glass-card sticky top-2 md:top-4 z-40 mx-2 md:mx-4 rounded-xl md:rounded-2xl shadow-sm border-b border-border/50">
                <div className="flex items-center px-4 py-3 md:px-8 md:py-5 gap-3 md:gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-1.5 md:p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                        <ArrowLeft size={20} className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                    <div>
                        <h1 className="text-lg md:text-xl font-bold text-foreground leading-tight">
                            {t('help_title')}
                        </h1>
                        <p className="text-[10px] md:text-xs text-muted-foreground">
                            {t('help_subtitle')}
                        </p>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 mt-6 md:mt-8">

                {/* Search Section */}
                <div className="relative mb-8 animate-fade-in-up">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <input
                        type="text"
                        className="w-full glass-card border-2 border-border bg-card/50 text-foreground rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 transition-all shadow-sm"
                        placeholder={t('help_search_placeholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Categories (Scrollable on mobile) */}
                <div className="flex gap-2 md:gap-3 mb-8 overflow-x-auto no-scrollbar pb-2 animate-fade-in-up">
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => setActiveCategoryId(category.id)}
                            className={`px-4 py-2 rounded-full text-xs md:text-sm font-medium whitespace-nowrap transition-all ${activeCategoryId === category.id
                                ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md'
                                : 'glass-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                                }`}
                        >
                            {category.label}
                        </button>
                    ))}
                </div>

                {/* FAQ List */}
                <div className="space-y-3 md:space-y-4 animate-fade-in-up">
                    {filteredFaqs.length > 0 ? (
                        filteredFaqs.map((faq) => (
                            <div
                                key={faq.id}
                                className={`glass-card border rounded-2xl overflow-hidden transition-all duration-300 ${expandedId === faq.id ? 'border-cyan-600/50 shadow-md' : 'border-border'
                                    }`}
                            >
                                <button
                                    onClick={() => toggleAccordion(faq.id)}
                                    className="w-full flex items-center justify-between p-4 md:p-5 text-left focus:outline-none"
                                >
                                    <span className="font-semibold text-sm md:text-base text-foreground pr-4">
                                        {faq.question}
                                    </span>
                                    <div className={`p-1 rounded-full transition-transform duration-300 ${expandedId === faq.id ? 'bg-cyan-600/10 text-cyan-600 rotate-180' : 'text-muted-foreground'}`}>
                                        <ChevronDown size={20} />
                                    </div>
                                </button>

                                <div
                                    className={`px-4 md:px-5 transition-all duration-300 ease-in-out overflow-hidden ${expandedId === faq.id ? 'max-h-96 pb-4 md:pb-5 opacity-100' : 'max-h-0 opacity-0'
                                        }`}
                                >
                                    <div className="pt-2 border-t border-border/50">
                                        <p className="text-xs md:text-sm text-muted-foreground leading-relaxed mt-3">
                                            {faq.answer}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 glass-card rounded-2xl border border-border">
                            <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                            <h3 className="text-lg font-medium text-foreground">{t('help_no_results')}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{t('help_no_results_desc')} "{searchQuery}"</p>
                        </div>
                    )}
                </div>

                {/* Contact Support Section */}
                <div className="mt-12 mb-6 glass-card border border-border rounded-3xl p-6 md:p-8 text-center animate-fade-in-up">
                    <div className="w-12 h-12 md:w-16 md:h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4 border border-primary/20">
                        <Mail className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                    </div>
                    <h2 className="text-lg md:text-xl font-bold text-foreground mb-2">{t('help_contact_title')}</h2>
                    <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                        {t('help_contact_desc')}
                    </p>
                    <a
                        href="mailto:help@localawaaz.in"
                        className="inline-block btn-gradient px-6 py-3 rounded-xl text-sm font-semibold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-transform"
                    >
                        {t('help_contact_btn')}
                    </a>
                </div>

            </div>
        </div>
    );
};

export default Help;