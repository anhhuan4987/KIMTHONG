import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { useSettings } from '../lib/SettingsContext';
import { BillPrint } from './BillPrint';

interface CheckInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CheckInDialog({ open, onOpenChange }: CheckInDialogProps) {
  const { settings } = useSettings();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [people, setPeople] = useState('1');
  const [type, setType] = useState('5h');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [printData, setPrintData] = useState<any>(null);

  useEffect(() => {
    if (settings.packages.length > 0 && !settings.packages.find(p => p.id === type)) {
      setType(settings.packages[0].id);
    }
  }, [settings.packages]);

  const handleCheckIn = async () => {
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên khách");
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedPkg = settings.packages.find(p => p.id === type);
      const sessionData = {
        customerName: name,
        phoneNumber: phone,
        numPeople: parseInt(people) || 1,
        startTime: new Date(),
        sessionType: type,
        status: 'active',
        items: [],
        hourlyRate: settings.hourlyRate,
        packagePrice: selectedPkg?.price || 0,
      };

      const docRef = await addDoc(collection(db, 'sessions'), {
        ...sessionData,
        startTime: serverTimestamp()
      });

      toast.success(`Đã tạo vé cho ${name}`);
      
      setPrintData({ ...sessionData, id: docRef.id, startTime: new Date() });
      
      setName('');
      setPhone('');
      setPeople('1');
      onOpenChange(false);

      setTimeout(() => {
        window.print();
        setPrintData(null);
      }, 500);

    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi tạo vé");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-card-bg border-border-dim text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gold text-xl">CHECK-IN KHÁCH MỚI</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên khách hàng *</Label>
              <Input 
                id="name" 
                placeholder="Nhập tên khách..." 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-bg-dark border-border-dim focus:border-gold"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input 
                  id="phone" 
                  placeholder="090..." 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-bg-dark border-border-dim"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="people">Số người</Label>
                <Input 
                  id="people" 
                  type="number" 
                  value={people}
                  onChange={(e) => setPeople(e.target.value)}
                  className="bg-bg-dark border-border-dim"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Loại ca câu</Label>
              <Tabs value={type} onValueChange={setType} className="w-full">
                <TabsList className="w-full bg-bg-dark grid grid-cols-3 h-auto p-1">
                  {settings.packages.map(pkg => (
                    <TabsTrigger 
                      key={pkg.id} 
                      value={pkg.id} 
                      className="data-[state=active]:bg-gold data-[state=active]:text-black py-2 text-xs"
                    >
                      {pkg.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>

          <DialogFooter>
            <Button 
              onClick={handleCheckIn} 
              disabled={isSubmitting}
              className="w-full bg-gold hover:bg-gold-dark text-black font-bold py-6"
            >
              {isSubmitting ? "Đang xử lý..." : "BẮT ĐẦU CÂU & IN VÉ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {printData && <BillPrint data={printData} type="checkin" />}
    </>
  );
}

