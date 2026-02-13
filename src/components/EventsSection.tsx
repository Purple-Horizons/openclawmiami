import { motion } from "framer-motion";

const EventsSection = () => {
  return (
    <section id="events" className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Meetups & <span className="text-gradient-sunset">Events</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Join Miami's OpenClaw community in person. Monthly meetups, workshops, and hack sessions.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center"
        >
          <p className="text-sm text-muted-foreground mb-4">
            First meetup at capacity — waitlist open
          </p>
          <iframe
            src="https://luma.com/embed/event/evt-hovN3V9S5kmmPHp/simple"
            width="600"
            height="450"
            frameBorder="0"
            style={{ border: "1px solid #bfcbda88", borderRadius: "4px" }}
            allow="fullscreen; payment"
            aria-hidden="false"
            tabIndex={0}
          />
        </motion.div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Waitlist open — join to get notified if spots open up.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-10 text-center"
        >
          <p className="text-sm text-muted-foreground mb-3">
            Get notified for future events
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="https://luma.com/Openclaw"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-10 px-4 py-2 text-sm font-semibold rounded-md bg-gradient-sunset text-primary-foreground shadow-coral hover:opacity-90 transition-all duration-300"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 8v13H3V8l9-5 9 5zm-9-2.5L5.5 9h13L12 5.5zM5 11v8h14v-8H5z" />
              </svg>
              Subscribe on Luma
            </a>
            <a
              href="https://x.com/openclawmiami"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-10 px-4 py-2 text-sm font-medium rounded-md border-2 border-primary/50 text-foreground hover:border-primary hover:bg-primary/10 transition-all duration-300"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              @openclawmiami
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default EventsSection;
