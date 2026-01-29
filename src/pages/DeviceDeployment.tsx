import { useState } from 'react';
import { useDevices } from '@/context/DeviceContext';
import { AMapComponent } from '@/components/map/AMapComponent';
import type { Device } from '@/types/device';
import {
  MapPin,
  CheckCircle2,
  Circle,
  X,
  Crosshair,
  AlertCircle,
  Layers,
  Navigation
} from 'lucide-react';

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
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold title-glow mb-1">设备部署操作</h1>
        <p className="text-slate-400 text-sm">在地图上选择位置部署您的设备</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：设备选择列表 */}
        <div className="lg:col-span-1 space-y-4">
          {/* 待部署设备 */}
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                <MapPin className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-100">待部署设备</h2>
                <p className="text-slate-500 text-xs">{undeployedDevices.length} 台待部署</p>
              </div>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {undeployedDevices.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 mx-auto rounded-full bg-green-500/10 flex items-center justify-center mb-3">
                    <CheckCircle2 className="h-6 w-6 text-green-400" />
                  </div>
                  <p className="text-slate-400 text-sm">所有设备已部署</p>
                </div>
              ) : (
                undeployedDevices.map((device) => (
                  <div
                    key={device.id}
                    className={`glass-card rounded-lg overflow-hidden transition-all ${
                      deploymentMode && selectedDevice?.id === device.id
                        ? 'border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                        : ''
                    }`}
                  >
                    {device.image && (
                      <div className="w-full h-28 overflow-hidden">
                        <img
                          src={device.image}
                          alt={device.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-3">
                      <h3 className="font-medium text-slate-200 mb-1">{device.name}</h3>
                      <p className="text-xs text-cyan-400 mb-2">{device.type}</p>
                      <p className="text-xs text-slate-500 mb-3">
                        覆盖范围: <span className="text-slate-300">{device.coverageRange} 公里</span>
                      </p>
                      <button
                        onClick={() => handleSelectDevice(device)}
                        disabled={deploymentMode && selectedDevice?.id !== device.id}
                        className={`w-full py-2 rounded-lg text-sm font-medium transition-all ${
                          deploymentMode && selectedDevice?.id === device.id
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 cursor-default'
                            : 'btn-neon'
                        }`}
                      >
                        {deploymentMode && selectedDevice?.id === device.id ? '已在部署中' : '选择部署'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 已部署设备 */}
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-100">已部署设备</h2>
                <p className="text-slate-500 text-xs">{deployedDevices.length} 台已部署</p>
              </div>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {deployedDevices.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center mb-3">
                    <Circle className="h-6 w-6 text-slate-600" />
                  </div>
                  <p className="text-slate-500 text-sm">暂无已部署设备</p>
                </div>
              ) : (
                deployedDevices.map((device) => (
                  <div key={device.id} className="glass-card rounded-lg overflow-hidden">
                    {device.image && (
                      <div className="w-full h-28 overflow-hidden">
                        <img
                          src={device.image}
                          alt={device.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-3">
                      <h3 className="font-medium text-slate-200 mb-1">{device.name}</h3>
                      <p className="text-xs text-cyan-400 mb-2">{device.type}</p>
                      <p className="text-xs text-slate-500 mb-1">
                        覆盖: <span className="text-slate-300">{device.coverageRange} 公里</span>
                      </p>
                      {device.position && (
                        <p className="text-xs text-slate-500 mb-3 font-mono">
                          {device.position.lng.toFixed(4)}, {device.position.lat.toFixed(4)}
                        </p>
                      )}
                      <button
                        onClick={() => handleUndeploy(device)}
                        className="w-full py-2 rounded-lg text-sm font-medium btn-secondary border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
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
            <div className="glass-card rounded-xl p-4 border-cyan-500/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-cyan-500/5" />
              <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-pulse" />

              <div className="relative">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <Crosshair className="h-5 w-5 text-cyan-400 animate-pulse" />
                    <h3 className="font-semibold text-cyan-400">部署模式已激活</h3>
                  </div>
                  <button
                    onClick={handleCancelDeployment}
                    className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-slate-300 mb-1">
                  正在部署: <span className="text-cyan-400 font-medium">{selectedDevice.name}</span>
                </p>
                <p className="text-xs text-slate-500">
                  请在右侧地图上点击选择部署位置
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 右侧：地图 */}
        <div className="lg:col-span-2">
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                <Navigation className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-100">部署地图</h2>
                <p className="text-slate-500 text-xs">点击地图选择部署位置</p>
              </div>
            </div>

            <div className="border border-cyan-500/20 rounded-xl overflow-hidden" style={{ height: '600px' }}>
              <AMapComponent
                devices={devices}
                onMapClick={handleMapClick}
                showDeploymentMode={deploymentMode}
                selectedDevice={selectedDevice}
              />
            </div>

            {/* 提示信息 */}
            <div className="mt-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-2 text-cyan-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">操作提示</span>
              </div>
              <ul className="text-sm text-slate-400 space-y-1.5 ml-6">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  从左侧选择待部署设备
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  在地图上点击选择部署位置
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  蓝色圆圈表示设备的覆盖范围
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  点击已部署的设备标记可以查看详细信息
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
