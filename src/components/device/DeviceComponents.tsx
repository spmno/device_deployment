import { useState } from 'react';
import type { Device, DeviceFormData } from '@/types/device';
import {
  Edit2,
  Trash2,
  MapPin,
  DollarSign,
  Ruler,
  Upload,
  X,
  Server,
  CheckCircle2,
  Circle,
  ImageIcon,
  Cpu
} from 'lucide-react';

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
    image: initialData?.image || '',
  });
  const [imagePreview, setImagePreview] = useState<string | undefined>(initialData?.image);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setFormData({ ...formData, image: result });
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, image: '' });
    setImagePreview(undefined);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    if (!onCancel) {
      setFormData({ name: '', type: '', price: 0, coverageRange: 0, image: '' });
      setImagePreview(undefined);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium mb-2 text-cyan-400">设备名称</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="input-glow w-full px-4 py-2.5 rounded-lg"
          placeholder="请输入设备名称"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-cyan-400">设备类型</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="input-glow w-full px-4 py-2.5 rounded-lg"
          required
        >
          <option value="">请选择设备类型</option>
          <option value="监视设备">监视设备</option>
          <option value="环境监测">环境监测</option>
          <option value="充电设施">充电设施</option>
          <option value="导航设备">导航设备</option>
          <option value="其他">其他</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-cyan-400">设备图片</label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-cyan-500/30 rounded-lg hover:border-cyan-400/50 transition-all bg-cyan-500/5">
          <div className="space-y-2 text-center">
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="设备预览"
                  className="w-full h-40 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-1.5 bg-red-500/90 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="mx-auto w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center">
                  <Upload className="h-6 w-6 text-cyan-400" />
                </div>
                <div className="flex text-sm text-slate-400 justify-center">
                  <label
                    htmlFor="image-upload"
                    className="relative cursor-pointer font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <span>上传图片</span>
                    <input
                      id="image-upload"
                      name="image-upload"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleImageUpload}
                    />
                  </label>
                  <p className="pl-1">或拖拽到此处</p>
                </div>
                <p className="text-xs text-slate-500">PNG, JPG, GIF up to 10MB</p>
              </>
            )}
          </div>
        </div>
        {!imagePreview && (
          <input
            type="url"
            value={formData.image || ''}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            className="mt-3 input-glow w-full px-4 py-2.5 rounded-lg"
            placeholder="或直接输入图片 URL"
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-cyan-400">价格（元）</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-cyan-500/60" />
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              className="input-glow w-full pl-10 pr-4 py-2.5 rounded-lg"
              placeholder="0"
              min="0"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-cyan-400">覆盖范围（公里）</label>
          <div className="relative">
            <Ruler className="absolute left-3 top-2.5 h-5 w-5 text-cyan-500/60" />
            <input
              type="number"
              value={formData.coverageRange}
              onChange={(e) => setFormData({ ...formData, coverageRange: Number(e.target.value) })}
              className="input-glow w-full pl-10 pr-4 py-2.5 rounded-lg"
              placeholder="0"
              min="0"
              step="0.1"
              required
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="btn-neon flex-1 py-2.5 rounded-lg text-sm font-semibold"
        >
          {submitText}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary flex-1 py-2.5 rounded-lg text-sm font-medium"
          >
            取消
          </button>
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
  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      '监视设备': 'badge-cyan',
      '环境监测': 'badge-green',
      '充电设施': 'badge-purple',
      '导航设备': 'badge-orange',
      '其他': 'badge-cyan',
    };
    return colors[type] || 'badge-cyan';
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden group">
      {/* 设备图片 */}
      <div className="w-full h-44 overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 relative">
        {device.image ? (
          <img
            src={device.image}
            alt={device.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-cyan-500/10 flex items-center justify-center mb-2">
                <ImageIcon className="h-8 w-8 text-cyan-500/40" />
              </div>
              <span className="text-slate-500 text-sm">暂无图片</span>
            </div>
          </div>
        )}

        {/* 部署状态徽章 */}
        <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${
          device.deployed
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
        }`}>
          {device.deployed ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              已部署
            </>
          ) : (
            <>
              <Circle className="h-3.5 w-3.5" />
              未部署
            </>
          )}
        </div>
      </div>

      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-100 group-hover:text-cyan-400 transition-colors">
              {device.name}
            </h3>
            <span className={`inline-block px-2.5 py-1 text-xs rounded-full mt-2 font-medium ${getTypeColor(device.type)}`}>
              {device.type}
            </span>
          </div>
          <div className="flex gap-1">
            {onEdit && (
              <button
                onClick={() => onEdit(device)}
                className="p-2 hover:bg-cyan-500/10 rounded-lg transition-colors text-slate-400 hover:text-cyan-400"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(device.id)}
                className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-slate-400 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-2.5 text-sm">
          <div className="flex items-center gap-3 text-slate-400">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="flex-1">
              <span className="text-slate-500 text-xs">价格</span>
              <p className="text-slate-200 font-medium">¥{device.price.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-400">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Ruler className="h-4 w-4 text-purple-400" />
            </div>
            <div className="flex-1">
              <span className="text-slate-500 text-xs">覆盖范围</span>
              <p className="text-slate-200 font-medium">{device.coverageRange} 公里</p>
            </div>
          </div>

          {device.position && (
            <div className="flex items-center gap-3 text-slate-400 pt-1">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-green-400" />
              </div>
              <div className="flex-1">
                <span className="text-slate-500 text-xs">部署位置</span>
                <p className="text-slate-200 font-mono text-xs">
                  {device.position.lng.toFixed(4)}, {device.position.lat.toFixed(4)}
                </p>
              </div>
            </div>
          )}
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
      <div className="glass-card rounded-xl p-12 text-center">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-4">
          <Server className="h-10 w-10 text-cyan-500/40" />
        </div>
        <h3 className="text-lg font-medium text-slate-300 mb-2">暂无设备信息</h3>
        <p className="text-slate-500 text-sm">点击上方按钮添加您的第一个设备</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {devices.map((device, index) => (
        <div
          key={device.id}
          className="fade-in"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <DeviceCard device={device} onEdit={onEdit} onDelete={onDelete} />
        </div>
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-2xl p-6 w-full max-w-lg mx-4 relative">
        {/* 装饰光晕 */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/20 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center border border-cyan-500/30">
              <Cpu className="h-5 w-5 text-cyan-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">
              {device ? '编辑设备' : '添加设备'}
            </h2>
          </div>

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
    </div>
  );
};
