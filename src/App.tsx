/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { db, auth } from './lib/firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  orderBy,
  getDocs
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { FishingSession, Customer } from './types';
import { Dashboard } from './components/Dashboard';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { ReportsView } from './components/ReportsView';
import { Button } from './components/ui/button';
import { LogIn, Fish, LayoutDashboard, History, Settings, Users, Package, BarChart3, PieChart } from 'lucide-react';
import { Toaster } from 'sonner';
import { SettingsProvider } from './lib/SettingsContext';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<FishingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'dashboard' | 'history' | 'settings' | 'reports'>('dashboard');

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'sessions'), 
      where('status', '==', 'active'),
      orderBy('startTime', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessionData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FishingSession[];
      setSessions(sessionData);
    }, (error) => {
      console.error("Firestore Error:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-premium-black">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Fish className="w-12 h-12 text-gold" />
          <p className="text-gold font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-bg-dark p-6">
        <div className="max-w-md w-full text-center space-y-10">
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 bg-gold/10 rounded-3xl flex items-center justify-center border-2 border-gold/30 shadow-[0_0_30px_rgba(212,175,55,0.15)] transform rotate-12">
              <Fish className="w-12 h-12 text-gold -rotate-12" />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-black text-gold tracking-tighter mt-4">KIM THÔNG</h1>
              <div className="h-1 w-12 bg-gold mx-auto rounded-full" />
              <p className="text-text-dim font-medium tracking-wide uppercase text-xs">Hệ thống quản lý hồ câu</p>
            </div>
          </div>
          
          <div className="bg-card-bg border border-border-dim p-8 rounded-3xl shadow-2xl space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Chào mừng trở lại</h2>
              <p className="text-sm text-text-dim">Vui lòng đăng nhập để quản lý hồ câu</p>
            </div>

            <Button 
              onClick={handleLogin}
              className="w-full bg-gold hover:bg-gold-dark text-black font-bold py-7 rounded-2xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-gold/10"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Tiếp tục với Google
            </Button>
          </div>
          
          <div className="pt-4">
            <p className="text-[10px] text-text-dim uppercase tracking-[0.2em] font-bold">
              Professional Fishing Management
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SettingsProvider>
      <div className="flex flex-col lg:flex-row min-h-screen bg-bg-dark">
        {/* Sidebar (Desktop) */}
        <aside className="w-60 bg-[#010409] border-r border-border-dim hidden lg:flex flex-col py-6 shrink-0">
          <div className="px-6 mb-8 flex items-center gap-3">
            <div className="w-8 h-8 bg-gold/10 rounded flex items-center justify-center border border-gold/20">
              <Fish className="w-5 h-5 text-gold" />
            </div>
            <span className="font-extrabold text-xl text-gold tracking-wider">KIM THÔNG</span>
          </div>
          
          <nav className="flex-1 space-y-1">
            <div 
              onClick={() => setCurrentView('dashboard')}
              className={`px-6 py-3 flex items-center gap-3 text-sm font-medium cursor-pointer transition-colors ${currentView === 'dashboard' ? 'text-gold bg-card-bg border-l-4 border-gold' : 'text-text-dim hover:text-white hover:bg-white/5'}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </div>
            <div 
              onClick={() => setCurrentView('history')}
              className={`px-6 py-3 flex items-center gap-3 text-sm font-medium cursor-pointer transition-colors ${currentView === 'history' ? 'text-gold bg-card-bg border-l-4 border-gold' : 'text-text-dim hover:text-white hover:bg-white/5'}`}
            >
              <History className="w-4 h-4" />
              Lịch sử giao dịch
            </div>
            <div 
              onClick={() => setCurrentView('reports')}
              className={`px-6 py-3 flex items-center gap-3 text-sm font-medium cursor-pointer transition-colors ${currentView === 'reports' ? 'text-gold bg-card-bg border-l-4 border-gold' : 'text-text-dim hover:text-white hover:bg-white/5'}`}
            >
              <BarChart3 className="w-4 h-4" />
              Báo cáo Doanh thu
            </div>
          </nav>

          <div 
            onClick={() => setCurrentView('settings')}
            className={`mt-auto px-6 py-3 flex items-center gap-3 text-sm font-medium cursor-pointer transition-colors ${currentView === 'settings' ? 'text-gold bg-card-bg border-l-4 border-gold' : 'text-text-dim hover:text-white hover:bg-white/5'}`}
          >
            <Settings className="w-4 h-4" />
            Cài đặt hệ thống
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-0">
          {currentView === 'dashboard' && <Dashboard sessions={sessions} user={user} />}
          {currentView === 'history' && <HistoryView />}
          {currentView === 'reports' && <ReportsView />}
          {currentView === 'settings' && <SettingsView />}
        </main>

        {/* Bottom Navigation (Mobile) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0d1117] border-t border-border-dim px-2 py-1 flex justify-around items-center z-50 safe-area-bottom">
          <button 
            onClick={() => setCurrentView('dashboard')}
            className={`flex flex-col items-center gap-1 p-2 min-w-[64px] transition-colors ${currentView === 'dashboard' ? 'text-gold' : 'text-text-dim'}`}
          >
            <LayoutDashboard className="w-6 h-6" />
            <span className="text-[10px] font-medium">Dashboard</span>
          </button>
          <button 
            onClick={() => setCurrentView('history')}
            className={`flex flex-col items-center gap-1 p-2 min-w-[64px] transition-colors ${currentView === 'history' ? 'text-gold' : 'text-text-dim'}`}
          >
            <History className="w-6 h-6" />
            <span className="text-[10px] font-medium">Lịch sử</span>
          </button>
          <button 
            onClick={() => setCurrentView('reports')}
            className={`flex flex-col items-center gap-1 p-2 min-w-[64px] transition-colors ${currentView === 'reports' ? 'text-gold' : 'text-text-dim'}`}
          >
            <BarChart3 className="w-6 h-6" />
            <span className="text-[10px] font-medium">Báo cáo</span>
          </button>
          <button 
            onClick={() => setCurrentView('settings')}
            className={`flex flex-col items-center gap-1 p-2 min-w-[64px] transition-colors ${currentView === 'settings' ? 'text-gold' : 'text-text-dim'}`}
          >
            <Settings className="w-6 h-6" />
            <span className="text-[10px] font-medium">Cài đặt</span>
          </button>
        </nav>

        <Toaster position="top-center" richColors />
      </div>
    </SettingsProvider>
  );
}

