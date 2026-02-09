import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

const hosts = [
  {
    name: "Purple Horizons",
    role: "Host & Organizer",
    description: "Miami's AI innovation lab and consultancy.",
    link: "https://purplehorizons.com",
  },
  {
    name: "The Lab Miami",
    role: "Partner",
    description: "Miami's original co-working & innovation space.",
    link: "https://thelabmiami.com",
  },
];

const venues = [];

const HostsSponsorsSection = () => {
  return (
    <section id="hosts" className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Hosts & <span className="text-gradient-sunset">Sponsors</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            The people and places making OpenClaw Miami happen.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-6">
          {[...hosts, ...venues].map((item, i) => (
            <motion.a
              key={item.name}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-card border border-border rounded-xl p-6 hover:border-primary/30 transition-colors duration-300 group block"
            >
              <div className="text-xs font-mono text-primary mb-2 uppercase tracking-wider">{item.role}</div>
              <h3 className="font-display font-semibold text-xl mb-2 flex items-center gap-2">
                {item.name}
                <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-muted-foreground text-sm">{item.description}</p>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HostsSponsorsSection;
