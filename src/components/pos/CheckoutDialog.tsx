import React from 'react';
import { 
  Box, Paper, Typography, IconButton, Divider, TextField, Button, 
  FormControl, RadioGroup, FormControlLabel, Radio, CircularProgress,
  Checkbox, Select, MenuItem, InputLabel
} from '@mui/material';
import { Close, Add, Remove } from '@mui/icons-material';
import { formatCurrency } from '@/utils/format';
import { COLORS } from '@/app/pos/constants';

interface CheckoutDialogProps {
  open: boolean;
  onClose: () => void;
  cart: any[];
  rawTotal: number;
  discountPercent: number;
  setDiscountPercent: (p: number) => void;
  discountOverride: number | null;
  setDiscountOverride: (p: number | null) => void;
  paymentMethod: string;
  setPaymentMethod: (m: any) => void;
  processing: boolean;
  onCheckout: () => void;
  paymentSettings: any;
  isOnline: boolean;
  // Receipt props
  wantReceipt: boolean;
  setWantReceipt: (v: boolean) => void;
  countryCode: string;
  setCountryCode: (c: string) => void;
  customerPhone: string;
  customerName: string;
  openNumberPad: (type: 'phone' | 'name', currentVal: string) => void;
}

export const CheckoutDialog: React.FC<CheckoutDialogProps> = ({
  open, onClose, cart, rawTotal, discountPercent, setDiscountPercent,
  discountOverride, setDiscountOverride, paymentMethod, setPaymentMethod,
  processing, onCheckout, paymentSettings, isOnline,
  wantReceipt, setWantReceipt, countryCode, setCountryCode,
  customerPhone, customerName, openNumberPad
}) => {
  if (!open) return null;

  return (
    <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <Paper sx={{ p: 3, m: 2, maxWidth: 400, width: '100%', bgcolor: 'white', maxHeight: '90vh', overflowY: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ color: COLORS.darkText }}>Pago / Checkout</Typography>
          <IconButton size="small" onClick={onClose}><Close /></IconButton>
        </Box>
        <Divider sx={{ mb: 2 }} />
        
        <Box sx={{ maxHeight: '20vh', overflowY: 'auto', mb: 1 }}>
          {cart.map(c => (
            <Box key={c.item.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
              <Typography sx={{ color: COLORS.lightText, fontSize: '0.9rem' }}>{c.quantity}x {c.item.name}</Typography>
              <Typography sx={{ color: COLORS.darkText, fontSize: '0.9rem' }}>{formatCurrency(c.subtotal)}</Typography>
            </Box>
          ))}
        </Box>
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography sx={{ color: COLORS.lightText, flex: 1 }}>Subtotal:</Typography>
          <Typography sx={{ color: COLORS.darkText, fontWeight: 'bold' }}>{formatCurrency(rawTotal)}</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography sx={{ color: COLORS.lightText, flex: 1 }}>Descuento (%):</Typography>
          <IconButton onClick={() => setDiscountPercent(Math.max(0, discountPercent - 5))} size="small" sx={{ bgcolor: 'grey.200' }}><Remove /></IconButton>
          <TextField 
            type="number" 
            size="small" 
            value={discountPercent} 
            onChange={(e) => { setDiscountPercent(Number(e.target.value)); setDiscountOverride(null); }}
            sx={{ width: 60, bgcolor: 'white' }}
            inputProps={{ style: { textAlign: 'center' } }}
          />
          <IconButton onClick={() => setDiscountPercent(Math.min(100, discountPercent + 5))} size="small" sx={{ bgcolor: 'grey.200' }}><Add /></IconButton>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography sx={{ color: COLORS.lightText, flex: 1 }}>O precio final:</Typography>
          <IconButton onClick={() => setDiscountOverride(Math.max(0, (discountOverride || rawTotal) - 1000))} size="small" sx={{ bgcolor: 'grey.200' }}><Remove /></IconButton>
          <TextField 
            type="number" 
            size="small" 
            value={discountOverride !== null ? discountOverride : ''} 
            placeholder={formatCurrency(rawTotal)}
            onChange={(e) => setDiscountOverride(e.target.value ? Number(e.target.value) : null)}
            sx={{ width: 100, bgcolor: 'white' }}
            inputProps={{ style: { textAlign: 'center' } }}
          />
          <IconButton onClick={() => setDiscountOverride((discountOverride || rawTotal) + 1000)} size="small" sx={{ bgcolor: 'grey.200' }}><Add /></IconButton>
        </Box>

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" sx={{ mb: 1, color: COLORS.darkText }}>Método de Pago / Payment Method:</Typography>
        <FormControl component="fieldset">
          <RadioGroup value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            {paymentSettings?.cash_enabled && <FormControlLabel value="cash" control={<Radio />} label="Efectivo / Cash" />}
            {paymentSettings?.sinpe_enabled && <FormControlLabel value="sinpe" control={<Radio />} label="SINPE Móvil" />}
            {paymentSettings?.card_enabled && <FormControlLabel value="card" control={<Radio />} label="Tarjeta / Card" />}
            {paymentSettings?.lightning_enabled && <FormControlLabel value="lightning" control={<Radio />} label="⚡ Lightning" />}
          </RadioGroup>
        </FormControl>

        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography sx={{ mb: 1, fontWeight: 'bold', color: COLORS.darkText, fontSize: '0.9rem' }}>
            ¿Recibo por WhatsApp? (opcional)
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Checkbox checked={wantReceipt} onChange={(e) => setWantReceipt(e.target.checked)} size="small" />
            <Typography variant="caption" sx={{ color: COLORS.lightText }}>
              Si el cliente quiere recibo por WhatsApp
            </Typography>
          </Box>
          
          {wantReceipt && (
            <>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <FormControl size="small" sx={{ minWidth: 90 }}>
                  <Select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} sx={{ bgcolor: 'white', fontSize: '0.8rem' }}>
                    <MenuItem value="+1">+1 US/CA</MenuItem>
                    <MenuItem value="+52">+52 MX</MenuItem>
                    <MenuItem value="+506">+506 CR</MenuItem>
                    <MenuItem value="+57">+57 CO</MenuItem>
                    <MenuItem value="+58">+58 VE</MenuItem>
                    <MenuItem value="+54">+54 AR</MenuItem>
                    <MenuItem value="+55">+55 BR</MenuItem>
                    <MenuItem value="+39">+39 IT</MenuItem>
                    <MenuItem value="+33">+33 FR</MenuItem>
                    <MenuItem value="+34">+34 ES</MenuItem>
                    <MenuItem value="+49">+49 DE</MenuItem>
                    <MenuItem value="+31">+31 NL</MenuItem>
                  </Select>
                </FormControl>
                
                <Box 
                  onClick={() => openNumberPad('phone', customerPhone)}
                  sx={{ 
                    flex: 1, p: 1, borderRadius: 1, border: '1px solid #ccc', bgcolor: 'white',
                    cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' }
                  }}
                >
                  <Typography sx={{ color: customerPhone ? '#333' : '#999', fontSize: '0.9rem' }}>
                    {customerPhone || 'Número (tap)'}
                  </Typography>
                </Box>
              </Box>
              
              <Box 
                onClick={() => openNumberPad('name', customerName)}
                sx={{ 
                  p: 1, borderRadius: 1, border: '1px solid #ccc', bgcolor: 'white',
                  cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' }
                }}
              >
                <Typography sx={{ color: customerName ? '#333' : '#999', fontSize: '0.9rem' }}>
                  {customerName || 'Nombre (tap para letras)'}
                </Typography>
              </Box>
            </>
          )}
        </Box>

        <Button 
          variant="contained" 
          color="success" 
          fullWidth 
          size="large" 
          disabled={!paymentMethod || processing}
          onClick={onCheckout}
          sx={{ mt: 3, py: 2, bgcolor: COLORS.success, '&:hover': { bgcolor: '#1e7b1e' } }}
        >
          {processing ? <CircularProgress size={24} color="inherit" /> : `Finalizar Venta / Finish Sale`}
        </Button>
        {!isOnline && <Typography variant="caption" sx={{ color: COLORS.lightText, display: 'block', mt: 1, textAlign: 'center' }}>Offline - Will sync later</Typography>}
      </Paper>
    </Box>
  );
};
