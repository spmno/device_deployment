import { useState } from 'react';
import { useDevices } from '@/context/DeviceContext';
import { DeviceList, DeviceManagementModal } from '@/components/device/DeviceComponents';
import type { Device, DeviceFormData } from '@/types/device';
import { Plus } from 'lucide-react';

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">设备信息管理</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          添加设备
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">设备列表</h2>
          <p className="text-gray-600 text-sm">共 {devices.length} 台设备</p>
        </div>
        <DeviceList devices={devices} onEdit={handleEdit} onDelete={handleDeleteDevice} />
      </div>

      <DeviceManagementModal
        device={editingDevice}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={editingDevice ? handleEditDevice : handleAddDevice}
      />
    </div>
  );
};
