import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

const AboutSection = () => {
  return (
    <section id="about" className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-card border border-border rounded-xl p-8 sm:p-12 text-center relative overflow-hidden"
        >
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-sunset" />
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Organized by <span className="text-gradient-sunset">Purple Horizons</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed mb-6">
            Purple Horizons is a Miami-based AI innovation lab and consultancy. We help organizations and communities 
            harness AI through training, automation, and hands-on building.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://purplehorizons.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              purplehorizons.com <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;
