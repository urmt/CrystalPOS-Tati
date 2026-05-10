import React from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Box, Typography, Button, IconButton, TextField 
} from '@mui/material';
import { Add, Remove } from '@mui/icons-material';
import { Item } from '@/types';
import { formatCurrency } from '@/utils/format';
import { COLORS } from '@/app/pos/constants';

interface ItemDetailDialogProps {
  open: boolean;
  onClose: () => void;
  item: Item | null;
  weight: number;
  setWeight: (w: number) => void;
  finalPrice: number | null;
  setFinalPrice: (p: number | null) => void;
  onAdd: () => void;
  isFixedPrice: (item: Item) => boolean;
  getDisplayPrice: (item: Item) => number;
}

export const ItemDetailDialog: React.FC<ItemDetailDialogProps> = ({
  open, onClose, item, weight, setWeight, 
  finalPrice, setFinalPrice, onAdd, isFixedPrice, getDisplayPrice
}) => {
  if (!item) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ color: COLORS.darkText, textAlign: 'center' }}>
        {item.name}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ width: '100%', height: 200, bgcolor: 'grey.200', borderRadius: 2, mb: 2, overflow: 'hidden' }}>
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>💎</Box>
          )}
        </Box>

        <Typography variant="body2" sx={{ color: COLORS.lightText, mb: 2, textAlign: 'center' }}>
          {item.description}
        </Typography>

        {isFixedPrice(item) ? (
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography variant="h5" sx={{ color: COLORS.primary, fontWeight: 'bold', mb: 1 }}>
              Precio: {formatCurrency(getDisplayPrice(item))}
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.lightText }}>
              {item.current_weight_grams > 0 ? `Stock: ${item.current_weight_grams}g` : 'Sin stock'}
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Typography sx={{ color: COLORS.lightText }}>Peso (g):</Typography>
              <IconButton onClick={() => setWeight(Math.max(0, weight - 10))} size="small" sx={{ bgcolor: 'grey.200' }}><Remove /></IconButton>
              <TextField
                fullWidth
                label="Peso (gramos)"
                type="number"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                sx={{ flex: 1, bgcolor: 'white' }}
                inputProps={{ style: { textAlign: 'center', fontSize: '1.2rem' } }}
              />
              <IconButton onClick={() => setWeight(weight + 10)} size="small" sx={{ bgcolor: 'grey.200' }}><Add /></IconButton>
            </Box>

            <Typography variant="h6" sx={{ color: COLORS.darkText, mb: 1, textAlign: 'center' }}>
              Precio automático: {formatCurrency(Number(item.price_crc || 0) * weight)}
            </Typography>
          </>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography sx={{ color: COLORS.lightText }}>O precio:</Typography>
          <IconButton onClick={() => setFinalPrice(Math.max(0, (finalPrice || 0) - 1000))} size="small" sx={{ bgcolor: 'grey.200' }}><Remove /></IconButton>
          <TextField
            fullWidth
            label="O precio final (override)"
            type="number"
            value={finalPrice !== null ? finalPrice : ''}
            placeholder="Precio manual"
            onChange={(e) => setFinalPrice(e.target.value ? Number(e.target.value) : null)}
            sx={{ flex: 1, bgcolor: 'white' }}
            inputProps={{ style: { textAlign: 'center' } }}
          />
          <IconButton onClick={() => setFinalPrice((finalPrice || 0) + 1000)} size="small" sx={{ bgcolor: 'grey.200' }}><Add /></IconButton>
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
        <Button onClick={onClose} variant="outlined">Cancelar</Button>
        <Button onClick={onAdd} variant="contained" color="success" sx={{ bgcolor: COLORS.success }}>
          Añadir al Carrito
        </Button>
      </DialogActions>
    </Dialog>
  );
};
