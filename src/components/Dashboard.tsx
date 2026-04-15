import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { FishingSession } from '../types';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Plus, Users, DollarSign, Clock, LogOut, Search, History } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { SessionCard } from './SessionCard';
import { CheckInDialog } from './CheckInDialog';
import { format, addHours, differenceInMinutes } from 'date-fns';

interface DashboardProps {
  sessions: FishingSession[];
  user: User;
}

export function Dashboard({ sessions, user }: DashboardProps) {
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [todayRevenue, setTodayRevenue] = useState(0);

  useEffect(() => {
    const fetchTodayRevenue = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const q = query(
        collection(db, 'sessions'),
        where('status', '==', 'completed'),
        where('endTime', '>=', today),
        orderBy('endTime', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const total = snapshot.docs.reduce((acc, doc) => acc + (doc.data().totalAmount || 0), 0);
      setTodayRevenue(total);
    };

    fetchTodayRevenue();
  }, [sessions]);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Header */}
      <header className="h-auto lg:h-[70px] border-b border-border-dim flex flex-col lg:flex-row items-stretch lg:items-center justify-between px-4 lg:px-8 py-4 lg:py-0 bg-[#0d1117] shrink-0 gap-4">
        <div className="flex justify-between lg:justify-start lg:gap-10">
          <div className="flex flex-col">
            <span className="text-[10px] lg:text-[12px] text-text-dim uppercase">Đang câu</span>
            <span className="text-[16px] lg:text-[18px] font-bold text-gold">{sessions.length} / 40</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] lg:text-[12px] text-text-dim uppercase">Doanh thu</span>
            <span className="text-[16px] lg:text-[18px] font-bold text-gold">{todayRevenue.toLocaleString('vi-VN')}đ</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] lg:text-[12px] text-text-dim uppercase">Sắp hết giờ</span>
            <span className="text-[16px] lg:text-[18px] font-bold text-warning">
              {sessions.filter(s => {
                const start = s.startTime.toDate();
                const end = s.sessionType === '5h' ? addHours(start, 5) : s.sessionType === '10h' ? addHours(start, 10) : null;
                if (!end) return false;
                const diff = differenceInMinutes(end, new Date());
                return diff > 0 && diff <= 15;
              }).length.toString().padStart(2, '0')}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 lg:gap-4">
          <Button 
            onClick={() => setIsCheckInOpen(true)}
            className="flex-1 lg:flex-none bg-success hover:bg-success/90 text-white font-bold h-12 lg:h-10 rounded-md transition-all text-sm"
          >
            + Check-in mới
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => auth.signOut()}
            className="text-text-dim hover:text-white h-12 w-12 lg:h-10 lg:w-10"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Grid Container */}
      <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sessions.length > 0 ? (
            sessions.map((session, idx) => (
              <SessionCard key={session.id || idx} session={session} />
            ))
          ) : (
            <div className="col-span-full text-center py-20 text-text-dim">
              <Fish className="w-16 h-16 mx-auto mb-4 opacity-10" />
              <p className="text-lg">Chưa có khách nào đang câu</p>
            </div>
          )}
        </div>
      </div>

      <CheckInDialog open={isCheckInOpen} onOpenChange={setIsCheckInOpen} />
    </div>
  );
}

function Fish(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8c0-5-4.5-7-8.5-7C5.5 1 2 5 2 8c0 2.5 2 5 5 5 2 0 4-1.5 6-1.5 3.03 0 5.03 1.5 5.03 1.5S22 12 22 8Z" />
      <path d="M13.79 15.53c-2.1 1.47-4.46 1.97-6.79 1.97-2.33 0-4.69-.5-6.79-1.97" />
      <path d="M18 8v.01" />
      <circle cx="18" cy="8" r="1" />
    </svg>
  )
}
