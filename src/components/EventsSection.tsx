import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Calendar, MapPin, ExternalLink } from "lucide-react";

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

        {/* Event card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-card border border-border rounded-xl p-8 mb-6 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-sunset" />
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-display font-semibold text-xl mb-1">Next OpenClaw Miami Meetup</h3>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> Check lu.ma for dates
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> Miami, FL
                </span>
              </div>
              <p className="text-muted-foreground text-sm mt-3">
                Demos, setup help, and building together. All skill levels welcome — bring a laptop!
              </p>
            </div>
            <Button variant="hero" asChild className="sm:self-center flex-shrink-0">
              <a href="https://lu.ma/openclaw" target="_blank" rel="noopener noreferrer">
                RSVP <ExternalLink className="w-4 h-4 ml-1" />
              </a>
            </Button>
          </div>
        </motion.div>

        <div className="text-center space-y-3">
          <Button variant="hero-outline" asChild>
            <a href="https://lu.ma/openclaw" target="_blank" rel="noopener noreferrer">
              View Full Calendar on Lu.ma
            </a>
          </Button>
          <p className="text-sm text-muted-foreground">
            Want to host an event? Submit yours to the calendar.
          </p>
        </div>
      </div>
    </section>
  );
};

export default EventsSection;
