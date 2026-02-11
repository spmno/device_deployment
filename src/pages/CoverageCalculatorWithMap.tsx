import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Settings,
  Calculator,
  Maximize,
  DollarSign,
  Loader2,
  Target,
  Grid3x3,
  Zap,
  Info,
  CheckCircle2,
  Search,
  MapPin,
  Crosshair,
  RotateCcw
} from 'lucide-react';

interface DevicePosition {
  x: number;
  y: number;
  row: number;
  col: number;
  lng?: number;
  lat?: number;
}

interface CoverageResult {
  deviceCount: number;
  rowCount: number;
  colCount: number;
  spacing: number;
  totalCost: number;
  coverageRate: number;
  devicePositions: DevicePosition[];
  deviceShape: 'circle' | 'hexagon';
}

// 设备形状类型
type DeviceShape = 'circle' | 'hexagon';

// 设备形状预设
const DEVICE_SHAPES = [
  { value: 'circle' as const, label: '圆形覆盖' },
  { value: 'hexagon' as const, label: '六边形覆盖' },
];

// 设备类型预设
const DEVICE_PRESETS = [
  { name: '监视基站', coverageRadius: 1, price: 150000 },
  { name: '雷达', coverageRadius: 3, price: 700000 },
  { name: '光电设备', coverageRadius: 3, price: 400000 },
  { name: '频谱探测', coverageRadius: 3, price: 250000 },
  { name: '定向干扰', coverageRadius: 3, price: 180000 },
];

declare global {
  interface Window {
    AMap: any;
  }
}

