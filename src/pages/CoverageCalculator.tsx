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
  CheckCircle2
} from 'lucide-react';

interface DevicePosition {
  x: number;
  y: number;
  row: number;
  col: number;
}

interface CoverageResult {
  deviceCount: number;
  rowCount: number;
  colCount: number;
  spacing: number;
  totalCost: number;
  coverageRate: number;
  devicePositions: DevicePosition[];
}

// 设备类型预设
const DEVICE_PRESETS = [
  { name: '监视基站', coverageRadius: 1, price: 150000 },
  { name: '雷达', coverageRadius: 3, price: 700000 },
  { name: '光电设备', coverageRadius: 3, price: 400000 },
  { name: '频谱探测', coverageRadius: 3, price: 250000 },
  { name: '定向干扰', coverageRadius: 3, price: 180000 },
];

export const CoverageCalculator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 配置参数
  const [areaLength, setAreaLength] = useState<number>(10);
  const [areaWidth, setAreaWidth] = useState<number>(10);
  const [deviceType, setDeviceType] = useState<string>(DEVICE_PRESETS[0].name);
  const [coverageRadius, setCoverageRadius] = useState<number>(DEVICE_PRESETS[0].coverageRadius);
  const [devicePrice, setDevicePrice] = useState<number>(DEVICE_PRESETS[0].price);
  const [result, setResult] = useState<CoverageResult | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  // 输入字符串值（用于显示）
  const [coverageRadiusInput, setCoverageRadiusInput] = useState<string>(DEVICE_PRESETS[0].coverageRadius.toString());
  const [devicePriceInput, setDevicePriceInput] = useState<string>(DEVICE_PRESETS[0].price.toString());
  const [areaLengthInput, setAreaLengthInput] = useState<string>('10');
  const [areaWidthInput, setAreaWidthInput] = useState<string>('10');

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

  // 计算最优覆盖方案
  const calculateCoverage = useCallback(() => {
    setIsCalculating(true);

    const radius = coverageRadius;
    const length = areaLength;
    const width = areaWidth;

    if (isNaN(radius) || radius <= 0 || isNaN(length) || length < 1 || isNaN(width) || width < 1) {
      setIsCalculating(false);
      return;
    }

    const rowSpacing = radius * Math.sqrt(3);
    const colSpacing = radius * 1.5;

    const rowCount = Math.ceil(length / rowSpacing) + 1;
    const colCount = Math.ceil(width / colSpacing) + 1;

    const maxDevices = 5000;

    const devicePositions: DevicePosition[] = [];
    let deviceCount = 0;
    for (let row = 0; row < rowCount; row++) {
      for (let col = 0; col < colCount; col++) {
        if (deviceCount >= maxDevices) break;

        const xOffset = row % 2 === 0 ? 0 : colSpacing / 2;
        const x = col * colSpacing + xOffset;
        const y = row * rowSpacing;

        if (x - radius <= width && y - radius <= length) {
          devicePositions.push({ x, y, row, col });
          deviceCount++;
        }
      }
      if (deviceCount >= maxDevices) break;
    }

    const finalDeviceCount = devicePositions.length;
    const totalCost = finalDeviceCount * devicePrice;
    const area = length * width;
    const coverageRate = Math.min(100, (finalDeviceCount * Math.PI * radius * radius) / area * 100);

    setResult({
      deviceCount: finalDeviceCount,
      rowCount,
      colCount,
      spacing: Math.min(rowSpacing, colSpacing),
      totalCost,
      coverageRate,
      devicePositions,
    });

    setIsCalculating(false);
  }, [coverageRadius, areaLength, areaWidth, devicePrice]);

  // 在Canvas上绘制覆盖图
  const drawCoverageMap = () => {
    const canvas = canvasRef.current;
    if (!canvas || !result) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvasSize = 600;
    const padding = 40;
    const drawArea = canvasSize - padding * 2;

    canvas.width = canvasSize;
    canvas.height = canvasSize;

    // 清空画布 - 使用深色背景
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 计算缩放比例
    const maxLength = Math.max(areaLength, areaWidth);
    const scale = drawArea / maxLength;

    const drawWidth = areaWidth * scale;
    const drawLength = areaLength * scale;

    // 绘制网格背景
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.1)';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 20; i++) {
      const x = padding + (i / 20) * drawWidth;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, padding + drawLength);
      ctx.stroke();
    }

    for (let i = 0; i <= 20; i++) {
      const y = padding + (i / 20) * drawLength;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + drawWidth, y);
      ctx.stroke();
    }

    // 绘制区域边框
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.strokeRect(padding, padding, drawWidth, drawLength);

    // 垂直网格线
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
    ctx.lineWidth = 1;

    for (let i = 0; i <= areaWidth; i++) {
      ctx.beginPath();
      ctx.moveTo(padding + i * scale, padding);
      ctx.lineTo(padding + i * scale, padding + drawLength);
      ctx.stroke();

      if (i % Math.ceil(areaWidth / 10) === 0 || i === areaWidth) {
        ctx.fillStyle = '#64748b';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${i}km`, padding + i * scale, padding - 10);
      }
    }

    // 水平网格线
    for (let i = 0; i <= areaLength; i++) {
      ctx.beginPath();
      ctx.moveTo(padding, padding + i * scale);
      ctx.lineTo(padding + drawWidth, padding + i * scale);
      ctx.stroke();

      if (i % Math.ceil(areaLength / 10) === 0 || i === areaLength) {
        ctx.fillStyle = '#64748b';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${i}km`, padding - 10, padding + i * scale);
      }
    }

    // 绘制设备覆盖圆
    result.devicePositions.forEach((device, index) => {
      const centerX = padding + device.x * scale;
      const centerY = padding + device.y * scale;
      const radius = coverageRadius * scale;

      // 绘制覆盖圆 - 霓虹效果
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 绘制设备点
      ctx.beginPath();
      ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#06b6d4';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 绘制设备编号
      ctx.fillStyle = '#22d3ee';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`#${index + 1}`, centerX, centerY - 14);
    });

    // 绘制图例
    const legendX = padding;
    const legendY = canvasSize - padding + 15;

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('图例: ', legendX, legendY - 25);

    ctx.beginPath();
    ctx.arc(legendX + 60, legendY - 18, 10, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(6, 182, 212, 0.3)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.fillText('设备覆盖区域', legendX + 80, legendY - 25);

    ctx.beginPath();
    ctx.arc(legendX + 60, legendY + 5, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#06b6d4';
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.fillText('设备位置', legendX + 80, legendY - 2);
  };

  useEffect(() => {
    drawCoverageMap();
  }, [result, coverageRadius]);

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
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-slate-500 text-xs">{label}</p>
          <p className="text-xl font-bold text-slate-100">{value}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold title-glow mb-1">设备覆盖计算</h1>
        <p className="text-slate-400 text-sm">使用六边形排列算法计算最优设备部署方案</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 左侧：显示区域 */}
        <div className="lg:col-span-3">
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                  <Maximize className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">覆盖区域可视化</h2>
                  <p className="text-slate-500 text-xs">实时预览设备部署布局</p>
                </div>
              </div>
              {isCalculating && (
                <div className="flex items-center gap-2 text-cyan-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">计算中...</span>
                </div>
              )}
            </div>

            <div className="flex justify-center relative">
              {isCalculating && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm z-10 rounded-xl">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 text-cyan-400 animate-spin" />
                    <span className="text-slate-300">正在计算最优方案...</span>
                  </div>
                </div>
              )}
              <canvas
                ref={canvasRef}
                className="border border-cyan-500/20 rounded-xl"
              />
            </div>

            {result && (
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
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
          <div className="glass-card rounded-xl p-6 space-y-6">
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
                className="input-glow w-full px-4 py-2.5 rounded-lg text-slate-200"
              >
                {DEVICE_PRESETS.map((preset) => (
                  <option key={preset.name} value={preset.name} className="bg-slate-900">
                    {preset.name}
                  </option>
                ))}
              </select>
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
                className="input-glow w-full px-4 py-2.5 rounded-lg"
                disabled={isCalculating}
              />
              <p className="mt-1 text-xs text-slate-500">
                设备的单点覆盖范围（最小 0.1 公里）
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
                className="input-glow w-full px-4 py-2.5 rounded-lg"
                disabled={isCalculating}
              />
              <p className="mt-1 text-xs text-slate-500">
                单个设备的成本
              </p>
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
                className="input-glow w-full px-4 py-2.5 rounded-lg mb-4"
                disabled={isCalculating}
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
                className="input-glow w-full px-4 py-2.5 rounded-lg"
                disabled={isCalculating}
              />
            </div>

            {/* 算法说明 */}
            <div className="rounded-xl p-4 bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-2 text-purple-400">
                <Info className="h-4 w-4" />
                <span className="text-sm font-medium">算法说明</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                采用六边形排列算法，这是覆盖平面区域最高效的方法之一。
                设备按交错排列，相邻行偏移半个列间距，可以最小化重叠并实现无死角覆盖。
              </p>
            </div>

            {/* 计算按钮 */}
            <button
              onClick={() => {
                setIsCalculating(true);
                calculateCoverage();
              }}
              disabled={isCalculating}
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
                  重新计算
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
            <h3 className="font-medium text-cyan-400 mb-3 flex items-center gap-2">
              <Grid3x3 className="h-4 w-4" />
              覆盖算法
            </h3>
            <ul className="text-sm text-slate-400 space-y-2">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2" />
                使用六边形排列实现最优覆盖
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2" />
                确保整个区域无死角覆盖
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2" />
                最小化设备数量和成本
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2" />
                支持自定义长方形区域大小和设备参数
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
            <h3 className="font-medium text-purple-400 mb-3 flex items-center gap-2">
              <Maximize className="h-4 w-4" />
              可视化展示
            </h3>
            <ul className="text-sm text-slate-400 space-y-2">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2" />
                实时显示设备部署位置
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2" />
                青色圆圈表示设备覆盖范围
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2" />
                网格线每公里标注一次
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2" />
                显示设备编号和统计信息
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
