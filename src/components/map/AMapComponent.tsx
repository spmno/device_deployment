import { useEffect, useRef } from 'react';
import type { Device } from '@/types/device';

interface AMapProps {
  devices: Device[];
  onMapClick?: (lng: number, lat: number) => void;
  showDeploymentMode?: boolean;
  selectedDevice?: Device | null;
}

declare global {
  interface Window {
    AMap: any;
  }
}

export const AMapComponent: React.FC<AMapProps> = ({
  devices,
  onMapClick,
  showDeploymentMode = false,
  selectedDevice,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const circlesRef = useRef<any[]>([]);

  useEffect(() => {
    if (!window.AMap || !mapRef.current) return;

    // 初始化地图
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new window.AMap.Map(mapRef.current, {
        zoom: 12,
        center: [116.397428, 39.90923], // 北京天安门
        viewMode: '2D',
        mapStyle: 'amap://styles/normal',
      });

      // 加载插件
      window.AMap.plugin([
        'AMap.ToolBar',
        'AMap.Scale'
      ], () => {
        // 添加工具栏
        const toolbar = new window.AMap.ToolBar();
        mapInstanceRef.current.addControl(toolbar);

        const scale = new window.AMap.Scale();
        mapInstanceRef.current.addControl(scale);
      });

      // 如果是部署模式，添加点击事件
      if (showDeploymentMode && onMapClick) {
        mapInstanceRef.current.on('click', (e: any) => {
          onMapClick(e.lnglat.lng, e.lnglat.lat);
        });
      }
    }

    return () => {
      // 清理
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 更新标记和覆盖范围圆
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // 清除旧的标记和圆
    markersRef.current.forEach((marker) => marker.setMap(null));
    circlesRef.current.forEach((circle) => circle.setMap(null));
    markersRef.current = [];
    circlesRef.current = [];

    // 为每个已部署的设备添加标记和覆盖范围圆
    devices.forEach((device) => {
      if (device.deployed && device.position) {
        // 创建标记
        const marker = new window.AMap.Marker({
          position: [device.position.lng, device.position.lat],
          title: device.name,
          label: {
            content: `<div style="padding: 2px 5px; background: white; border-radius: 3px; font-size: 12px;">${device.name}</div>`,
            direction: 'top',
          },
        });
        marker.setMap(mapInstanceRef.current);
        markersRef.current.push(marker);

        // 创建覆盖范围圆
        const circle = new window.AMap.Circle({
          center: [device.position.lng, device.position.lat],
          radius: device.coverageRange * 1000, // 转换为米
          fillColor: 'rgba(66, 135, 245, 0.3)',
          strokeColor: 'rgba(66, 135, 245, 0.8)',
          strokeWeight: 2,
          strokeStyle: 'solid',
        });
        circle.setMap(mapInstanceRef.current);
        circlesRef.current.push(circle);

        // 添加点击事件
        marker.on('click', () => {
          const infoWindow = new window.AMap.InfoWindow({
            content: `
              <div style="padding: 10px;">
                <h3 style="margin: 0 0 8px 0; font-size: 16px;">${device.name}</h3>
                <p style="margin: 4px 0; font-size: 13px;">类型: ${device.type}</p>
                <p style="margin: 4px 0; font-size: 13px;">价格: ¥${device.price.toLocaleString()}</p>
                <p style="margin: 4px 0; font-size: 13px;">覆盖范围: ${device.coverageRange} 公里</p>
                ${device.position ? `<p style="margin: 4px 0; font-size: 13px;">位置: ${device.position.lng.toFixed(4)}, ${device.position.lat.toFixed(4)}</p>` : ''}
              </div>
            `,
          });
          if (device.position) {
            infoWindow.open(mapInstanceRef.current, [device.position.lng, device.position.lat]);
          }
        });
      }
    });

    // 自动调整视野
    if (markersRef.current.length > 0) {
      mapInstanceRef.current.setFitView(markersRef.current);
    }
  }, [devices]);

  // 更新地图光标样式
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setDefaultCursor(showDeploymentMode ? 'crosshair' : 'default');
    }
  }, [showDeploymentMode]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" style={{ minHeight: '500px' }} />
      {showDeploymentMode && (
        <div className="absolute top-4 left-4 bg-white bg-opacity-90 px-4 py-2 rounded-lg shadow-md z-10">
          <p className="text-sm text-blue-600 font-medium">
            {selectedDevice ? `点击地图部署: ${selectedDevice.name}` : '请先选择要部署的设备'}
          </p>
        </div>
      )}
    </div>
  );
};
