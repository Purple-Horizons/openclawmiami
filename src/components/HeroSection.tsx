import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background glow */}
      <div className="absolute inset-0 bg-glow" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] animate-pulse-glow" />

      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-7xl mb-6 animate-float">🦞</div>
          <h1 className="font-display text-5xl sm:text-7xl font-bold tracking-tight mb-4">
            OpenClaw <span className="text-gradient-sunset">Miami</span>
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto mb-4 font-display font-medium">
            Miami's home for the open-source AI assistant that actually does things.
          </p>
          <p className="text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            OpenClaw is the viral AI agent with 145K+ GitHub stars — and Miami's builders are bringing it to life locally. 
            Join our meetups, get setup help, and build the future of personal AI with us.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button variant="hero" size="lg" asChild>
            <a href="#events">See Upcoming Events</a>
          </Button>
          <Button variant="hero-outline" size="lg" asChild>
            <a href="https://discord.com/channels/1456350064065904867/1464825842264703221" target="_blank" rel="noopener noreferrer">
              Join the Community
            </a>
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 flex justify-center gap-8 sm:gap-16 text-center"
        >
          {[
            { value: "145K+", label: "GitHub Stars" },
            { value: "Monthly", label: "Meetups" },
            { value: "50+", label: "Local Builders" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="font-display font-bold text-2xl text-gradient-sunset">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
