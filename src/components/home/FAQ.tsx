import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What documents are required to rent a vehicle?",
    answer: "You need a valid government-issued ID (Aadhar Card/Passport) and a valid driving license. For cars, an original driving license with LMV authorization is mandatory. All documents must be valid and not expired.",
  },
  {
    question: "What is the minimum age to rent a vehicle?",
    answer: "The minimum age to rent a two-wheeler is 18 years, and for cars, it's 21 years. You must have held a valid driving license for at least 1 year for cars.",
  },
  {
    question: "Is there a security deposit?",
    answer: "Yes, a refundable security deposit is required at the time of pickup. The amount varies by vehicle type: ₹2,000-3,000 for two-wheelers and ₹5,000-10,000 for cars. The deposit is refunded within 24-48 hours after the vehicle is returned in good condition.",
  },
  {
    question: "Can I extend my rental period?",
    answer: "Yes, you can extend your rental anytime through the app or by calling our customer support. Extensions are subject to vehicle availability and will be charged at the applicable daily rate.",
  },
  {
    question: "What happens if I return the vehicle late?",
    answer: "A grace period of 30 minutes is provided. After that, late returns are charged on an hourly basis (1/4th of the daily rate per hour) for the first 3 hours. Beyond 3 hours, a full day charge applies.",
  },
  {
    question: "Is fuel included in the rental price?",
    answer: "Vehicles are provided with a minimum fuel level. You're expected to return the vehicle with the same fuel level. For electric scooters, charging is free at our pickup locations.",
  },
  {
    question: "What if the vehicle breaks down during my rental?",
    answer: "We provide 24/7 roadside assistance. Simply call our support number, and we'll arrange for a replacement vehicle or repair at no additional cost if the breakdown is not due to misuse.",
  },
  {
    question: "Can I cancel my booking?",
    answer: "Yes, free cancellation is available up to 24 hours before the pickup time. Cancellations within 24 hours may incur a fee of 10-25% depending on how close to the pickup time you cancel.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Got questions? We've got answers. Check out our most common queries below.
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card border border-border rounded-xl px-6 data-[state=open]:shadow-soft"
              >
                <AccordionTrigger className="text-left hover:no-underline py-5">
                  <span className="font-semibold text-foreground pr-4">
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-muted-foreground mb-2">
            Still have questions?
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
          >
            Contact our support team
          </a>
        </motion.div>
      </div>
    </section>
  );
}
