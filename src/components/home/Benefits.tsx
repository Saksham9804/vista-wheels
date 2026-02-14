import { motion } from "framer-motion";
import { Shield, Wallet, Headphones, Clock, MapPin, ThumbsUp } from "lucide-react";

const benefits = [
  {
    icon: Wallet,
    title: "Lowest Prices",
    description: "Best rates guaranteed with no hidden charges. Pay only for what you use.",
  },
  {
    icon: Shield,
    title: "Fully Insured",
    description: "All vehicles come with comprehensive insurance for your peace of mind.",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Round-the-clock customer support via call, chat, and WhatsApp.",
  },
  {
    icon: Clock,
    title: "Flexible Booking",
    description: "Book for hours, days, or months. Free cancellation up to 24 hours.",
  },
  {
    icon: MapPin,
    title: "Doorstep Delivery",
    description: "Get your vehicle delivered to your location – airport, hotel, or home.",
  },
  {
    icon: ThumbsUp,
    title: "Well Maintained",
    description: "Every vehicle is sanitized and serviced before each rental.",
  },
];

export function Benefits() {
  return (
    <section className="py-20 bg-charcoal text-primary-foreground">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Why Choose <span className="text-primary">Get&Go</span>?
          </h2>
          <p className="text-primary-foreground/70 max-w-2xl mx-auto">
            We're committed to providing the best vehicle rental experience in India
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group p-6 rounded-2xl bg-primary-foreground/5 border border-primary-foreground/10 hover:bg-primary-foreground/10 hover:border-primary/30 transition-all"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center mb-5 group-hover:bg-primary/30 transition-colors">
                <benefit.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
              <p className="text-primary-foreground/70">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
