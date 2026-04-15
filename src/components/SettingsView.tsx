import { useState } from 'react';
import { useSettings } from '../lib/SettingsContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';

export function SettingsView() {
  const { settings, updateSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = async () => {
    try {
      await updateSettings(localSettings);
      toast.success("Đã lưu cài đặt thành công");
    } catch (error) {
      toast.error("Lỗi khi lưu cài đặt");
    }
  };

  const addPackage = () => {
    setLocalSettings({
      ...localSettings,
      packages: [
        ...localSettings.packages,
        { id: Date.now().toString(), name: 'Gói mới', duration: 1, price: 50000 }
      ]
    });
  };

  const removePackage = (id: string) => {
    setLocalSettings({
      ...localSettings,
      packages: localSettings.packages.filter(p => p.id !== id)
    });
  };

  const addProduct = () => {
    setLocalSettings({
      ...localSettings,
      products: [
        ...localSettings.products,
        { id: Date.now().toString(), name: 'Sản phẩm mới', price: 10000 }
      ]
    });
  };

  const removeProduct = (id: string) => {
    setLocalSettings({
      ...localSettings,
      products: localSettings.products.filter(p => p.id !== id)
    });
  };

  return (
    <div className="flex-1 p-4 lg:p-8 overflow-y-auto space-y-6 lg:space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <h1 className="text-xl lg:text-2xl font-bold text-gold">Cài đặt hệ thống</h1>
        <Button onClick={handleSave} className="w-full lg:w-auto bg-gold text-black hover:bg-gold-dark font-bold h-12 lg:h-10 gap-2">
          <Save className="w-4 h-4" />
          Lưu cài đặt
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Packages Settings */}
        <Card className="bg-card-bg border-border-dim">
          <CardHeader className="flex flex-row items-center justify-between p-4 lg:p-6">
            <CardTitle className="text-gold text-lg lg:text-xl">Gói vé câu</CardTitle>
            <Button variant="outline" size="sm" onClick={addPackage} className="border-gold text-gold hover:bg-gold hover:text-black h-9">
              <Plus className="w-4 h-4 mr-1" /> Thêm gói
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 p-4 lg:p-6">
            {localSettings.packages.map((pkg, idx) => (
              <div key={pkg.id} className="flex flex-col gap-3 p-3 bg-white/5 rounded-lg border border-white/5 relative">
                <div className="flex-1 space-y-1">
                  <Label className="text-[10px] uppercase text-text-dim">Tên gói</Label>
                  <Input 
                    value={pkg.name} 
                    onChange={(e) => {
                      const newPkgs = [...localSettings.packages];
                      newPkgs[idx].name = e.target.value;
                      setLocalSettings({ ...localSettings, packages: newPkgs });
                    }}
                    className="bg-bg-dark border-border-dim h-10"
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 space-y-1">
                    <Label className="text-[10px] uppercase text-text-dim">Giờ</Label>
                    <Input 
                      type="number"
                      value={pkg.duration} 
                      onChange={(e) => {
                        const newPkgs = [...localSettings.packages];
                        newPkgs[idx].duration = parseFloat(e.target.value);
                        setLocalSettings({ ...localSettings, packages: newPkgs });
                      }}
                      className="bg-bg-dark border-border-dim h-10"
                    />
                  </div>
                  <div className="flex-[2] space-y-1">
                    <Label className="text-[10px] uppercase text-text-dim">Giá (VNĐ)</Label>
                    <Input 
                      type="number"
                      value={pkg.price} 
                      onChange={(e) => {
                        const newPkgs = [...localSettings.packages];
                        newPkgs[idx].price = parseFloat(e.target.value);
                        setLocalSettings({ ...localSettings, packages: newPkgs });
                      }}
                      className="bg-bg-dark border-border-dim h-10"
                    />
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => removePackage(pkg.id)} 
                  className="absolute top-2 right-2 text-danger hover:bg-danger/10 h-8 w-8"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Products Settings */}
        <Card className="bg-card-bg border-border-dim">
          <CardHeader className="flex flex-row items-center justify-between p-4 lg:p-6">
            <CardTitle className="text-gold text-lg lg:text-xl">Sản phẩm & Dịch vụ</CardTitle>
            <Button variant="outline" size="sm" onClick={addProduct} className="border-gold text-gold hover:bg-gold hover:text-black h-9">
              <Plus className="w-4 h-4 mr-1" /> Thêm SP
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 p-4 lg:p-6">
            {localSettings.products.map((prod, idx) => (
              <div key={prod.id} className="flex flex-col gap-3 p-3 bg-white/5 rounded-lg border border-white/5 relative">
                <div className="flex-1 space-y-1">
                  <Label className="text-[10px] uppercase text-text-dim">Tên sản phẩm</Label>
                  <Input 
                    value={prod.name} 
                    onChange={(e) => {
                      const newProds = [...localSettings.products];
                      newProds[idx].name = e.target.value;
                      setLocalSettings({ ...localSettings, products: newProds });
                    }}
                    className="bg-bg-dark border-border-dim h-10"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-text-dim">Giá (VNĐ)</Label>
                  <Input 
                    type="number"
                    value={prod.price} 
                    onChange={(e) => {
                      const newProds = [...localSettings.products];
                      newProds[idx].price = parseFloat(e.target.value);
                      setLocalSettings({ ...localSettings, products: newProds });
                    }}
                    className="bg-bg-dark border-border-dim h-10"
                  />
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => removeProduct(prod.id)} 
                  className="absolute top-2 right-2 text-danger hover:bg-danger/10 h-8 w-8"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* General Settings */}
        <Card className="bg-card-bg border-border-dim lg:col-span-2">
          <CardHeader className="p-4 lg:p-6">
            <CardTitle className="text-gold text-lg lg:text-xl">Cài đặt chung</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 p-4 lg:p-6">
            <div className="space-y-2">
              <Label className="text-sm">Giá thu mua cá (VNĐ/kg)</Label>
              <Input 
                type="number"
                value={localSettings.fishBuybackPrice} 
                onChange={(e) => setLocalSettings({ ...localSettings, fishBuybackPrice: parseFloat(e.target.value) })}
                className="bg-bg-dark border-border-dim h-12 lg:h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Giá câu linh hoạt (VNĐ/giờ)</Label>
              <Input 
                type="number"
                value={localSettings.hourlyRate} 
                onChange={(e) => setLocalSettings({ ...localSettings, hourlyRate: parseFloat(e.target.value) })}
                className="bg-bg-dark border-border-dim h-12 lg:h-10"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
