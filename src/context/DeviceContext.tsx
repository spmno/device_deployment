import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import type { Device, DeviceFormData, DeploymentData } from '@/types/device';

interface DeviceContextType {
  devices: Device[];
  addDevice: (deviceData: DeviceFormData) => void;
  updateDevice: (id: string, deviceData: Partial<DeviceFormData>) => void;
  deleteDevice: (id: string) => void;
  deployDevice: (deploymentData: DeploymentData) => void;
  undeployDevice: (id: string) => void;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const useDevices = () => {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDevices must be used within a DeviceProvider');
  }
  return context;
};

interface DeviceProviderProps {
  children: ReactNode;
}

export const DeviceProvider: React.FC<DeviceProviderProps> = ({ children }) => {
  const [devices, setDevices] = useState<Device[]>([
    {
      id: '1',
      name: '基站设备A',
      type: '通信基站',
      price: 50000,
      coverageRange: 10,
      image: 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=400&h=300&fit=crop',
      deployed: false,
    },
    {
      id: '2',
      name: '传感器节点B',
      type: '环境监测',
      price: 20000,
      coverageRange: 5,
      image: 'https://images.unsplash.com/photo-1581092921461-eab62e97a782?w=400&h=300&fit=crop',
      deployed: true,
      position: { lng: 116.397428, lat: 39.90923 },
    },
    {
      id: '3',
      name: '无人机充电站C',
      type: '充电设施',
      price: 80000,
      coverageRange: 15,
      image: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=400&h=300&fit=crop',
      deployed: true,
      position: { lng: 116.407526, lat: 39.90403 },
    },
  ]);

  const addDevice = useCallback((deviceData: DeviceFormData) => {
    const newDevice: Device = {
      id: Date.now().toString(),
      ...deviceData,
      deployed: false,
    };
    setDevices((prev) => [...prev, newDevice]);
  }, []);

  const updateDevice = useCallback((id: string, deviceData: Partial<DeviceFormData>) => {
    setDevices((prev) =>
      prev.map((device) =>
        device.id === id ? { ...device, ...deviceData } : device
      )
    );
  }, []);

  const deleteDevice = useCallback((id: string) => {
    setDevices((prev) => prev.filter((device) => device.id !== id));
  }, []);

  const deployDevice = useCallback((deploymentData: DeploymentData) => {
    setDevices((prev) =>
      prev.map((device) =>
        device.id === deploymentData.deviceId
          ? { ...device, deployed: true, position: { lng: deploymentData.lng, lat: deploymentData.lat } }
          : device
      )
    );
  }, []);

  const undeployDevice = useCallback((id: string) => {
    setDevices((prev) =>
      prev.map((device) =>
        device.id === id ? { ...device, deployed: false, position: undefined } : device
      )
    );
  }, []);

  return (
    <DeviceContext.Provider
      value={{
        devices,
        addDevice,
        updateDevice,
        deleteDevice,
        deployDevice,
        undeployDevice,
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
};
