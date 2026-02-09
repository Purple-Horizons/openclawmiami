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
          className="bg-card border border-border rounded-xl overflow-hidden"
        >
          <iframe
            src="https://luma.com/embed/calendar/cal-YUQbpD9Pohuzxfw/events"
            width="100%"
            height="450"
            frameBorder="0"
            allowFullScreen
            aria-hidden="false"
            tabIndex={0}
            className="w-full"
            style={{ border: "none" }}
          />
        </motion.div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Want to host an event? Submit yours to the calendar.
        </p>
      </div>
    </section>
  );
};

export default EventsSection;
