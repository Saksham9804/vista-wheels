import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";

const footerLinks = {
  quickLinks: [
  { name: "Bike Rental", href: "/vehicles?type=bike" },
  { name: "Scooty Rental", href: "/vehicles?type=scooty" },
  { name: "Car Rental", href: "/vehicles?type=car" },
  { name: "About Us", href: "/about" },
  { name: "Contact", href: "/contact" }],

  cities: [
  { name: "Delhi", href: "/vehicles?city=delhi" },
  { name: "Mumbai", href: "/vehicles?city=mumbai" },
  { name: "Bangalore", href: "/vehicles?city=bangalore" },
  { name: "Chennai", href: "/vehicles?city=chennai" },
  { name: "Hyderabad", href: "/vehicles?city=hyderabad" }],

  support: [
  { name: "FAQs", href: "#faq" },
  { name: "Terms & Conditions", href: "/terms" },
  { name: "Privacy Policy", href: "/privacy" },
  { name: "Cancellation Policy", href: "/cancellation" },
  { name: "Partner with Us", href: "/partner" }]

};

const socialLinks = [
{ icon: Facebook, href: "#" },
{ icon: Twitter, href: "#" },
{ icon: Instagram, href: "#" },
{ icon: Linkedin, href: "#" }];


export function Footer() {
  return (
    <footer className="bg-charcoal text-primary-foreground">
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">G</span>
              </div>
              <span className="text-2xl font-bold">Get&Go</span>
            </Link>
            <p className="text-primary-foreground/70 mb-6 max-w-sm">
              Get&Go — India's largest vehicle rental platform. Rent bikes, scooters, and cars at the lowest prices with 24/7 customer support.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social, index) =>
              <a
                key={index}
                href={social.href}
                className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center hover:bg-primary transition-colors">

                  <social.icon className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-3">
              {footerLinks.quickLinks.map((link) =>
              <li key={link.name}>
                  <Link
                  to={link.href}
                  className="text-primary-foreground/70 hover:text-primary transition-colors">

                    {link.name}
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Cities */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Top Cities</h4>
            <ul className="space-y-3">
              {footerLinks.cities.map((link) =>
              <li key={link.name}>
                  <Link
                  to={link.href}
                  className="text-primary-foreground/70 hover:text-primary transition-colors">

                    {link.name}
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) =>
              <li key={link.name}>
                  <Link
                  to={link.href}
                  className="text-primary-foreground/70 hover:text-primary transition-colors">

                    {link.name}
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-12 pt-8 border-t border-primary-foreground/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-wrap justify-center md:justify-start gap-6">
              <a href="tel:+911234567890" className="flex items-center gap-2 text-primary-foreground/70 hover:text-primary transition-colors">9
+91 9569598949
                <Phone className="w-4 h-4" />
                +91 123 456 7890
              </a>
              <a href="mailto:support@vistarental.com" className="flex items-center gap-2 text-primary-foreground/70 hover:text-primary transition-colors">
                <Mail className="w-4 h-4" />
                support@vistarental.com
              </a>
              <span className="flex items-center gap-2 text-primary-foreground/70">
                <MapPin className="w-4 h-4" />
                Available in 50+ cities across India
              </span>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-primary-foreground/10 text-center">
          <p className="text-primary-foreground/50 text-sm">
            © {new Date().getFullYear()} Get&Go Vehicle Rentals. All rights reserved.
          </p>
        </div>
      </div>
    </footer>);
}