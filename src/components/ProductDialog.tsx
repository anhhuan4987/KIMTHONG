import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { FishingSession, Product } from '../types';
import { useSettings } from '../lib/SettingsContext';
import { Plus, Minus, ShoppingBag } from 'lucide-react';

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: FishingSession;
}

export function ProductDialog({ open, onOpenChange, session }: ProductDialogProps) {
  const { settings } = useSettings();
  const [items, setItems] = useState<Product[]>(session.items || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateQuantity = (name: string, price: number, delta: number) => {
    setItems(prev => {
      const existing = prev.find(i => i.name === name);
      if (existing) {
        const newQty = Math.max(0, existing.quantity + delta);
        if (newQty === 0) return prev.filter(i => i.name !== name);
        return prev.map(i => i.name === name ? { ...i, quantity: newQty } : i);
      }
      if (delta > 0) {
        return [...prev, { name, price, quantity: 1 }];
      }
      return prev;
    });
  };

  const handleSave = async () => {
    if (!session.id) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'sessions', session.id), {
        items: items
      });
      toast.success("Đã cập nhật dịch vụ");
      onOpenChange(false);
    } catch (error) {
      toast.error("Lỗi cập nhật");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card-bg border-border-dim text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-gold flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            THÊM DỊCH VỤ - {session.customerName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          {settings.products.map((prod) => {
            const current = items.find(i => i.name === prod.name);
            return (
              <div key={prod.id} className="flex items-center justify-between p-3 bg-bg-dark rounded-lg border border-border-dim">
                <div>
                  <p className="font-bold">{prod.name}</p>
                  <p className="text-xs text-gold">{prod.price.toLocaleString()}đ</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 rounded-full border-border-dim text-text-dim"
                    onClick={() => updateQuantity(prod.name, prod.price, -1)}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-6 text-center font-bold">{current?.quantity || 0}</span>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 rounded-full border-gold/50 text-gold"
                    onClick={() => updateQuantity(prod.name, prod.price, 1)}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button 
            onClick={handleSave} 
            disabled={isSubmitting}
            className="w-full bg-gold hover:bg-gold-dark text-black font-bold py-6"
          >
            {isSubmitting ? "Đang lưu..." : "XÁC NHẬN CẬP NHẬT"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

