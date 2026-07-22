import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import FeaturesSection from "../components/FeaturesSection";
import TrustedSection from "../components/TrustedSection";

const LandingPage = () => {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <Navbar />

      <main>
        <HeroSection />
        <FeaturesSection />
        <TrustedSection />
      </main>
    </div>
  );
};

export default LandingPage;