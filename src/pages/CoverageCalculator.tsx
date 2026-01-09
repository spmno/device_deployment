import { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, Calculator, Maximize, DollarSign, Loader2 } from 'lucide-react';

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
  { name: '通信基站', coverageRadius: 3, price: 100000 },
  { name: '环境监测', coverageRadius: 2, price: 50000 },
  { name: '充电设施', coverageRadius: 1.5, price: 30000 },
  { name: '导航设备', coverageRadius: 2.5, price: 80000 },
];

export const CoverageCalculator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 配置参数
  const [areaLength, setAreaLength] = useState<number>(10); // 区域长度（公里）
  const [areaWidth, setAreaWidth] = useState<number>(10); // 区域宽度（公里）
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

  // 处理数值输入变化（只更新字符串，不立即转换数字）
  const handleNumberInputChange = (
    value: string,
    inputSetter: (val: string) => void
  ) => {
    // 始终更新输入字符串，允许用户自由输入
    inputSetter(value);
  };

  // 处理输入框失去焦点（此时才转换数字）
  const handleNumberBlur = (
    value: string,
    setter: (val: number) => void,
    inputSetter: (val: string) => void,
    min: number = 0,
    defaultValue: number
  ) => {
    // 如果为空，使用默认值
    if (value.trim() === '') {
      inputSetter(defaultValue.toString());
      setter(defaultValue);
      return;
    }

    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= min) {
      setter(numValue);
      inputSetter(numValue.toString()); // 格式化显示
    } else {
      // 无效值，恢复为默认值或之前的有效值
      inputSetter(defaultValue.toString());
      setter(defaultValue);
    }
    // 注意：这里不触发计算，用户需要点击"重新计算"按钮
  };

  // 计算最优覆盖方案
  const calculateCoverage = useCallback(() => {
    setIsCalculating(true);

    const radius = coverageRadius;
    const length = areaLength;
    const width = areaWidth;

    // 验证输入值
    if (isNaN(radius) || radius <= 0 || isNaN(length) || length < 1 || isNaN(width) || width < 1) {
      setIsCalculating(false);
      return;
    }

    // 使用六边形排列算法（比正方形排列更高效）
    // 在六边形排列中，行间距 = radius * sqrt(3)
    // 列间距 = radius * 1.5
    const rowSpacing = radius * Math.sqrt(3);
    const colSpacing = radius * 1.5;

    // 计算需要的行数和列数
    // 为了确保完全覆盖，需要加1来处理边界
    const rowCount = Math.ceil(length / rowSpacing) + 1;
    const colCount = Math.ceil(width / colSpacing) + 1;

    // 限制最大设备数量，防止性能问题
    const maxDevices = 5000;
    if (rowCount * colCount > maxDevices) {
      console.warn(`设备数量过多 (${rowCount * colCount})，已限制为 ${maxDevices}`);
    }

    // 生成设备位置
    const devicePositions: DevicePosition[] = [];
    let deviceCount = 0;
    for (let row = 0; row < rowCount; row++) {
      for (let col = 0; col < colCount; col++) {
        if (deviceCount >= maxDevices) break;

        // 奇数行偏移半个列间距（实现六边形排列）
        const xOffset = row % 2 === 0 ? 0 : colSpacing / 2;

        const x = col * colSpacing + xOffset;
        const y = row * rowSpacing;

        // 检查是否在区域内（包含半径边界）
        if (x - radius <= width && y - radius <= length) {
          devicePositions.push({ x, y, row, col });
          deviceCount++;
        }
      }
      if (deviceCount >= maxDevices) break;
    }

    // 计算统计信息
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

    // 设置画布尺寸
    const canvasSize = 600;
    const padding = 40;
    const drawArea = canvasSize - padding * 2;

    canvas.width = canvasSize;
    canvas.height = canvasSize;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制背景
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 计算缩放比例（基于较长的一边）
    const maxLength = Math.max(areaLength, areaWidth);
    const scale = drawArea / maxLength;

    // 计算绘制区域的实际尺寸
    const drawWidth = areaWidth * scale;
    const drawLength = areaLength * scale;

    // 绘制区域边框（长方形）
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.strokeRect(padding, padding, drawWidth, drawLength);

    // 绘制网格线（每公里）
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;

    // 垂直网格线（基于宽度）
    for (let i = 0; i <= areaWidth; i++) {
      ctx.beginPath();
      ctx.moveTo(padding + i * scale, padding);
      ctx.lineTo(padding + i * scale, padding + drawLength);
      ctx.stroke();

      // 标注宽度刻度
      if (i % Math.ceil(areaWidth / 10) === 0 || i === areaWidth) {
        ctx.fillStyle = '#64748b';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${i}km`, padding + i * scale, padding - 10);
      }
    }

    // 水平网格线（基于长度）
    for (let i = 0; i <= areaLength; i++) {
      ctx.beginPath();
      ctx.moveTo(padding, padding + i * scale);
      ctx.lineTo(padding + drawWidth, padding + i * scale);
      ctx.stroke();

      // 标注长度刻度
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

      // 绘制覆盖圆
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 绘制设备点
      ctx.beginPath();
      ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#3b82f6';
      ctx.fill();

      // 绘制设备编号
      ctx.fillStyle = '#1e40af';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`#${index + 1}`, centerX, centerY - 12);
    });

    // 绘制图例
    const legendX = padding;
    const legendY = canvasSize - padding;
    ctx.fillStyle = '#64748b';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('图例: ', legendX, legendY - 25);

    // 覆盖区域
    ctx.beginPath();
    ctx.arc(legendX + 60, legendY - 18, 8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '12px sans-serif';
    ctx.fillText('设备覆盖区域', legendX + 75, legendY - 25);

    // 设备点
    ctx.beginPath();
    ctx.arc(legendX + 60, legendY, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#3b82f6';
    ctx.fill();

    ctx.fillStyle = '#64748b';
    ctx.fillText('设备位置', legendX + 75, legendY - 7);
  };

  useEffect(() => {
    drawCoverageMap();
  }, [result, coverageRadius]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">设备覆盖计算</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 左侧：显示区域 */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Maximize className="h-6 w-6" />
              覆盖区域可视化
              {isCalculating && (
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
              )}
            </h2>

            <div className="flex justify-center relative">
              {isCalculating && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                    <span className="text-sm text-gray-600">计算中...</span>
                  </div>
                </div>
              )}
              <canvas
                ref={canvasRef}
                className="border border-gray-200 rounded-lg"
              />
            </div>

            {result && (
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="h-5 w-5 text-blue-600" />
                    <span className="text-sm text-blue-600">设备数量</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">{result.deviceCount}</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-green-600">总成本</span>
                  </div>
                  <p className="text-2xl font-bold text-green-700">
                    ¥{result.totalCost.toLocaleString()}
                  </p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Maximize className="h-5 w-5 text-purple-600" />
                    <span className="text-sm text-purple-600">覆盖效率</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-700">
                    {result.coverageRate.toFixed(1)}%
                  </p>
                </div>

                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="h-5 w-5 text-orange-600" />
                    <span className="text-sm text-orange-600">设备间距</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-700">
                    {result.spacing.toFixed(2)} km
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 右侧：配置区域 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Settings className="h-6 w-6" />
              配置参数
            </h2>

            {/* 设备类型选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                设备类型
              </label>
              <select
                value={deviceType}
                onChange={(e) => handleDeviceTypeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {DEVICE_PRESETS.map((preset) => (
                  <option key={preset.name} value={preset.name}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 覆盖半径 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                覆盖半径（公里）
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={coverageRadiusInput}
                onChange={(e) => handleNumberInputChange(e.target.value, setCoverageRadiusInput)}
                onBlur={(e) => handleNumberBlur(e.target.value, setCoverageRadius, setCoverageRadiusInput, 0.1, DEVICE_PRESETS[0].coverageRadius)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isCalculating}
              />
              <p className="mt-1 text-xs text-gray-500">
                设备的单点覆盖范围（最小 0.1 公里）
              </p>
            </div>

            {/* 设备价格 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                设备价格（元）
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={devicePriceInput}
                onChange={(e) => handleNumberInputChange(e.target.value, setDevicePriceInput)}
                onBlur={(e) => handleNumberBlur(e.target.value, setDevicePrice, setDevicePriceInput, 0, DEVICE_PRESETS[0].price)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isCalculating}
              />
              <p className="mt-1 text-xs text-gray-500">
                单个设备的成本
              </p>
            </div>

            {/* 覆盖区域 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                区域长度（公里）
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={areaLengthInput}
                onChange={(e) => handleNumberInputChange(e.target.value, setAreaLengthInput)}
                onBlur={(e) => handleNumberBlur(e.target.value, setAreaLength, setAreaLengthInput, 1, 10)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2"
                disabled={isCalculating}
              />
              <p className="mt-1 text-xs text-gray-500 mb-4">
                区域的长度（例如：10 表示 10 公里）
              </p>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                区域宽度（公里）
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={areaWidthInput}
                onChange={(e) => handleNumberInputChange(e.target.value, setAreaWidthInput)}
                onBlur={(e) => handleNumberBlur(e.target.value, setAreaWidth, setAreaWidthInput, 1, 10)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isCalculating}
              />
              <p className="mt-1 text-xs text-gray-500">
                区域的宽度（例如：10 表示 10 公里）
              </p>
            </div>

            {/* 算法说明 */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">算法说明</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
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
              className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isCalculating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  计算中...
                </>
              ) : (
                '重新计算'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 详细说明 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">功能说明</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">覆盖算法</h3>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>使用六边形排列实现最优覆盖</li>
              <li>确保整个区域无死角覆盖</li>
              <li>最小化设备数量和成本</li>
              <li>支持自定义长方形区域大小和设备参数</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">可视化展示</h3>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>实时显示设备部署位置</li>
              <li>蓝色圆圈表示设备覆盖范围</li>
              <li>网格线每公里标注一次</li>
              <li>显示设备编号和统计信息</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
