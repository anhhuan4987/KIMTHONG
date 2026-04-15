import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { FishingSession } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { format, startOfDay, endOfDay, subDays, isWithinInterval } from 'date-fns';
import { BarChart3, TrendingUp, Users, Fish, ShoppingBag, Calendar, Search, Download } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

export function ReportsView() {
  const [sessions, setSessions] = useState<FishingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'sessions'),
        where('status', '==', 'completed'),
        orderBy('endTime', 'desc')
      );

      const snapshot = await getDocs(q);
      const allSessions = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        endTime: doc.data().endTime.toDate(),
        startTime: doc.data().startTime.toDate()
      })) as any[];

      // Filter by date range locally for more flexibility
      const start = startOfDay(new Date(startDate));
      const end = endOfDay(new Date(endDate));

      const filtered = allSessions.filter(s => 
        isWithinInterval(s.endTime, { start, end })
      );

      setSessions(filtered);
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = sessions.reduce((acc, s) => {
    const itemsTotal = s.items?.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0) || 0;
    const fishTotal = (s.fishWeight || 0) * (s.fishPricePerKg || 0);
    
    acc.revenue += (s.totalAmount || 0);
    acc.services += itemsTotal;
    acc.fishBuyback += fishTotal;
    acc.customers += 1;
    acc.fishWeight += (s.fishWeight || 0);
    return acc;
  }, { revenue: 0, services: 0, fishBuyback: 0, customers: 0, fishWeight: 0 });

  return (
    <div className="flex-1 p-4 lg:p-8 overflow-y-auto space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gold">Báo cáo & Thống kê</h1>
          <p className="text-text-dim text-sm">Theo dõi hiệu quả kinh doanh của hồ câu</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => window.print()}
            className="border-gold text-gold hover:bg-gold hover:text-black gap-2 h-12 lg:h-10 no-print"
          >
            <Download className="w-4 h-4" />
            In báo cáo
          </Button>
        </div>
      </div>

      <div className="bg-gold/10 border border-gold/20 p-4 rounded-xl no-print">
        <p className="text-xs text-gold flex items-center gap-2">
          <span className="w-2 h-2 bg-gold rounded-full animate-pulse" />
          Mẹo: Kết nối máy in Bluetooth với điện thoại/máy tính để in hóa đơn và báo cáo nhanh chóng.
        </p>
      </div>

      {/* Filters */}
      <Card className="bg-card-bg border-border-dim">
        <CardContent className="p-4 lg:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase text-text-dim">Từ ngày</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                <Input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-10 bg-bg-dark border-border-dim h-12 lg:h-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase text-text-dim">Đến ngày</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                <Input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-10 bg-bg-dark border-border-dim h-12 lg:h-10"
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button onClick={fetchData} className="w-full bg-gold text-black hover:bg-gold-dark font-bold h-12 lg:h-10">
                <Search className="w-4 h-4 mr-2" />
                Tra cứu
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card-bg border-border-dim">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center border border-gold/20">
              <TrendingUp className="w-6 h-6 text-gold" />
            </div>
            <div>
              <p className="text-xs text-text-dim uppercase">Tổng doanh thu</p>
              <p className="text-xl font-bold text-white">{stats.revenue.toLocaleString()}đ</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card-bg border-border-dim">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center border border-success/20">
              <ShoppingBag className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-xs text-text-dim uppercase">Tiền dịch vụ</p>
              <p className="text-xl font-bold text-white">{stats.services.toLocaleString()}đ</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card-bg border-border-dim">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-text-dim uppercase">Lượt khách</p>
              <p className="text-xl font-bold text-white">{stats.customers}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card-bg border-border-dim">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center border border-warning/20">
              <Fish className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-xs text-text-dim uppercase">Cá thu mua</p>
              <p className="text-xl font-bold text-white">{stats.fishWeight.toFixed(1)} kg</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed List */}
      <Card className="bg-card-bg border-border-dim">
        <CardHeader className="p-4 lg:p-6 border-b border-border-dim">
          <CardTitle className="text-lg text-white">Chi tiết giao dịch</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-border-dim hover:bg-transparent">
                  <TableHead className="text-gold">Ngày/Giờ</TableHead>
                  <TableHead className="text-gold">Khách hàng</TableHead>
                  <TableHead className="text-gold">Loại ca</TableHead>
                  <TableHead className="text-gold text-right">Doanh thu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-text-dim">Đang tải dữ liệu...</TableCell>
                  </TableRow>
                ) : sessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-text-dim">Không có dữ liệu trong khoảng thời gian này</TableCell>
                  </TableRow>
                ) : (
                  sessions.map((s) => (
                    <TableRow key={s.id} className="border-border-dim hover:bg-white/5">
                      <TableCell className="text-xs">
                        <div className="font-bold">{format(s.endTime, 'HH:mm')}</div>
                        <div className="text-text-dim">{format(s.endTime, 'dd/MM/yyyy')}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold">{s.customerName}</div>
                        <div className="text-xs text-text-dim">{s.phoneNumber}</div>
                      </TableCell>
                      <TableCell>
                        <span className="text-[10px] px-2 py-0.5 bg-white/10 rounded text-text-dim">
                          {s.sessionType}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-bold text-gold">
                        {(s.totalAmount || 0).toLocaleString()}đ
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
