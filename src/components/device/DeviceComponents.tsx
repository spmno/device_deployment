import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import type { Device, DeviceFormData } from '@/types/device';
import { Plus, Edit2, Trash2, MapPin, DollarSign, Ruler } from 'lucide-react';

interface DeviceFormProps {
  onSubmit: (data: DeviceFormData) => void;
  onCancel?: () => void;
  initialData?: Partial<DeviceFormData>;
  submitText?: string;
}

export const DeviceForm: React.FC<DeviceFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  submitText = '添加设备'
}) => {
  const [formData, setFormData] = useState<DeviceFormData>({
    name: initialData?.name || '',
    type: initialData?.type || '',
    price: initialData?.price || 0,
    coverageRange: initialData?.coverageRange || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    if (!onCancel) {
      setFormData({ name: '', type: '', price: 0, coverageRange: 0 });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">设备名称</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="请输入设备名称"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">设备类型</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">请选择设备类型</option>
          <option value="通信基站">通信基站</option>
          <option value="环境监测">环境监测</option>
          <option value="充电设施">充电设施</option>
          <option value="导航设备">导航设备</option>
          <option value="其他">其他</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">价格（元）</label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
            className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入设备价格"
            min="0"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">覆盖范围（公里）</label>
        <div className="relative">
          <Ruler className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="number"
            value={formData.coverageRange}
            onChange={(e) => setFormData({ ...formData, coverageRange: Number(e.target.value) })}
            className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入覆盖范围"
            min="0"
            step="0.1"
            required
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          {submitText}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            取消
          </Button>
        )}
      </div>
    </form>
  );
};

interface DeviceCardProps {
  device: Device;
  onEdit?: (device: Device) => void;
  onDelete?: (id: string) => void;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({ device, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold">{device.name}</h3>
          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full mt-1">
            {device.type}
          </span>
        </div>
        <div className="flex gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(device)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Edit2 className="h-4 w-4 text-gray-600" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(device.id)}
              className="p-2 hover:bg-red-50 rounded-full transition-colors"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          <span>价格: ¥{device.price.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <Ruler className="h-4 w-4" />
          <span>覆盖范围: {device.coverageRange} 公里</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <span>
            状态: {device.deployed ? '已部署' : '未部署'}
            {device.position && ` (${device.position.lng.toFixed(4)}, ${device.position.lat.toFixed(4)})`}
          </span>
        </div>
      </div>
    </div>
  );
};

interface DeviceListProps {
  devices: Device[];
  onEdit?: (device: Device) => void;
  onDelete?: (id: string) => void;
}

export const DeviceList: React.FC<DeviceListProps> = ({ devices, onEdit, onDelete }) => {
  if (devices.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>暂无设备信息</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {devices.map((device) => (
        <DeviceCard key={device.id} device={device} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
};

interface DeviceManagementModalProps {
  device?: Device;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: DeviceFormData) => void;
}

export const DeviceManagementModal: React.FC<DeviceManagementModalProps> = ({
  device,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">{device ? '编辑设备' : '添加设备'}</h2>
        <DeviceForm
          onSubmit={(data) => {
            onSave(data);
            onClose();
          }}
          onCancel={onClose}
          initialData={device}
          submitText={device ? '保存修改' : '添加设备'}
        />
      </div>
    </div>
  );
};
