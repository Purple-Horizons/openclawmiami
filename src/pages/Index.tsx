import StickyHeader from "@/components/StickyHeader";
import HeroSection from "@/components/HeroSection";
import WhatIsSection from "@/components/WhatIsSection";
import EventsSection from "@/components/EventsSection";
import WhyMiamiSection from "@/components/WhyMiamiSection";
import GetStartedSection from "@/components/GetStartedSection";
import HostsSponsorsSection from "@/components/HostsSponsorsSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <StickyHeader />
      <main>
        <HeroSection />
        <WhatIsSection />
        <EventsSection />
        <WhyMiamiSection />
        <GetStartedSection />
        <HostsSponsorsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
