import { Heart, Twitter, Linkedin, Instagram } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import VisitCounter from './VisitCounter';
import Logo from './Logo';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();
  const location = useLocation();

  const footerLinks = {
    product: [
      { name: 'Features', href: '#features' },
      { name: 'How It Works', href: '#how-it-works' },
      {
        name: 'FAQ',
        onClick: () => {
          window.scrollTo(0, 0); // Scroll to top immediately
          navigate('/FAQ');
        }
      },
    ],
    company: [
      { name: 'About Us', href: '#about' },
      {
        name: 'Careers',
        onClick: () => {
          window.scrollTo(0, 0);
          navigate('/careers');
        }
      },
      {
        name: 'Press',
        onClick: () => {
          window.scrollTo(0, 0);
          navigate('/press');
        }
      },
    ],
    legal: [
      {
        name: 'Privacy Policy',
        onClick: () => {
          window.scrollTo(0, 0);
          navigate('/privacy');
        }
      },
      {
        name: 'Terms of Service',
        onClick: () => {
          window.scrollTo(0, 0);
          navigate('/terms');
        }
      },
      {
        name: 'Cookie Policy',
        onClick: () => {
          window.scrollTo(0, 0);
          navigate('/cookies');
        }
      },
    ],
  };

  const scrollToSection = (href) => {
    if (!href) return;

    if (href.startsWith('#') && href !== '#') {
      if (location.pathname !== '/') {
        // If not on homepage, navigate home first, then scroll
        navigate('/');
        setTimeout(() => {
          const element = document.querySelector(href);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100); // 100ms delay to allow the DOM to paint the new page
      } else {
        // If already on homepage, just scroll smoothly
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  };

  return (
    <footer className="relative bg-background pt-20 pb-8 border-t border-border/50 overflow-hidden">
      {/* Decorative Blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">

          {/* Brand Section - Centered on Mobile, Left on Desktop */}
          <div className="lg:col-span-2 flex flex-col items-center lg:items-start text-center lg:text-left">

            <div className="mb-6 flex justify-center lg:justify-start w-full">
              <Logo />
            </div>

            <p className="text-muted-foreground mb-8 max-w-sm leading-relaxed">
              Empowering citizens to make their voices heard and create positive, lasting change in their local communities.
            </p>

            <div className="glass-card px-4 py-2 rounded-full inline-flex items-center justify-center gap-2 text-sm text-foreground/80 mb-8 border border-border/50 shadow-sm">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
              <span>in India</span>
            </div>

            {/* ODOMETER ADDED HERE */}
            <div className="w-full max-w-xs flex justify-center lg:justify-start">
              <VisitCounter />
            </div>
          </div>

          {/* Links Section - Centered Wrapper */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-12 lg:gap-8 pt-2">
            {['product', 'company', 'legal'].map((category) => (
              <div key={category} className="flex flex-col items-center text-center">
                <h4 className="font-bold text-foreground mb-6 uppercase tracking-wider text-sm">
                  {category}
                </h4>
                <ul className="space-y-4 flex flex-col items-center">
                  {footerLinks[category].map((link) => (
                    <li key={link.name}>
                      <button
                        onClick={link.onClick || (() => scrollToSection(link.href))}
                        className="text-muted-foreground hover:text-primary transition-all duration-300 text-base font-medium hover:-translate-y-0.5"
                      >
                        {link.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            © {currentYear} LocalAwaaz. All rights reserved.
          </p>

          {/* Social Links */}
          <div className="flex items-center justify-center gap-4">
            <a
              href="https://www.x.com/localawaaz247"
              target='_blank'
              rel="noreferrer"
              className="w-10 h-10 rounded-full glass-card border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 hover:shadow-lg dark:hover:shadow-none dark:hover:bg-transparent transition-all duration-300 group"
              aria-label="X (Twitter)"
            >
              <Twitter className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </a>
            <a
              href="https://www.linkedin.com/in/localawaaz-8b681a3a6"
              target="_blank"
              rel="noreferrer"
              className="w-10 h-10 rounded-full glass-card border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 hover:shadow-lg dark:hover:shadow-none dark:hover:bg-transparent transition-all duration-300 group"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </a>
            <a
              href="https://www.instagram.com/localawaaz247"
              target="_blank"
              rel="noreferrer"
              className="w-10 h-10 rounded-full glass-card border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 hover:shadow-lg dark:hover:shadow-none dark:hover:bg-transparent transition-all duration-300 group"
              aria-label="Instagram"
            >
              <Instagram className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;