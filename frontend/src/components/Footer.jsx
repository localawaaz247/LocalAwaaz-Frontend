import { Heart } from 'lucide-react';
import logo from "/logo.png"
import { useLocation, useNavigate } from 'react-router-dom';

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
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-14 h-14 rounded-xl  flex items-center justify-center">
                <span className="text-xl font-bold text-white">
                  <img src={logo} alt='/' />
                </span>
              </div>
              <span className="text-2xl font-bold font-display">LocalAwaaz</span>
            </div>
            <p className="text-background/70 mb-6 max-w-sm leading-relaxed">
              Empowering citizens to make their voices heard and create
              positive change in their communities.
            </p>
            <div className="flex items-center gap-1 text-sm text-background/60">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-red-400 fill-red-400" />
              <span>in India</span>
            </div>
          </div>

          {/* Mobile Links */}
          <div className='md:hidden max-sm:grid max-sm:grid-cols-3 gap-4'>
            <div>
              <h4 className="font-semibold mb-4 text-background">Product</h4>
              <ul className="space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link.name}>
                    <button
                      onClick={link.onClick || (() => scrollToSection(link.href))}
                      className="text-background/70 hover:text-background transition-colors text-sm text-left"
                    >
                      {link.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-background">Company</h4>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <button
                      onClick={link.onClick || (() => scrollToSection(link.href))}
                      className="text-background/70 hover:text-background transition-colors text-sm text-left"
                    >
                      {link.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-background">Legal</h4>
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <button
                      onClick={link.onClick || (() => scrollToSection(link.href))}
                      className="text-background/70 hover:text-background transition-colors text-sm text-left"
                    >
                      {link.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Desktop Links */}
          <div className='max-sm:hidden'>
            <h4 className="font-semibold mb-4 text-background">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <button
                    onClick={link.onClick || (() => scrollToSection(link.href))}
                    className="text-background/70 hover:text-background transition-colors text-sm text-left"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className='max-sm:hidden'>
            <h4 className="font-semibold mb-4 text-background">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <button
                    onClick={link.onClick || (() => scrollToSection(link.href))}
                    className="text-background/70 hover:text-background transition-colors text-sm text-left"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className='max-sm:hidden'>
            <h4 className="font-semibold mb-4 text-background">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <button
                    onClick={link.onClick || (() => scrollToSection(link.href))}
                    className="text-background/70 hover:text-background transition-colors text-sm text-left"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-background/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-background/60">
              © {currentYear} LocalAwaaz. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="https://www.x.com/localawaaz247" className="text-background/60 hover:text-background transition-colors text-sm" target='_blank'>
                X (Ex-Twitter)
              </a>
              <a href="https://www.linkedin.com/in/localawaaz-8b681a3a6?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" target="_blank" className="text-background/60 hover:text-background transition-colors text-sm">
                LinkedIn
              </a>
              <a href="https://www.instagram.com/localawaaz247?igsh=cTF3NzlqdmhsaWJh" target="_blank" className="text-background/60 hover:text-background transition-colors text-sm">
                Instagram
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer >
  );
};

export default Footer;