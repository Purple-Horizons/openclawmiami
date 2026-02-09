import { motion } from "framer-motion";
import { Bot, MessageSquare, Cpu, Sparkles } from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "Your Own AI Assistant",
    description: "OpenClaw is an open-source AI assistant that runs on your own computer. No cloud lock-in, no subscriptions — just you and your AI.",
  },
  {
    icon: MessageSquare,
    title: "Works Where You Chat",
    description: "Connect through WhatsApp, Telegram, Discord, Slack, Signal, or iMessage. Talk to your AI where you already are.",
  },
  {
    icon: Cpu,
    title: "Automates Everything",
    description: "Email, calendar, browsing, coding, smart home — OpenClaw handles it. Extend it with community-built skills from ClawHub.",
  },
  {
    icon: Sparkles,
    title: "Any Model, Your Choice",
    description: "Use Claude, GPT, DeepSeek, or local models. Swap freely — your data stays yours. Built by Peter Steinberger and a global community.",
  },
];

const WhatIsSection = () => {
  return (
    <section id="what" className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4 text-center">
            What Is <span className="text-gradient-sunset">OpenClaw</span>?
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            The open-source AI assistant with 145K+ GitHub stars, featured in MacStories and Forbes.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-card border border-border rounded-xl p-6 hover:border-primary/30 transition-colors duration-300"
            >
              <feature.icon className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-display font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-8 text-muted-foreground"
        >
          Learn more at{" "}
          <a
            href="https://openclaw.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            openclaw.ai →
          </a>
        </motion.p>
      </div>
    </section>
  );
};

export default WhatIsSection;
