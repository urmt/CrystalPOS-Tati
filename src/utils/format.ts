// =============================================================================
// FORMAT UTILITIES
// =============================================================================

export const formatCurrency = (amount: number): string => {
  return `₡${amount.toLocaleString('es-CR')}`;
};

export const formatDate = (dateString: string, format: 'short' | 'long' | 'time' = 'short'): string => {
  const date = new Date(dateString);
  if (format === 'long') {
    return date.toLocaleDateString('es-CR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
  if (format === 'time') {
    return date.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('es-CR');
};

export const formatWeight = (grams: number): string => {
  if (grams >= 1000) return `${(grams / 1000).toFixed(2)}kg`;
  return `${grams}g`;
};

export const getStockStatus = (current: number, minThreshold: number): 'success' | 'warning' | 'error' => {
  if (current <= 0) return 'error';
  if (current < minThreshold * 0.1) return 'error';
  if (current < minThreshold) return 'warning';
  return 'success';
};

export const getStockStatusLabel = (current: number, minThreshold: number): string => {
  if (current <= 0) return 'Out';
  if (current < minThreshold * 0.1) return 'Critical';
  if (current < minThreshold) return 'Low';
  return 'In Stock';
};