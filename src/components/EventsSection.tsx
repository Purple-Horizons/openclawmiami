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
          className="flex justify-center"
        >
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
          RSVP to join us at our next meetup.
        </p>
      </div>
    </section>
  );
};

export default EventsSection;
