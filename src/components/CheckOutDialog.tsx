import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { db } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { FishingSession } from '../types';
import { useSettings } from '../lib/SettingsContext';
import { differenceInMinutes } from 'date-fns';
import { BillPrint } from './BillPrint';

interface CheckOutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: FishingSession;
}

export function CheckOutDialog({ open, onOpenChange, session }: CheckOutDialogProps) {
  const { settings } = useSettings();
  const [fishWeight, setFishWeight] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [printData, setPrintData] = useState<any>(null);

  const calculateBill = () => {
    const start = session.startTime.toDate();
    const end = new Date();
    const durationMinutes = differenceInMinutes(end, start);
    
    let timeAmount = 0;
    const pkg = settings.packages.find(p => p.id === session.sessionType);

    if (!pkg) {
      const hours = Math.max(1, Math.ceil(durationMinutes / 60));
      timeAmount = hours * settings.hourlyRate;
    } else {
      timeAmount = pkg.price;
      const overtimeMinutes = durationMinutes - (pkg.duration * 60);
      if (overtimeMinutes > 0) {
        timeAmount += Math.ceil(overtimeMinutes / 60) * settings.hourlyRate;
      }
    }

    const itemsAmount = session.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const fishAmount = (parseFloat(fishWeight) || 0) * settings.fishBuybackPrice;
    
    const totalAmount = Math.max(0, (timeAmount + itemsAmount) - fishAmount);

    return {
      timeAmount,
      itemsAmount,
      fishAmount,
      totalAmount,
      durationMinutes,
      endTime: end
    };
  };

  const bill = calculateBill();

  const handleCheckOut = async () => {
    setIsSubmitting(true);
    try {
      const finalBill = calculateBill();
      const sessionRef = doc(db, 'sessions', session.id!);
      
      const updateData = {
        status: 'completed',
        endTime: serverTimestamp(),
        fishWeight: parseFloat(fishWeight) || 0,
        fishPricePerKg: settings.fishBuybackPrice,
        totalAmount: finalBill.totalAmount,
      };

      await updateDoc(sessionRef, updateData);

      // Update customer history
      if (session.phoneNumber) {
        const q = query(collection(db, 'customers'), where('phoneNumber', '==', session.phoneNumber));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const customerDoc = snapshot.docs[0];
          await updateDoc(doc(db, 'customers', customerDoc.id), {
            totalSpent: (customerDoc.data().totalSpent || 0) + finalBill.totalAmount,
            visitCount: (customerDoc.data().visitCount || 0) + 1
          });
        } else {
          await addDoc(collection(db, 'customers'), {
            name: session.customerName,
            phoneNumber: session.phoneNumber,
            totalSpent: finalBill.totalAmount,
            visitCount: 1
          });
        }
      }

      toast.success("Đã thanh toán thành công!");
      
      setPrintData({ 
        ...session, 
        ...updateData, 
        ...finalBill,
        startTime: session.startTime.toDate(),
        endTime: new Date() 
      });
      
      onOpenChange(false);

      setTimeout(() => {
        window.print();
        setPrintData(null);
      }, 500);

    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi thanh toán");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-card-bg border-border-dim text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gold text-xl uppercase">KẾT THÚC CA: {session.customerName}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-text-dim">Thời gian câu:</div>
              <div className="text-right font-bold">{Math.floor(bill.durationMinutes / 60)}h {bill.durationMinutes % 60}p</div>
              
              <div className="text-text-dim">Tiền giờ:</div>
              <div className="text-right font-bold">{bill.timeAmount.toLocaleString()}đ</div>
              
              <div className="text-text-dim">Tiền dịch vụ:</div>
              <div className="text-right font-bold">{bill.itemsAmount.toLocaleString()}đ</div>
            </div>

            <Separator className="bg-white/10" />

            <div className="space-y-2">
              <Label htmlFor="fish">Số kg cá câu được (kg)</Label>
              <Input 
                id="fish" 
                type="number" 
                step="0.1"
                value={fishWeight}
                onChange={(e) => setFishWeight(e.target.value)}
                className="bg-bg-dark border-border-dim text-xl font-bold text-success"
              />
              <p className="text-xs text-text-dim">Giá thu lại: {settings.fishBuybackPrice.toLocaleString()}đ/kg</p>
            </div>

            <div className="flex justify-between items-center bg-success/10 p-3 rounded-lg border border-success/20">
              <span className="text-sm text-success">Tiền thu cá (Trừ):</span>
              <span className="text-lg font-bold text-success">-{bill.fishAmount.toLocaleString()}đ</span>
            </div>

            <Separator className="bg-white/10" />

            <div className="flex justify-between items-center p-4 bg-gold/10 rounded-xl border border-gold/30">
              <span className="text-lg font-bold text-gold">TỔNG CỘNG:</span>
              <span className="text-3xl font-black text-gold">{bill.totalAmount.toLocaleString()}đ</span>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button 
              onClick={handleCheckOut} 
              disabled={isSubmitting}
              className="w-full bg-gold hover:bg-gold-dark text-black font-bold py-8 text-xl"
            >
              {isSubmitting ? "Đang xử lý..." : "THANH TOÁN & IN BILL"}
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="text-text-dim"
            >
              Hủy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {printData && <BillPrint data={printData} type="checkout" />}
    </>
  );
}

