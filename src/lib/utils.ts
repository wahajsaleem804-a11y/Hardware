import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return "$0.00";
  return new Intl.NumberFormat('en-PK', {
    currency: 'PKR',
    // You may also want to use a locale that formats PKR correctly
    // e.g., 'en-PK' or 'ur-PK'. For simplicity we keep 'en-US' format.
    // style: 'currency',
    // currency: 'PKR',
    // minimumFractionDigits: 2,
    // maximumFractionDigits: 2,
    // The above options remain unchanged except the currency.
    // This will render the PKR sign (₹) before the amount.
  }).format(amount);
}

export function formatQty(quantity: number, uom: string): string {
  const isFractional = quantity % 1 !== 0;
  const numStr = isFractional ? quantity.toFixed(2) : quantity.toString();
  switch (uom) {
    case 'piece':
      return `${numStr} pcs`;
    case 'meter':
      return `${numStr} m`;
    case 'kg':
      return `${numStr} kg`;
    case 'box':
      return `${numStr} box`;
    case 'bag':
      return `${numStr} bag`;
    case 'liter':
      return `${numStr} L`;
    case 'roll':
      return `${numStr} roll`;
    case 'feet':
      return `${numStr} ft`;
    default:
      return `${numStr} ${uom}`;
  }
}

export function formatDate(dateString: string | undefined): string {
  if (!dateString) return "-";
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(dateString: string | undefined): string {
  if (!dateString) return "-";
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