export const CoverageCalculatorWithMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const coverageLayerRef = useRef<any[]>([]);
  const centerMarkerRef = useRef<any>(null);

  // 配置参数
  const [areaLength, setAreaLength] = useState<number>(10);
  const [areaWidth, setAreaWidth] = useState<number>(10);
  const [deviceType, setDeviceType] = useState<string>(DEVICE_PRESETS[0].name);
  const [coverageRadius, setCoverageRadius] = useState<number>(DEVICE_PRESETS[0].coverageRadius);
  const [devicePrice, setDevicePrice] = useState<number>(DEVICE_PRESETS[0].price);
  const [result, setResult] = useState<CoverageResult | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [deviceShape, setDeviceShape] = useState<DeviceShape>('circle');

  // 输入字符串值（用于显示）
  const [coverageRadiusInput, setCoverageRadiusInput] = useState<string>(DEVICE_PRESETS[0].coverageRadius.toString());
  const [devicePriceInput, setDevicePriceInput] = useState<string>(DEVICE_PRESETS[0].price.toString());
  const [areaLengthInput, setAreaLengthInput] = useState<string>('10');
  const [areaWidthInput, setAreaWidthInput] = useState<string>('10');

  // 地图搜索相关
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [centerPoint, setCenterPoint] = useState<{ lng: number; lat: number } | null>(null);
  const [hasConfirmedCenter, setHasConfirmedCenter] = useState(false);
  const placeSearchRef = useRef<any>(null);

  // 初始化地图
  useEffect(() => {
    if (!window.AMap || !mapRef.current) return;

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
        'AMap.Scale',
        'AMap.PlaceSearch',
      ], () => {
        const toolbar = new window.AMap.ToolBar();
        mapInstanceRef.current.addControl(toolbar);

        const scale = new window.AMap.Scale();
        mapInstanceRef.current.addControl(scale);

        // 初始化地点搜索
        placeSearchRef.current = new window.AMap.PlaceSearch({
          pageSize: 10,
          pageIndex: 1,
          map: mapInstanceRef.current,
        });

        placeSearchRef.current.on('complete', (result: any) => {
          setIsSearching(false);
          if (result.info === 'OK') {
            setSearchResults(result.poiList.pois);
          } else {
            setSearchResults([]);
          }
        });

        placeSearchRef.current.on('error', () => {
          setIsSearching(false);
          setSearchResults([]);
        });
      });

      // 点击地图设置中心点（仅在未确认中心点时）
      mapInstanceRef.current.on('click', (e: any) => {
        if (!hasConfirmedCenter) {
          const lng = e.lnglat.lng;
          const lat = e.lnglat.lat;
          setCenterPoint({ lng, lat });
          updateCenterMarker(lng, lat);
        }
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, [hasConfirmedCenter]);

  // 更新中心点标记
  const updateCenterMarker = (lng: number, lat: number) => {
    if (!mapInstanceRef.current) return;

    // 清除旧标记
    if (centerMarkerRef.current) {
      centerMarkerRef.current.setMap(null);
    }

    // 创建新标记
    centerMarkerRef.current = new window.AMap.Marker({
      position: [lng, lat],
      icon: new window.AMap.Icon({
        size: new window.AMap.Size(32, 32),
        image: 'data:image/svg+xml;base64,' + btoa(`
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="3" fill="#06b6d4"/>
            <line x1="12" y1="2" x2="12" y2="6"/>
            <line x1="12" y1="18" x2="12" y2="22"/>
            <line x1="2" y1="12" x2="6" y2="12"/>
            <line x1="18" y1="12" x2="22" y2="12"/>
          </svg>
        `),
        imageSize: new window.AMap.Size(32, 32),
      }),
      offset: new window.AMap.Pixel(-16, -16),
    });
    centerMarkerRef.current.setMap(mapInstanceRef.current);
  };

  // 处理搜索
  const handleSearch = () => {
    if (!searchQuery.trim() || !placeSearchRef.current) return;

    setIsSearching(true);
    setSearchResults([]);
    placeSearchRef.current.search(searchQuery);
  };

  // 处理搜索结果点击
  const handleResultClick = (result: any) => {
    if (!mapInstanceRef.current) return;

    const location = result.location;
    if (location) {
      mapInstanceRef.current.setCenter([location.lng, location.lat]);
      mapInstanceRef.current.setZoom(15);
      setCenterPoint({ lng: location.lng, lat: location.lat });
      updateCenterMarker(location.lng, location.lat);
      setSearchResults([]);
      setSearchQuery(result.name);
    }
  };

  // 确认中心点
  const confirmCenterPoint = () => {
    if (centerPoint) {
      setHasConfirmedCenter(true);
    }
  };

  // 重置中心点
  const resetCenterPoint = () => {
    setHasConfirmedCenter(false);
    setCenterPoint(null);
    if (centerMarkerRef.current) {
      centerMarkerRef.current.setMap(null);
      centerMarkerRef.current = null;
    }
    clearCoverageLayer();
    setResult(null);
  };

  // 选择设备类型预设
  const handleDeviceTypeChange = (type: string) => {
    const preset = DEVICE_PRESETS.find(p => p.name === type);
    if (preset) {
      setDeviceType(type);
      setCoverageRadius(preset.coverageRadius);
      setCoverageRadiusInput(preset.coverageRadius.toString());
      setDevicePrice(preset.price);
      setDevicePriceInput(preset.price.toString());
    }
  };

  // 处理数值输入变化
  const handleNumberInputChange = (
    value: string,
    inputSetter: (val: string) => void
  ) => {
    inputSetter(value);
  };

  // 处理输入框失去焦点
  const handleNumberBlur = (
    value: string,
    setter: (val: number) => void,
    inputSetter: (val: string) => void,
    min: number = 0,
    defaultValue: number
  ) => {
    if (value.trim() === '') {
      inputSetter(defaultValue.toString());
      setter(defaultValue);
      return;
    }

    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= min) {
      setter(numValue);
      inputSetter(numValue.toString());
    } else {
      inputSetter(defaultValue.toString());
      setter(defaultValue);
    }
  };

  // 清除覆盖层
  const clearCoverageLayer = () => {
    coverageLayerRef.current.forEach((item) => {
      if (item.setMap) {
        item.setMap(null);
      }
    });
    coverageLayerRef.current = [];
  };

  // 计算最优覆盖方案
  const calculateCoverage = useCallback(() => {
    if (!centerPoint || !mapInstanceRef.current) return;

    setIsCalculating(true);
    clearCoverageLayer();

    const radius = coverageRadius;
    const length = areaLength;
    const width = areaWidth;

    if (isNaN(radius) || radius <= 0 || isNaN(length) || length < 1 || isNaN(width) || width < 1) {
      setIsCalculating(false);
      return;
    }

    // 根据选择的形状计算不同的间距
    let rowSpacing: number;
    let colSpacing: number;
    let horizontalOffset: number;

    if (deviceShape === 'hexagon') {
      // 六边形覆盖（平边朝上）：蜂窝状排列
      // 正六边形边长 = 半径
      // 水平方向：相邻六边形中心距 = 边长 × √3 = 2 × 边心距
      // 垂直方向：相邻行中心距 = 边长 × 1.5
      // 奇数行偏移 = 水平间距的一半
      rowSpacing = radius * 1.5;                    // 垂直间距
      colSpacing = radius * Math.sqrt(3);           // 水平间距
      horizontalOffset = colSpacing / 2;            // 奇数行水平偏移
    } else {
      // 圆形覆盖：六边形排列
      rowSpacing = radius * Math.sqrt(3);           // 垂直间距
      colSpacing = radius * 2;                      // 水平间距（圆形直径）
      horizontalOffset = radius;                    // 奇数行水平偏移
    }

    const rowCount = Math.ceil(length / rowSpacing) + 1;
    const colCount = Math.ceil(width / colSpacing) + 1;

    const maxDevices = 5000;

    const devicePositions: DevicePosition[] = [];
    let deviceCount = 0;

    // 计算中心点作为原点
    const centerLng = centerPoint.lng;
    const centerLat = centerPoint.lat;

    // 将公里转换为经纬度偏移（近似值）
    const kmToLng = 1 / 111;
    const kmToLat = 1 / 111;

    for (let row = 0; row < rowCount; row++) {
      for (let col = 0; col < colCount; col++) {
        if (deviceCount >= maxDevices) break;

        const xOffset = row % 2 === 0 ? 0 : horizontalOffset;
        const x = col * colSpacing + xOffset - width / 2;
        const y = row * rowSpacing - length / 2;

        // 检查设备中心是否在区域内（考虑六边形/圆形的边界）
        const isInBounds = x >= -width / 2 && x <= width / 2 && y >= -length / 2 && y <= length / 2;

        if (isInBounds) {
          // 转换为经纬度
          const lng = centerLng + x * kmToLng;
          const lat = centerLat + y * kmToLat;

          devicePositions.push({ x, y, row, col, lng, lat });
          deviceCount++;
        }
      }
      if (deviceCount >= maxDevices) break;
    }

    const finalDeviceCount = devicePositions.length;
    const totalCost = finalDeviceCount * devicePrice;
    const area = length * width;

    let coverageRate: number;
    if (deviceShape === 'hexagon') {
      const hexagonArea = (3 * Math.sqrt(3) / 2) * radius * radius;
      coverageRate = Math.min(100, (finalDeviceCount * hexagonArea) / area * 100);
    } else {
      coverageRate = Math.min(100, (finalDeviceCount * Math.PI * radius * radius) / area * 100);
    }

    setResult({
      deviceCount: finalDeviceCount,
      rowCount,
      colCount,
      spacing: Math.min(rowSpacing, colSpacing),
      totalCost,
      coverageRate,
      devicePositions,
      deviceShape,
    });

    // 在地图上绘制覆盖
    drawCoverageOnMap(devicePositions, radius, deviceShape);

    setIsCalculating(false);
  }, [coverageRadius, areaLength, areaWidth, devicePrice, deviceShape, centerPoint]);

  // 在地图上绘制覆盖
  const drawCoverageOnMap = (positions: DevicePosition[], radius: number, shape: 'circle' | 'hexagon') => {
    if (!mapInstanceRef.current) return;

    clearCoverageLayer();

    positions.forEach((device, index) => {
      if (!device.lng || !device.lat) return;

      // 绘制覆盖区域
      if (shape === 'hexagon') {
        // 六边形覆盖（平边朝上）
        // 正六边形：边长 = 半径，平边朝上时顶点在上下
        const path = [];
        for (let i = 0; i < 6; i++) {
          // 从 -30度 开始，每60度一个顶点（平边朝上）
          const angle = (Math.PI / 3) * i - Math.PI / 6;
          // 计算经纬度偏移（考虑纬度对经度距离的影响）
          const latOffset = (radius / 111) * Math.sin(angle);
          const lngOffset = (radius / 111) * Math.cos(angle) / Math.cos(device.lat * Math.PI / 180);
          const lng = device.lng + lngOffset;
          const lat = device.lat + latOffset;
          path.push([lng, lat]);
        }

        const polygon = new window.AMap.Polygon({
          path: path,
          fillColor: 'rgba(6, 182, 212, 0.25)',
          strokeColor: 'rgba(6, 182, 212, 0.8)',
          strokeWeight: 1,
          strokeStyle: 'solid',
        });
        polygon.setMap(mapInstanceRef.current);
        coverageLayerRef.current.push(polygon);
      } else {
        // 圆形覆盖
        const circle = new window.AMap.Circle({
          center: [device.lng, device.lat],
          radius: radius * 1000,
          fillColor: 'rgba(6, 182, 212, 0.25)',
          strokeColor: 'rgba(6, 182, 212, 0.8)',
          strokeWeight: 1,
          strokeStyle: 'solid',
        });
        circle.setMap(mapInstanceRef.current);
        coverageLayerRef.current.push(circle);
      }

      // 绘制设备点标记
      const marker = new window.AMap.Marker({
        position: [device.lng, device.lat],
        icon: new window.AMap.Icon({
          size: new window.AMap.Size(12, 12),
          image: 'data:image/svg+xml;base64,' + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12">
              <circle cx="6" cy="6" r="5" fill="#06b6d4" stroke="#ffffff" stroke-width="1"/>
            </svg>
          `),
          imageSize: new window.AMap.Size(12, 12),
        }),
        offset: new window.AMap.Pixel(-6, -6),
        label: {
          content: `<div style="padding: 2px 4px; background: rgba(6, 182, 212, 0.9); color: #fff; border-radius: 3px; font-size: 10px; white-space: nowrap;">#${index + 1}</div>`,
          direction: 'top',
          offset: new window.AMap.Pixel(0, -8),
        },
      });
      marker.setMap(mapInstanceRef.current);
      coverageLayerRef.current.push(marker);
    });

    // 调整视野以显示所有覆盖
    if (coverageLayerRef.current.length > 0) {
      mapInstanceRef.current.setFitView(coverageLayerRef.current, false, [50, 50, 50, 50]);
    }
  };

  // 统计卡片组件
  const StatCard = ({
    icon: Icon,
    label,
    value,
    color
  }: {
    icon: React.ElementType;
    label: string;
    value: string;
    color: string;
  }) => (
    <div className="glass-card rounded-xl p-3">
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-slate-500 text-xs">{label}</p>
          <p className="text-base font-bold text-slate-100">{value}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* 页面标题和搜索 */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold title-glow mb-1">设备覆盖计算</h1>
          <p className="text-slate-400 text-sm">使用高德地图底图，在真实地理区域上计算设备部署方案</p>
        </div>

        {/* 搜索框 */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索地点..."
              className="input-glow w-64 px-4 py-2 pl-10 rounded-lg text-sm"
              disabled={hasConfirmedCenter}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim() || hasConfirmedCenter}
            className="btn-neon px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : '搜索'}
          </button>
        </div>
      </div>

      {/* 搜索结果下拉 */}
      {searchResults.length > 0 && !hasConfirmedCenter && (
        <div className="glass-card rounded-xl p-2 max-w-md ml-auto">
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {searchResults.map((result, index) => (
              <button
                key={index}
                onClick={() => handleResultClick(result)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-cyan-500/10 rounded-lg transition-colors"
              >
                <div className="font-medium text-slate-200">{result.name}</div>
                <div className="text-slate-500 text-xs truncate">{result.address || '无地址信息'}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* 左侧：地图显示区域 */}
        <div className="lg:col-span-3">
          <div className="glass-card rounded-xl p-4 h-[600px] relative">
            {/* 地图标题栏 */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                  <MapPin className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">覆盖区域地图</h2>
                  <p className="text-slate-500 text-xs">
                    {hasConfirmedCenter
                      ? `中心点: ${centerPoint?.lng.toFixed(4)}, ${centerPoint?.lat.toFixed(4)}`
                      : centerPoint
                        ? '点击"确认中心点"开始计算'
                        : '点击地图或搜索选择中心点'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!hasConfirmedCenter && centerPoint && (
                  <button
                    onClick={confirmCenterPoint}
                    className="btn-neon px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                  >
                    <Crosshair className="h-4 w-4" />
                    确认中心点
                  </button>
                )}
                {hasConfirmedCenter && (
                  <button
                    onClick={resetCenterPoint}
                    className="btn-secondary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    重新选择
                  </button>
                )}
              </div>
            </div>

            {/* 地图容器 */}
            <div className="relative w-full h-[500px] rounded-lg overflow-hidden border border-cyan-500/20">
              <div ref={mapRef} className="w-full h-full" />

              {/* 加载遮罩 */}
              {isCalculating && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm z-10">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 text-cyan-400 animate-spin" />
                    <span className="text-slate-300">正在计算最优方案...</span>
                  </div>
                </div>
              )}

              {/* 提示信息 */}
              {!hasConfirmedCenter && !centerPoint && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/90 px-4 py-2 rounded-lg border border-cyan-500/30 z-10">
                  <p className="text-sm text-cyan-400 flex items-center gap-2">
                    <Crosshair className="h-4 w-4" />
                    点击地图选择中心点，或使用搜索功能
                  </p>
                </div>
              )}
            </div>

            {/* 统计结果 */}
            {result && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  icon={Calculator}
                  label="设备数量"
                  value={result.deviceCount.toString()}
                  color="bg-cyan-500"
                />
                <StatCard
                  icon={DollarSign}
                  label="总成本"
                  value={`¥${(result.totalCost / 10000).toFixed(1)}万`}
                  color="bg-green-500"
                />
                <StatCard
                  icon={Target}
                  label="覆盖效率"
                  value={`${result.coverageRate.toFixed(1)}%`}
                  color="bg-purple-500"
                />
                <StatCard
                  icon={Grid3x3}
                  label="设备间距"
                  value={`${result.spacing.toFixed(2)} km`}
                  color="bg-orange-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* 右侧：配置区域 */}
        <div className="lg:col-span-1">
          <div className="glass-card rounded-xl p-5 space-y-5 max-h-[600px] overflow-y-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                <Settings className="h-5 w-5 text-purple-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-100">配置参数</h2>
            </div>

            {/* 设备类型选择 */}
            <div>
              <label className="block text-sm font-medium text-cyan-400 mb-2">
                设备类型
              </label>
              <select
                value={deviceType}
                onChange={(e) => handleDeviceTypeChange(e.target.value)}
                className="input-glow w-full px-4 py-2.5 rounded-lg text-slate-200 text-sm"
                disabled={isCalculating || !hasConfirmedCenter}
              >
                {DEVICE_PRESETS.map((preset) => (
                  <option key={preset.name} value={preset.name} className="bg-slate-900">
                    {preset.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 设备形状选择 */}
            <div>
              <label className="block text-sm font-medium text-cyan-400 mb-2">
                覆盖形状
              </label>
              <div className="grid grid-cols-2 gap-2">
                {DEVICE_SHAPES.map((shape) => (
                  <button
                    key={shape.value}
                    onClick={() => setDeviceShape(shape.value)}
                    disabled={!hasConfirmedCenter}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      deviceShape === shape.value
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                    } border disabled:opacity-50`}
                  >
                    {shape.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 覆盖半径 */}
            <div>
              <label className="block text-sm font-medium text-cyan-400 mb-2">
                覆盖半径（公里）
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={coverageRadiusInput}
                onChange={(e) => handleNumberInputChange(e.target.value, setCoverageRadiusInput)}
                onBlur={(e) => handleNumberBlur(e.target.value, setCoverageRadius, setCoverageRadiusInput, 0.1, DEVICE_PRESETS[0].coverageRadius)}
                className="input-glow w-full px-4 py-2.5 rounded-lg text-sm"
                disabled={isCalculating || !hasConfirmedCenter}
              />
              <p className="mt-1 text-xs text-slate-500">
                设备的单点覆盖范围
              </p>
            </div>

            {/* 设备价格 */}
            <div>
              <label className="block text-sm font-medium text-cyan-400 mb-2">
                设备价格（元）
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={devicePriceInput}
                onChange={(e) => handleNumberInputChange(e.target.value, setDevicePriceInput)}
                onBlur={(e) => handleNumberBlur(e.target.value, setDevicePrice, setDevicePriceInput, 0, DEVICE_PRESETS[0].price)}
                className="input-glow w-full px-4 py-2.5 rounded-lg text-sm"
                disabled={isCalculating || !hasConfirmedCenter}
              />
            </div>

            {/* 覆盖区域 */}
            <div>
              <label className="block text-sm font-medium text-cyan-400 mb-2">
                区域长度（公里）
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={areaLengthInput}
                onChange={(e) => handleNumberInputChange(e.target.value, setAreaLengthInput)}
                onBlur={(e) => handleNumberBlur(e.target.value, setAreaLength, setAreaLengthInput, 1, 10)}
                className="input-glow w-full px-4 py-2.5 rounded-lg mb-3 text-sm"
                disabled={isCalculating || !hasConfirmedCenter}
              />

              <label className="block text-sm font-medium text-cyan-400 mb-2">
                区域宽度（公里）
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={areaWidthInput}
                onChange={(e) => handleNumberInputChange(e.target.value, setAreaWidthInput)}
                onBlur={(e) => handleNumberBlur(e.target.value, setAreaWidth, setAreaWidthInput, 1, 10)}
                className="input-glow w-full px-4 py-2.5 rounded-lg text-sm"
                disabled={isCalculating || !hasConfirmedCenter}
              />
            </div>

            {/* 算法说明 */}
            <div className="rounded-xl p-3 bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-2 text-purple-400">
                <Info className="h-4 w-4" />
                <span className="text-sm font-medium">算法说明</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {deviceShape === 'hexagon'
                  ? '采用六边形排列和六边形覆盖，形成蜂窝状无死角覆盖。'
                  : '采用六边形排列算法，覆盖区域为圆形，最小化重叠实现高效覆盖。'}
              </p>
            </div>

            {/* 计算按钮 */}
            <button
              onClick={() => {
                setIsCalculating(true);
                calculateCoverage();
              }}
              disabled={isCalculating || !hasConfirmedCenter}
              className="w-full btn-neon py-3 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isCalculating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  计算中...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5" />
                  计算覆盖方案
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 详细说明 */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
            <CheckCircle2 className="h-5 w-5 text-cyan-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-100">功能说明</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
            <h3 className="font-medium text-cyan-400 mb-3 flex items-center gap-2">
              <Search className="h-4 w-4" />
              地点搜索
            </h3>
            <ul className="text-sm text-slate-400 space-y-2">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2" />
                输入地点名称进行搜索
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2" />
                点击搜索结果定位到地图
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2" />
                也可直接点击地图选择中心点
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
            <h3 className="font-medium text-purple-400 mb-3 flex items-center gap-2">
              <Grid3x3 className="h-4 w-4" />
              覆盖算法
            </h3>
            <ul className="text-sm text-slate-400 space-y-2">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2" />
                使用六边形排列实现最优覆盖
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2" />
                支持圆形和六边形两种覆盖形状
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2" />
                最小化设备数量和成本
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
            <h3 className="font-medium text-green-400 mb-3 flex items-center gap-2">
              <Maximize className="h-4 w-4" />
              地图展示
            </h3>
            <ul className="text-sm text-slate-400 space-y-2">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2" />
                高德地图作为底图
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2" />
                覆盖区域叠加在地图上层
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2" />
                上下两层比例尺一致
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
