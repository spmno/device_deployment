import { useState } from 'react';
import { useDevices } from '@/context/DeviceContext';
import { AMapComponent } from '@/components/map/AMapComponent';
import type { Device } from '@/types/device';
import { MapPin } from 'lucide-react';

export const DeviceDeployment: React.FC = () => {
  const { devices, deployDevice, undeployDevice } = useDevices();
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [deploymentMode, setDeploymentMode] = useState(false);

  const undeployedDevices = devices.filter((device) => !device.deployed);
  const deployedDevices = devices.filter((device) => device.deployed);

  const handleSelectDevice = (device: Device) => {
    setSelectedDevice(device);
    setDeploymentMode(true);
  };

  const handleMapClick = (lng: number, lat: number) => {
    if (selectedDevice) {
      if (window.confirm(`确定要在该位置部署 ${selectedDevice.name} 吗？`)) {
        deployDevice({ deviceId: selectedDevice.id, lng, lat });
        setSelectedDevice(null);
        setDeploymentMode(false);
      }
    }
  };

  const handleUndeploy = (device: Device) => {
    if (window.confirm(`确定要撤回 ${device.name} 的部署吗？`)) {
      undeployDevice(device.id);
    }
  };

  const handleCancelDeployment = () => {
    setSelectedDevice(null);
    setDeploymentMode(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">设备部署操作</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：设备选择列表 */}
        <div className="lg:col-span-1 space-y-4">
          {/* 待部署设备 */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              待部署设备 ({undeployedDevices.length})
            </h2>
            <div className="space-y-3">
              {undeployedDevices.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">所有设备已部署</p>
              ) : (
                undeployedDevices.map((device) => (
                  <div key={device.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    {device.image && (
                      <img
                        src={device.image}
                        alt={device.name}
                        className="w-full h-32 object-cover"
                      />
                    )}
                    <div className="p-3">
                      <h3 className="font-medium mb-1">{device.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{device.type}</p>
                      <p className="text-sm text-gray-500 mb-3">
                        覆盖范围: {device.coverageRange} 公里
                      </p>
                      <button
                        onClick={() => handleSelectDevice(device)}
                        disabled={deploymentMode && selectedDevice?.id !== device.id}
                        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {deploymentMode && selectedDevice?.id === device.id
                          ? '已在部署中'
                          : '选择部署'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 已部署设备 */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-3">已部署设备 ({deployedDevices.length})</h2>
            <div className="space-y-3">
              {deployedDevices.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">暂无已部署设备</p>
              ) : (
                deployedDevices.map((device) => (
                  <div key={device.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    {device.image && (
                      <img
                        src={device.image}
                        alt={device.name}
                        className="w-full h-32 object-cover"
                      />
                    )}
                    <div className="p-3">
                      <h3 className="font-medium mb-1">{device.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{device.type}</p>
                      <p className="text-sm text-gray-500 mb-2">
                        覆盖范围: {device.coverageRange} 公里
                      </p>
                      {device.position && (
                        <p className="text-sm text-gray-500 mb-3">
                          位置: {device.position.lng.toFixed(4)}, {device.position.lat.toFixed(4)}
                        </p>
                      )}
                      <button
                        onClick={() => handleUndeploy(device)}
                        className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700 transition-colors"
                      >
                        撤回部署
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 部署模式提示 */}
          {deploymentMode && selectedDevice && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-blue-900">部署模式已激活</h3>
                <button
                  onClick={handleCancelDeployment}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  取消
                </button>
              </div>
              <p className="text-sm text-blue-700">
                正在部署: {selectedDevice.name}
              </p>
              <p className="text-sm text-blue-600 mt-1">
                请在右侧地图上点击选择部署位置
              </p>
            </div>
          )}
        </div>

        {/* 右侧：地图 */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-3">部署地图</h2>
            <div className="border rounded-lg overflow-hidden" style={{ height: '600px' }}>
              <AMapComponent
                devices={devices}
                onMapClick={handleMapClick}
                showDeploymentMode={deploymentMode}
                selectedDevice={selectedDevice}
              />
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <p>💡 提示：</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>从左侧选择待部署设备</li>
                <li>在地图上点击选择部署位置</li>
                <li>蓝色圆圈表示设备的覆盖范围</li>
                <li>点击已部署的设备标记可以查看详细信息</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
