import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Rahul Sharma",
    location: "Delhi",
    rating: 5,
    text: "Amazing experience! Booked a Royal Enfield for a weekend trip. The bike was in perfect condition and the pickup was super smooth.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
    vehicle: "Royal Enfield Classic 350",
  },
  {
    name: "Priya Menon",
    location: "Bangalore",
    rating: 5,
    text: "Best prices in the market! I've compared with other services and Vista always has the lowest rates. Customer support is excellent too.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
    vehicle: "Honda Activa 6G",
  },
  {
    name: "Amit Patel",
    location: "Mumbai",
    rating: 5,
    text: "Rented a car for a family trip to Lonavala. Doorstep delivery saved us so much time. Will definitely use Vista again!",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80",
    vehicle: "Maruti Swift",
  },
  {
    name: "Sneha Reddy",
    location: "Hyderabad",
    rating: 4,
    text: "Great selection of scooters. I use Vista for my daily commute whenever my own vehicle is in service. Reliable and affordable!",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
    vehicle: "TVS Jupiter",
  },
];

export function Testimonials() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            What Our Customers Say
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join 10,000+ happy riders who trust Vista for their vehicle rental needs
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-6 bg-card rounded-2xl border border-border shadow-soft"
            >
              {/* Quote Icon */}
              <Quote className="w-10 h-10 text-primary/20 mb-4" />

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < testimonial.rating
                        ? "fill-warning text-warning"
                        : "fill-muted text-muted"
                    }`}
                  />
                ))}
              </div>

              {/* Text */}
              <p className="text-foreground mb-6 leading-relaxed">
                "{testimonial.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-semibold text-foreground">
                    {testimonial.name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.location} • {testimonial.vehicle}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-accent rounded-full">
            <div className="flex -space-x-2">
              {testimonials.slice(0, 4).map((t, i) => (
                <img
                  key={i}
                  src={t.avatar}
                  alt=""
                  className="w-8 h-8 rounded-full border-2 border-background object-cover"
                />
              ))}
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-warning text-warning" />
              <span className="font-semibold text-foreground">4.8</span>
              <span className="text-muted-foreground">from 10,000+ reviews</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
