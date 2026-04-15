import { useState, useEffect } from 'react';
import { FishingSession } from '../types';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Clock, User, Phone, ShoppingCart, CheckCircle, Plus } from 'lucide-react';
import { format, differenceInMinutes, addHours } from 'date-fns';
import { CheckOutDialog } from './CheckOutDialog';
import { ProductDialog } from './ProductDialog';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useSettings } from '../lib/SettingsContext';
import { toast } from 'sonner';

interface SessionCardProps {
  session: FishingSession;
  isHistory?: boolean;
  key?: string | number;
}

export function SessionCard({ session, isHistory }: SessionCardProps) {
  const { settings } = useSettings();
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isCheckOutOpen, setIsCheckOutOpen] = useState(false);
  const [isProductOpen, setIsProductOpen] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (isHistory || session.status === 'completed') return;

    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [isHistory, session.status]);

  useEffect(() => {
    if (isHistory || session.status === 'completed') return;

    const start = session.startTime.toDate();
    const pkg = settings.packages.find(p => p.id === session.sessionType);
    
    if (!pkg || pkg.isFlexible) {
      setTimeLeft(999);
      return;
    }

    const end = addHours(start, pkg.duration);
    const diff = differenceInMinutes(end, now);
    setTimeLeft(diff);

  }, [now, session, isHistory, settings.packages]);

  const handleExtend = async () => {
    if (!session.id) return;
    try {
      const sessionRef = doc(db, 'sessions', session.id);
      const pkg = settings.packages.find(p => p.id === session.sessionType);
      
      if (pkg?.isFlexible) {
        toast.info("Ca linh hoạt tự động tính theo giờ thực tế");
        return;
      }
      
      const newItem = { name: 'Gia hạn 1h', price: settings.hourlyRate, quantity: 1 };
      const updatedItems = [...session.items, newItem];
      
      await updateDoc(sessionRef, {
        items: updatedItems
      });
      
      toast.success("Đã gia hạn thêm 1h (Cộng vào bill)");
    } catch (error) {
      toast.error("Lỗi gia hạn");
    }
  };

  const getStatusTagClass = () => {
    if (isHistory) return 'bg-gray-500/20 text-gray-400';
    if (session.sessionType === 'flexible') return 'bg-success text-white';
    if (timeLeft <= 0) return 'bg-danger text-white';
    if (timeLeft <= 15) return 'bg-warning text-black';
    return 'bg-success text-white';
  };

  const getCardBorderClass = () => {
    if (isHistory) return 'border-border-dim';
    if (timeLeft <= 0) return 'border-danger shadow-[inset_0_0_10px_rgba(218,54,51,0.1)]';
    if (timeLeft <= 15) return 'border-warning shadow-[inset_0_0_10px_rgba(210,153,34,0.1)]';
    return 'border-border-dim';
  };

  return (
    <div className={`bg-card-bg border rounded-lg p-4 flex flex-col justify-between transition-all ${getCardBorderClass()}`}>
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <span className="text-[14px] font-bold text-gold bg-gold/10 px-2 py-1 rounded">
            HỒ {session.id?.slice(-2).toUpperCase() || '??'}
          </span>
          <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded font-bold ${getStatusTagClass()}`}>
            {isHistory ? 'Đã thanh toán' : timeLeft <= 0 ? 'Hết giờ' : timeLeft <= 15 ? 'Sắp hết giờ' : 'Đang câu'}
          </span>
        </div>

        <div className="mt-2">
          <div className="text-[16px] font-semibold text-white truncate">{session.customerName}</div>
          <div className="text-[12px] text-text-dim leading-relaxed mt-1">
            Bắt đầu: {format(session.startTime.toDate(), 'HH:mm')} ({session.sessionType === '1h' ? 'Ca 1h' : session.sessionType === '5h' ? 'Ca 5h' : session.sessionType === '10h' ? 'Ca 10h' : 'Linh hoạt'})<br />
            {isHistory ? 'Kết thúc: ' + format(session.endTime.toDate(), 'HH:mm') : timeLeft <= 0 ? 'Quá giờ:' : 'Còn lại:'}
          </div>
          
          {!isHistory && (
            <div className={`font-mono text-2xl mt-2 ${timeLeft <= 0 ? 'text-danger' : timeLeft <= 15 ? 'text-warning' : 'text-white'}`}>
              {timeLeft <= 0 
                ? format(new Date(Math.abs(timeLeft) * 60000), 'mm:ss') 
                : `${Math.floor(timeLeft / 60).toString().padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}:00`
              }
            </div>
          )}
        </div>
      </div>

      {!isHistory && (
        <div className="flex gap-2 mt-4">
          <Button 
            variant="outline" 
            className="flex-1 h-10 text-[11px] font-bold uppercase border-border-dim text-text-dim hover:text-white hover:bg-white/5"
            onClick={() => setIsProductOpen(true)}
          >
            Dịch vụ
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 h-10 text-[11px] font-bold uppercase border-border-dim text-text-dim hover:text-white hover:bg-white/5"
            onClick={handleExtend}
          >
            Gia hạn
          </Button>
          <Button 
            className="flex-1 h-10 text-[11px] font-bold uppercase bg-gold text-black hover:bg-gold-dark"
            onClick={() => setIsCheckOutOpen(true)}
          >
            {timeLeft <= 0 ? 'Thanh toán' : 'Kết thúc'}
          </Button>
        </div>
      )}

      {isHistory && session.totalAmount && (
        <div className="mt-4 pt-3 border-t border-border-dim flex justify-between items-center">
          <span className="text-[11px] text-text-dim uppercase">Tổng cộng:</span>
          <span className="text-[16px] font-bold text-gold">{session.totalAmount.toLocaleString('vi-VN')}đ</span>
        </div>
      )}

      <CheckOutDialog 
        open={isCheckOutOpen} 
        onOpenChange={setIsCheckOutOpen} 
        session={session} 
      />
      <ProductDialog 
        open={isProductOpen} 
        onOpenChange={setIsProductOpen} 
        session={session} 
      />
    </div>
  );
}
