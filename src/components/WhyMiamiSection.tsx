import { motion } from "framer-motion";

const WhyMiamiSection = () => {
  return (
    <section id="why-miami" className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-6">
            Why <span className="text-gradient-sunset">Miami</span>?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed text-lg">
            Miami is a global tech hub with a builder-first culture. OpenClaw Miami brings together 
            developers, founders, and AI enthusiasts who want to tinker, automate, and build the future — 
            in person, not just on Discord.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-12 grid grid-cols-3 gap-6 text-center"
        >
          {[
            { emoji: "🏗️", value: "50+", label: "Local Builders" },
            { emoji: "📅", value: "Monthly", label: "Meetups" },
            { emoji: "🤝", value: "Free", label: "Setup Help" },
          ].map((item) => (
            <div key={item.label} className="bg-card border border-border rounded-xl p-6">
              <div className="text-3xl mb-2">{item.emoji}</div>
              <div className="font-display font-bold text-xl text-gradient-sunset">{item.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{item.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default WhyMiamiSection;
