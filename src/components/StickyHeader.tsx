import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const StickyHeader = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-background/80 backdrop-blur-lg border-b border-border" : "bg-transparent"
      }`}
    >
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#" className="font-display font-bold text-lg text-foreground flex items-center gap-2">
          <span className="text-2xl">🦞</span>
          <span>OpenClaw<span className="text-gradient-sunset">Miami</span></span>
        </a>
        <Button variant="hero" size="sm" asChild>
          <a href="https://lu.ma/openclaw" target="_blank" rel="noopener noreferrer">
            See Events
          </a>
        </Button>
      </div>
    </motion.header>
  );
};

export default StickyHeader;
