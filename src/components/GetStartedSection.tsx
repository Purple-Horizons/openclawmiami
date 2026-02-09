import { motion } from "framer-motion";
import { Terminal, Users, Calendar } from "lucide-react";

const steps = [
  {
    icon: Terminal,
    step: "01",
    title: "Install",
    description: "One command to get started:",
    code: "curl -fsSL https://openclaw.ai/install.sh | bash",
  },
  {
    icon: Users,
    step: "02",
    title: "Join",
    description: "Connect with the community on Discord.",
    link: { text: "Join Discord →", href: "https://discord.gg/openclaw" },
  },
  {
    icon: Calendar,
    step: "03",
    title: "Show Up",
    description: "Come to the next Miami meetup. We'll help you get set up.",
    link: { text: "See Events →", href: "https://lu.ma/openclaw" },
  },
];

const GetStartedSection = () => {
  return (
    <section id="get-started" className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Get Started with <span className="text-gradient-sunset">OpenClaw</span>
          </h2>
          <p className="text-muted-foreground">Three steps to join the Miami AI builder community.</p>
        </motion.div>

        <div className="space-y-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="flex gap-6 items-start bg-card border border-border rounded-xl p-6 hover:border-primary/30 transition-colors"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <step.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-primary font-mono mb-1">STEP {step.step}</div>
                <h3 className="font-display font-semibold text-lg mb-1">{step.title}</h3>
                <p className="text-muted-foreground text-sm mb-2">{step.description}</p>
                {step.code && (
                  <code className="block bg-muted rounded-lg px-4 py-3 text-sm font-mono text-accent overflow-x-auto">
                    {step.code}
                  </code>
                )}
                {step.link && (
                  <a
                    href={step.link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-sm hover:underline"
                  >
                    {step.link.text}
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-8 text-muted-foreground text-sm"
        >
          Need help setting up? Come to our next meetup — we'll get you running. 🦞
        </motion.p>
      </div>
    </section>
  );
};

export default GetStartedSection;
