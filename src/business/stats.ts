import type { BusinessCurrency } from '../types';

/** Formats cents as money in the chosen currency, e.g. 123456 CZK -> "1,234.56 Kč" or "€1,234.56". */
export function formatMoney(cents: number, currency: BusinessCurrency): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100);
  const frac = String(abs % 100).padStart(2, '0');
  const value = `${whole.toLocaleString()}.${frac}`;
  return currency === 'czk' ? `${value} Kč` : `${sign}€${value}`;
}
