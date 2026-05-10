import { Item } from '@/types';

// =============================================================================
// Stock Warning System
// Returns warning level based on days until stock runs out
// =============================================================================
export const getStockWarning = (item: Item): { level: 'none' | 'warning' | 'critical' | 'out'; days: number; message: string } => {
  const stock = item.current_weight_grams || 0;
  const rate = item.depletion_rate_grams_per_day || 0;
  
  if (stock <= 0) {
    return { level: 'out', days: 0, message: 'OUT OF STOCK' };
  }
  
  if (rate <= 0) {
    return { level: 'none', days: 999, message: 'In stock - rate unknown' };
  }
  
  const daysUntilEmpty = Math.round(stock / rate);
  
  if (daysUntilEmpty <= 30) {
    return { level: 'critical', days: daysUntilEmpty, message: `Run out in ${daysUntilEmpty} days!` };
  }
  
  if (daysUntilEmpty <= 60) {
    return { level: 'warning', days: daysUntilEmpty, message: `Low stock - ${daysUntilEmpty} days left` };
  }
  
  return { level: 'none', days: daysUntilEmpty, message: `~${daysUntilEmpty} days` };
};
