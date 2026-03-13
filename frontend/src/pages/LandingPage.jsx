import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import FeaturesSection from '../components/FeaturesSection';
import HowItWorksSection from '../components/HowItWorksSection';
import AboutSection from '../components/AboutSection';
import ContactSection from '../components/ContactSection';
import Footer from '../components/Footer';
import SEO from '../components/SEO'; // <-- Added Import

const LandingPage = () => {
  return (
    <div className="min-h-screen w-[100%]">
      <SEO
        title="Apni Baat, Apni Awaaz"
        description="LocalAwaaz is an independent civic platform for Indian citizens to report local issues, track neighborhood resolutions, and earn community recognition."
        url="/"
        keywords="localawaaz, civic tech india, report local problems, neighborhood news, community voice, local issue tracker"
      />

      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <AboutSection />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default LandingPage;