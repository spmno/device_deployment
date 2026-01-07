export interface Device {
  id: string;
  name: string;
  type: string;
  price: number;
  coverageRange: number; // 覆盖范围（公里）
  deployed: boolean;
  position?: {
    lng: number; // 经度
    lat: number; // 纬度
  };
}

export interface DeviceFormData {
  name: string;
  type: string;
  price: number;
  coverageRange: number;
}

export type DeploymentData = {
  deviceId: string;
  lng: number;
  lat: number;
};

export type StatisticsData = {
  totalDevices: number;
  deployedDevices: number;
  undeployedDevices: number;
  totalCoverage: number; // 总覆盖范围（平方公里，简化计算）
  totalCost: number; // 总成本
};
