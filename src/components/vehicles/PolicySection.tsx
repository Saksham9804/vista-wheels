import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, AlertTriangle, FileText, RefreshCw, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

interface PolicyDropdownProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function PolicyDropdown({ icon, title, children }: PolicyDropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 bg-secondary hover:bg-secondary/80 transition-colors cursor-pointer min-h-[44px]"
      >
        <span className="flex items-center gap-3 font-semibold text-foreground text-left">
          {icon}
          {title}
        </span>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-muted-foreground transition-transform duration-300 flex-shrink-0",
            open && "rotate-180"
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 py-5 bg-card text-sm leading-[1.8] text-muted-foreground space-y-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function PolicySections() {
  return (
    <div className="space-y-4">
      {/* Things to Remember */}
      <PolicyDropdown
        icon={<AlertTriangle className="w-5 h-5 text-warning" />}
        title="Things to Remember"
      >
        <ul className="list-disc ml-5 space-y-3">
          <li>Minimum age of Renter should be 20 years. Orders will be cancelled with no rent refund in case the renter is underage as per the clause.</li>
          <li>Booking of any bike is subject to availability. Get&Go reserves the right to cancel any booking if deemed necessary.</li>
          <li>In case of damage to the bike due to accident/mishandling/carelessness, appropriate charges will be calculated by our partner and the customer is liable to pay the same to our partner.</li>
          <li>In the case of theft, the customer is liable to pay in full the market rate of that product to our partner. During the rental tenure, full responsibility of the bike is on renter.</li>
          <li>In case of any fault or failure the customer needs to inform Customer Support / Partner immediately.</li>
          <li>The renter is not authorised to lend the Bike to any other person without informing Get&Go. In such cases the renter needs to verify documents of the additional Renter before the start of the trip. Failure to do so would attract a penalty of Rs 1000.</li>
          <li>Mentioned Security Deposit on every bike is mandatory. In case a customer refuses to pay Security Deposit, order stands cancel without any refunds.</li>
          <li>Pickup date/time and location cannot be changed once a booking is confirmed.</li>
          <li>The customer has to return the bike at the same location from where it was picked up. No requests will be accommodated for a change in drop location.</li>
          <li>If a customer rides the bike for more than 1500 km during the trip, he/she will have to get the bike serviced or can pay service charge.</li>
        </ul>

        <div className="mt-4 p-4 bg-secondary rounded-lg">
          <p className="font-semibold text-foreground mb-2">Daily Kilometre Limit of Bikes:</p>
          <ul className="list-disc ml-5 space-y-1">
            <li>100-125cc — 150km/day</li>
            <li>150-220cc — 200km/day</li>
            <li>300-500cc — 250km/day</li>
            <li>Superbikes — 150km/day</li>
          </ul>
        </div>
      </PolicyDropdown>

      {/* Documentation & Security Deposit Policy */}
      <PolicyDropdown
        icon={<FileText className="w-5 h-5 text-primary" />}
        title="Documentation & Security Deposit Policy"
      >
        <p className="font-semibold text-foreground">Documents Required:</p>
        <ul className="list-disc ml-5 space-y-3">
          <li>Renter should have a valid Driving Licence.</li>
          <li>Any two Govt. issued Documents will be verified at the time of pickup.</li>
          <li>Out of which one document will be deposited at the time of pickup and returned during drop off. In case of failure to furnish the documents, the order stands cancelled. No rent refund would be issued in such cases.</li>
        </ul>

        <div className="mt-4 p-4 bg-secondary rounded-lg">
          <p className="font-semibold text-foreground mb-2">Valid Documents:</p>
          <ul className="ml-5 space-y-1">
            <li>✓ Passport</li>
            <li>✓ Election Card</li>
            <li>✓ Aadhar Card</li>
            <li>✓ PAN Card</li>
            <li>✓ ID Issued by Central or State Govt. (Any of the above)</li>
            <li>✓ Driving Licence (Digi-Locker is also accepted)</li>
          </ul>
          <p className="mt-3 font-medium text-foreground text-xs">Note: Driving Licence is mandatory along with any one of the above documents.</p>
        </div>
      </PolicyDropdown>

      {/* Cancellation & Rescheduling */}
      <PolicyDropdown
        icon={<RefreshCw className="w-5 h-5 text-destructive" />}
        title="Cancellation & Rescheduling"
      >
        <p className="font-semibold text-foreground">Return & Extension Policy:</p>
        <ul className="list-disc ml-5 space-y-3">
          <li>The vehicle needs to be returned on or before the specified Date & time as mentioned during booking on the website/invoice copy. Delay in dropping vehicles by more than 30min, will attract a penalty of ₹100/hr.</li>
          <li>Please call our Customer Support in case you want to extend the Booking. Your trip will be extended if the vehicle is available. Trip extensions are subject to availability. Extension requests should be made at least 4 hrs before the Drop-off time. Extension without informing us, will attract a penalty of ₹100/hour + daily rental.</li>
          <li>As per the booking schedule, renter needs to return the vehicle on time. In case the customer doesn't accept or drop the bike in spite of a denied extension request, penalty charges of ₹500/hr + daily rent of the bike will be applicable.</li>
        </ul>

        <div className="mt-4 p-4 bg-secondary rounded-lg">
          <p className="font-semibold text-foreground mb-2">Cancellation Charges:</p>
          <ul className="ml-5 space-y-2">
            <li><span className="font-medium text-foreground">No Show / After Pickup time:</span> → 100% deduction</li>
            <li><span className="font-medium text-foreground">In case of partial payment:</span> → 100% deduction</li>
            <li className="mt-2">
              <span className="font-medium text-foreground">In case of full payment:</span>
              <ul className="list-disc ml-5 mt-1 space-y-1">
                <li>Before 72 hrs of the pickup time → 25% deduction</li>
                <li>Between 24-72 hrs of the pickup time → 75% deduction</li>
                <li>Between 0-24 hrs of the pickup time → 100% deduction</li>
              </ul>
            </li>
          </ul>
        </div>
      </PolicyDropdown>

      {/* Need Help */}
      <div className="rounded-xl border border-border bg-card p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Phone className="w-6 h-6 text-primary flex-shrink-0" />
        <div>
          <p className="font-semibold text-foreground mb-1">Need Help?</p>
          <p className="text-sm text-muted-foreground">
            Customer Support: <a href="mailto:support@getandgo.com" className="text-primary hover:underline">support@getandgo.com</a>
          </p>
          <p className="text-sm text-muted-foreground">Available: 24/7</p>
        </div>
      </div>
    </div>
  );
}
