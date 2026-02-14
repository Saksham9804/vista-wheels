/**
 * Rental pricing calculation utilities
 * 
 * Pricing formula:
 * - Base Rent = rent_per_day × billed_days
 * - Platform Fee = Base Rent × 10%
 * - Gateway Fee = Base Rent × 2.5%
 * - Doorstep Delivery = ₹150 (if selected)
 * - Security Deposit = charged separately (refundable)
 * 
 * Minimum rental: 24 hours = 1 day charge
 * Duration > 24h: rounded up to next full day
 */

export interface PriceBreakdown {
  actualHours: number;
  billedDays: number;
  baseRent: number;
  platformFee: number;
  gatewayFee: number;
  deliveryCharge: number;
  totalPayable: number;
  securityDeposit: number;
  partnerPayout: number;
}

export function calculateRentalDays(pickupDate: string, pickupTime: string, returnDate: string, returnTime: string): { hours: number; days: number } {
  const pickup = new Date(`${pickupDate}T${pickupTime}:00`);
  const returnD = new Date(`${returnDate}T${returnTime}:00`);
  const diffMs = returnD.getTime() - pickup.getTime();
  const hours = diffMs / (1000 * 60 * 60);
  
  if (hours <= 0) return { hours: 0, days: 0 };
  if (hours <= 24) return { hours, days: 1 };
  return { hours, days: Math.ceil(hours / 24) };
}

export function calculatePriceBreakdown(
  pricePerDay: number,
  billedDays: number,
  securityDeposit: number,
  isDoorstepDelivery: boolean
): PriceBreakdown {
  const baseRent = pricePerDay * billedDays;
  const platformFee = Math.round(baseRent * 0.10);
  const gatewayFee = Math.round(baseRent * 0.025 * 100) / 100;
  const deliveryCharge = isDoorstepDelivery ? 150 : 0;
  const totalPayable = baseRent + platformFee + gatewayFee + deliveryCharge;
  const partnerPayout = baseRent - platformFee;

  return {
    actualHours: 0,
    billedDays,
    baseRent,
    platformFee,
    gatewayFee,
    deliveryCharge,
    totalPayable,
    securityDeposit,
    partnerPayout,
  };
}

export function formatDurationMessage(hours: number, billedDays: number): string {
  if (hours <= 0) return "";
  const roundedHours = Math.round(hours);
  if (hours <= 24) {
    return `Selected duration: ${roundedHours} hours → Charged as 1 day`;
  }
  return `Selected duration: ${roundedHours} hours → Charged as ${billedDays} days`;
}
