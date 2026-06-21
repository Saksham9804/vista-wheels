import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { MapPin, ArrowRight } from "lucide-react";

const cities = [
  {
    name: "Delhi",
    image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&q=80",
    slug: "delhi",
  },
  {
    name: "Mumbai",
    image: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600&q=80",
    slug: "mumbai",
  },
  {
    name: "Bangalore",
    image: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=600&q=80",
    slug: "bangalore",
  },
  {
    name: "Goa",
    image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&q=80",
    slug: "goa",
  },
  {
    name: "Jaipur",
    image: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=600&q=80",
    slug: "jaipur",
  },
  {
    name: "Chennai",
    image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600&q=80",
    slug: "chennai",
  },
];

export function Cities() {
  return (
    <section id="cities" className="py-20 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">We're in Your City</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Available in multiple cities in India with convenient pickup locations
          </p>
        </motion.div>

        {/* Cities Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {cities.map((city, index) => (
            <motion.div
              key={city.slug}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <Link
                to={`/vehicles?city=${city.slug}`}
                className="group block relative aspect-[3/4] rounded-2xl overflow-hidden"
              >
                {/* Image */}
                <img
                  src={city.image}
                  alt={city.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/40 to-transparent" />

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-lg font-bold text-primary-foreground mb-1">{city.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-sm text-primary-foreground/80">
                      <MapPin className="w-3.5 h-3.5" />
                      Available
                    </span>
                    <ArrowRight className="w-4 h-4 text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
    </section>
  );
}
