import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { FishingSession } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { format } from 'date-fns';
import { Search, Calendar, FileText, Download } from 'lucide-react';

export function HistoryView() {
  const [sessions, setSessions] = useState<FishingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    fetchHistory();
  }, [dateFilter]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const startOfDay = new Date(dateFilter);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateFilter);
      endOfDay.setHours(23, 59, 59, 999);

      const q = query(
        collection(db, 'sessions'),
        where('status', '==', 'completed'),
        where('endTime', '>=', startOfDay),
        where('endTime', '<=', endOfDay),
        orderBy('endTime', 'desc'),
        limit(100)
      );

      const snapshot = await getDocs(q);
      setSessions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FishingSession[]);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = sessions.filter(s => 
    s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phoneNumber?.includes(searchTerm)
  );

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gold">Lịch sử giao dịch</h1>
        <Button variant="outline" className="border-gold text-gold hover:bg-gold hover:text-black gap-2">
          <Download className="w-4 h-4" />
          Xuất báo cáo
        </Button>
      </div>

      <Card className="bg-card-bg border-border-dim">
        <CardHeader className="p-4 lg:p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
              <Input 
                placeholder="Tìm theo tên khách hoặc SĐT..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-bg-dark border-border-dim h-12 lg:h-10"
              />
            </div>
            <div className="w-full md:w-48 relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
              <Input 
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="pl-10 bg-bg-dark border-border-dim h-12 lg:h-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 lg:p-6">
          {/* Desktop Table */}
          <div className="hidden lg:block rounded-md border border-border-dim overflow-hidden">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-border-dim hover:bg-transparent">
                  <TableHead className="text-gold">Thời gian</TableHead>
                  <TableHead className="text-gold">Khách hàng</TableHead>
                  <TableHead className="text-gold">Loại ca</TableHead>
                  <TableHead className="text-gold text-right">Tiền giờ</TableHead>
                  <TableHead className="text-gold text-right">Dịch vụ</TableHead>
                  <TableHead className="text-gold text-right">Thu cá</TableHead>
                  <TableHead className="text-gold text-right font-bold">Tổng cộng</TableHead>
                  <TableHead className="text-gold text-center">Chi tiết</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-text-dim">Đang tải dữ liệu...</TableCell>
                  </TableRow>
                ) : filteredSessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-text-dim">Không tìm thấy giao dịch nào</TableCell>
                  </TableRow>
                ) : (
                  filteredSessions.map((session) => {
                    const itemsTotal = session.items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
                    const fishTotal = (session.fishWeight || 0) * (session.fishPricePerKg || 0);
                    const timeTotal = (session.totalAmount || 0) + fishTotal - itemsTotal;

                    return (
                      <TableRow key={session.id} className="border-border-dim hover:bg-white/5">
                        <TableCell className="text-xs">
                          <div className="font-bold">{format(session.endTime.toDate(), 'HH:mm')}</div>
                          <div className="text-text-dim">{format(session.endTime.toDate(), 'dd/MM/yyyy')}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-bold">{session.customerName}</div>
                          <div className="text-xs text-text-dim">{session.phoneNumber}</div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs px-2 py-1 bg-white/10 rounded">
                            {session.sessionType === '1h' ? 'Ca 1h' : session.sessionType === '5h' ? 'Ca 5h' : session.sessionType === '10h' ? 'Ca 10h' : 'Linh hoạt'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{timeTotal.toLocaleString()}đ</TableCell>
                        <TableCell className="text-right">{itemsTotal.toLocaleString()}đ</TableCell>
                        <TableCell className="text-right text-success">-{fishTotal.toLocaleString()}đ</TableCell>
                        <TableCell className="text-right font-bold text-gold">{session.totalAmount?.toLocaleString()}đ</TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="icon" className="text-text-dim hover:text-gold">
                            <FileText className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile List */}
          <div className="lg:hidden divide-y divide-border-dim">
            {loading ? (
              <div className="p-8 text-center text-text-dim">Đang tải dữ liệu...</div>
            ) : filteredSessions.length === 0 ? (
              <div className="p-8 text-center text-text-dim">Không tìm thấy giao dịch nào</div>
            ) : (
              filteredSessions.map((session) => {
                const itemsTotal = session.items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
                const fishTotal = (session.fishWeight || 0) * (session.fishPricePerKg || 0);
                const timeTotal = (session.totalAmount || 0) + fishTotal - itemsTotal;

                return (
                  <div key={session.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-white">{session.customerName}</div>
                        <div className="text-xs text-text-dim">{session.phoneNumber}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-gold">{format(session.endTime.toDate(), 'HH:mm - dd/MM')}</div>
                        <span className="text-[10px] px-2 py-0.5 bg-white/10 rounded text-text-dim">
                          {session.sessionType === '1h' ? 'Ca 1h' : session.sessionType === '5h' ? 'Ca 5h' : session.sessionType === '10h' ? 'Ca 10h' : 'Linh hoạt'}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      <div className="flex flex-col">
                        <span className="text-text-dim">Tiền giờ</span>
                        <span>{timeTotal.toLocaleString()}đ</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-text-dim">Dịch vụ</span>
                        <span>{itemsTotal.toLocaleString()}đ</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-text-dim">Thu cá</span>
                        <span className="text-success">-{fishTotal.toLocaleString()}đ</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-border-dim/50">
                      <div className="text-sm font-bold text-gold">Tổng: {session.totalAmount?.toLocaleString()}đ</div>
                      <Button variant="ghost" size="sm" className="h-8 text-text-dim hover:text-gold gap-1">
                        <FileText className="w-3 h-3" />
                        Chi tiết
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
