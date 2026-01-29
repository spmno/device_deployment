import { useState } from 'react';
import { PolygonDrawer } from '@/components/map/PolygonDrawer';
import {
  MapPin,
  Calculator,
  Trash2,
  Download,
  Layers,
  CheckCircle2,
  Info,
  History,
  Ruler
} from 'lucide-react';

interface PolygonData {
  vertices: [number, number][];
  area: number;
}

export const PolygonAreaCalculator: React.FC = () => {
  const [polygonData, setPolygonData] = useState<PolygonData | null>(null);
  const [history, setHistory] = useState<PolygonData[]>([]);

  const handlePolygonComplete = (vertices: [number, number][], area: number) => {
    const data: PolygonData = { vertices, area };
    setPolygonData(data);
    setHistory(prev => [data, ...prev.slice(0, 9)]);
  };

  const clearCurrent = () => {
    setPolygonData(null);
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const exportData = () => {
    if (!polygonData) return;

    const dataStr = JSON.stringify({
      vertices: polygonData.vertices,
      area: polygonData.area,
      areaKm2: polygonData.area / 1000000,
      timestamp: new Date().toISOString(),
    }, null, 2);

    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `polygon-area-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatVertices = (vertices: [number, number][]): string => {
    return vertices.map(v => `${v[1].toFixed(6)}, ${v[0].toFixed(6)}`).join('\n');
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold title-glow mb-1">多边形面积计算</h1>
        <p className="text-slate-400 text-sm">在地图上绘制多边形并计算实际地理面积</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：地图区域 */}
        <div className="lg:col-span-2">
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                <MapPin className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-100">地图绘制区域</h2>
                <p className="text-slate-500 text-xs">点击地图添加多边形顶点</p>
              </div>
            </div>

            <div className="border border-cyan-500/20 rounded-xl overflow-hidden" style={{ height: '600px' }}>
              <PolygonDrawer onPolygonComplete={handlePolygonComplete} />
            </div>

            {/* 使用说明 */}
            <div className="mt-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-3 text-cyan-400">
                <Info className="h-4 w-4" />
                <span className="text-sm font-medium">使用说明</span>
              </div>
              <ul className="text-sm text-slate-400 space-y-1.5 ml-6">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2" />
                  点击"开始绘制"按钮进入绘制模式
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2" />
                  在地图上点击添加多边形顶点
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2" />
                  点击"完成绘制"闭合多边形并计算面积
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2" />
                  多边形至少需要3个顶点
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* 右侧：控制面板和结果 */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                <Calculator className="h-5 w-5 text-purple-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-100">计算结果</h2>
            </div>

            {polygonData ? (
              <div className="space-y-4">
                <div className="rounded-xl p-4 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20">
                  <h3 className="font-medium text-cyan-400 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    当前多边形
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">顶点数量</span>
                      <span className="text-slate-200 font-bold">{polygonData.vertices.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">面积</span>
                      <span className="text-cyan-400 font-bold text-lg">
                        {(polygonData.area / 1000000).toFixed(4)} km²
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 text-sm">
                        ({polygonData.area.toFixed(0)} m²)
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-slate-300 mb-2 text-sm flex items-center gap-2">
                    <Layers className="h-4 w-4 text-slate-500" />
                    顶点坐标（纬度, 经度）
                  </h3>
                  <div className="bg-slate-800/50 rounded-lg p-3 max-h-40 overflow-y-auto border border-slate-700/50">
                    <pre className="text-xs text-slate-400 whitespace-pre-wrap font-mono">
                      {formatVertices(polygonData.vertices)}
                    </pre>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={exportData}
                    className="btn-neon flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium"
                  >
                    <Download className="h-4 w-4" />
                    导出数据
                  </button>

                  <button
                    onClick={clearCurrent}
                    className="btn-secondary flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                    清除当前
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto rounded-full bg-slate-800 flex items-center justify-center mb-4">
                  <Calculator className="h-8 w-8 text-slate-600" />
                </div>
                <p className="text-slate-400">尚未绘制多边形</p>
                <p className="text-slate-500 text-sm mt-2">请在地图上绘制多边形以计算面积</p>
              </div>
            )}
          </div>

          {/* 历史记录 */}
          {history.length > 0 && (
            <div className="glass-card rounded-xl p-5">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-slate-500" />
                  <h3 className="font-medium text-slate-300">历史记录</h3>
                </div>
                <button
                  onClick={clearHistory}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  清除历史
                </button>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {history.map((item, index) => (
                  <div
                    key={index}
                    className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 hover:border-cyan-500/30 transition-colors cursor-pointer"
                    onClick={() => setPolygonData(item)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-slate-300">
                          记录 {index + 1}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.vertices.length} 顶点
                        </p>
                      </div>
                      <p className="text-sm font-bold text-cyan-400">
                        {(item.area / 1000000).toFixed(2)} km²
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 面积单位换算参考 */}
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Ruler className="h-4 w-4 text-slate-500" />
              <h3 className="font-medium text-slate-300 text-sm">面积单位换算</h3>
            </div>
            <ul className="text-xs text-slate-400 space-y-2">
              <li className="flex justify-between">
                <span>1 平方公里</span>
                <span className="text-slate-500">= 1,000,000 m²</span>
              </li>
              <li className="flex justify-between">
                <span>1 公顷</span>
                <span className="text-slate-500">= 10,000 m²</span>
              </li>
              <li className="flex justify-between">
                <span>1 亩</span>
                <span className="text-slate-500">≈ 666.67 m²</span>
              </li>
              <li className="flex justify-between">
                <span>1 英亩</span>
                <span className="text-slate-500">≈ 4046.86 m²</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 功能说明 */}
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
              <Layers className="h-4 w-4" />
              多边形绘制
            </h3>
            <ul className="text-sm text-slate-400 space-y-2">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2" />
                支持手动点击地图添加顶点
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2" />
                实时显示多边形轮廓
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2" />
                自动闭合多边形并计算面积
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2" />
                支持编辑和重新绘制
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
            <h3 className="font-medium text-purple-400 mb-3 flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              面积计算
            </h3>
            <ul className="text-sm text-slate-400 space-y-2">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2" />
                使用球面几何算法计算实际地理面积
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2" />
                结果以平方米和平方公里显示
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2" />
                支持数据导出为JSON格式
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2" />
                保留历史记录便于对比
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
