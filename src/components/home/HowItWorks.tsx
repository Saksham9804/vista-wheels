import { motion } from "framer-motion";
import { MapPin, CalendarCheck, Car } from "lucide-react";

const steps = [
  {
    icon: MapPin,
    title: "Choose Location",
    description: "Select your city and preferred pickup point from 50+ locations across India",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: CalendarCheck,
    title: "Confirm Booking",
    description: "Pick your dates, select your vehicle, and complete the booking in minutes",
    color: "bg-green-100 text-green-600",
  },
  {
    icon: Car,
    title: "Pickup & Ride",
    description: "Collect your vehicle or get it delivered to your doorstep and enjoy your ride",
    color: "bg-primary/10 text-primary",
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Renting a vehicle with Vista is quick and easy. Just follow these three simple steps.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connection Line */}
          <div className="hidden md:block absolute top-20 left-1/4 right-1/4 h-0.5 bg-border" />

          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="relative text-center"
            >
              {/* Step Number */}
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-card shadow-soft border border-border mb-6 relative z-10">
                <step.icon className={`w-8 h-8 ${step.color.split(' ')[1]}`} />
              </div>

              {/* Number Badge */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center z-20">
                {index + 1}
              </div>

              <h3 className="text-xl font-bold text-foreground mb-3">
                {step.title}
              </h3>
              <p className="text-muted-foreground max-w-xs mx-auto">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
