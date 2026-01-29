import { useState } from 'react';
import { useDevices } from '@/context/DeviceContext';
import { DeviceList, DeviceManagementModal } from '@/components/device/DeviceComponents';
import type { Device, DeviceFormData } from '@/types/device';
import { Plus, Server, Layers, Cpu } from 'lucide-react';

export const DeviceManagement: React.FC = () => {
  const { devices, addDevice, updateDevice, deleteDevice } = useDevices();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | undefined>(undefined);

  const handleAddDevice = (data: DeviceFormData) => {
    addDevice(data);
  };

  const handleEditDevice = (data: DeviceFormData) => {
    if (editingDevice) {
      updateDevice(editingDevice.id, data);
      setEditingDevice(undefined);
    }
  };

  const handleDeleteDevice = (id: string) => {
    if (window.confirm('确定要删除这个设备吗？')) {
      deleteDevice(id);
    }
  };

  const handleEdit = (device: Device) => {
    setEditingDevice(device);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingDevice(undefined);
  };

  // 统计信息
  const deployedCount = devices.filter(d => d.deployed).length;
  const undeployedCount = devices.length - deployedCount;

  return (
    <div className="space-y-6">
      {/* 页面标题和添加按钮 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold title-glow mb-1">设备信息管理</h1>
          <p className="text-slate-400 text-sm">管理您的所有设备资产</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-neon flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
        >
          <Plus className="h-5 w-5" />
          添加设备
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
              <Server className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">设备总数</p>
              <p className="text-2xl font-bold text-slate-100">{devices.length}</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
              <Cpu className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">已部署</p>
              <p className="text-2xl font-bold text-green-400">{deployedCount}</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
              <Layers className="h-6 w-6 text-orange-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">未部署</p>
              <p className="text-2xl font-bold text-orange-400">{undeployedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 设备列表区域 */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-100">设备列表</h2>
            <p className="text-slate-500 text-sm mt-1">
              共 <span className="text-cyan-400 font-medium">{devices.length}</span> 台设备
            </p>
          </div>
          {devices.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              实时更新
            </div>
          )}
        </div>
        <DeviceList devices={devices} onEdit={handleEdit} onDelete={handleDeleteDevice} />
      </div>

      {/* 设备编辑/添加模态框 */}
      <DeviceManagementModal
        device={editingDevice}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={editingDevice ? handleEditDevice : handleAddDevice}
      />
    </div>
  );
};
