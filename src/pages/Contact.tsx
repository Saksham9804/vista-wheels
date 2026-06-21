import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Clock, MessageSquare, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const contactMethods = [
  {
    icon: Phone,
    label: "Phone",
    value: "+91 923 645 1691",
    href: "tel:+919236451691",
    description: "Call us anytime for instant support",
  },
  {
    icon: Mail,
    label: "Email",
    value: "getandgo98@gmail.com",
    href: "mailto:getandgo98@gmail.com",
    description: "Drop us a line and we\'ll reply within 24 hours",
  },
  {
    icon: MapPin,
    label: "Coverage",
    value: "50+ Cities Across India",
    description: "Serving riders in Delhi, Mumbai, Bangalore, and more",
  },
  {
    icon: Clock,
    label: "Availability",
    value: "24 / 7 Support",
    description: "Round-the-clock assistance for all your needs",
  },
];

const supportChannels = [
  {
    icon: MessageSquare,
    title: "Live Chat",
    text: "Talk to our support team in real time for quick queries and booking help.",
  },
  {
    icon: Headphones,
    title: "Partner Support",
    text: "Need help listing your vehicle or managing payouts? We\'ve got you covered.",
  },
];

function Contact() {
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        {/* Hero */}
        <section className="pt-32 pb-16">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-2xl mx-auto"
            >
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Contact Us
              </h1>
              <p className="text-muted-foreground text-lg">
                Have a question, feedback, or need help with a booking? Reach out — we\'re here to help.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Contact Cards */}
        <section className="pb-20">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {contactMethods.map((method, index) => (
                <motion.div
                  key={method.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="p-6 bg-card rounded-2xl border border-border shadow-soft text-center group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <method.icon className="w-7 h-7" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{method.label}</h3>
                  {method.href ? (
                    <a
                      href={method.href}
                      className="text-primary font-medium hover:underline"
                      onClick={(e) => {
                        if (!method.href.startsWith("tel:")) return;
                        e.preventDefault();
                        handleCopy(method.value);
                      }}
                    >
                      {method.value}
                    </a>
                  ) : (
                    <p className="text-primary font-medium">{method.value}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">{method.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Support Channels */}
        <section className="pb-20 bg-accent/30">
          <div className="container mx-auto px-4 lg:px-8 py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-foreground mb-3">More Ways to Reach Us</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Choose the channel that works best for you — we reply fast across all platforms.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {supportChannels.map((channel, index) => (
                <motion.div
                  key={channel.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="p-6 bg-card rounded-2xl border border-border shadow-soft flex gap-5"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex-shrink-0 flex items-center justify-center">
                    <channel.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{channel.title}</h3>
                    <p className="text-sm text-muted-foreground">{channel.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Direct CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-12 text-center"
            >
              <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 bg-card rounded-2xl border border-border shadow-soft">
                <div className="text-left">
                  <p className="font-semibold text-foreground">Prefer to talk right now?</p>
                  <p className="text-sm text-muted-foreground">Tap to copy the number and call us.</p>
                </div>
                <Button onClick={() => handleCopy("+91 923 645 1691")} className="gap-2">
                  <Phone className="w-4 h-4" />
                  Copy Phone Number
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default Contact;
