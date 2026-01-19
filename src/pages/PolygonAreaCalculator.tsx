import { useState } from 'react';
import { PolygonDrawer } from '@/components/map/PolygonDrawer';
import { MapPin, Calculator, Trash2, Download } from 'lucide-react';

interface PolygonData {
  vertices: [number, number][];
  area: number; // 平方米
}

export const PolygonAreaCalculator: React.FC = () => {
  const [polygonData, setPolygonData] = useState<PolygonData | null>(null);
  const [history, setHistory] = useState<PolygonData[]>([]);

  const handlePolygonComplete = (vertices: [number, number][], area: number) => {
    const data: PolygonData = { vertices, area };
    setPolygonData(data);
    setHistory(prev => [data, ...prev.slice(0, 9)]); // 保留最近10个
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
      <h1 className="text-3xl font-bold">多边形面积计算</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：地图区域 */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-6 w-6" />
              地图绘制区域
            </h2>
            
            <div className="border rounded-lg overflow-hidden" style={{ height: '600px' }}>
              <PolygonDrawer onPolygonComplete={handlePolygonComplete} />
            </div>
            
            <div className="mt-4 text-sm text-gray-600">
              <p>💡 使用说明：</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>点击"开始绘制"按钮进入绘制模式</li>
                <li>在地图上点击添加多边形顶点</li>
                <li>点击"完成绘制"闭合多边形并计算面积</li>
                <li>点击"清除"按钮清除当前多边形</li>
                <li>多边形至少需要3个顶点</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* 右侧：控制面板和结果 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Calculator className="h-6 w-6" />
              计算结果
            </h2>
            
            {polygonData ? (
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">当前多边形</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-blue-700">
                      顶点数量: <span className="font-bold">{polygonData.vertices.length}</span>
                    </p>
                    <p className="text-sm text-blue-700">
                      面积: <span className="font-bold">
                        {(polygonData.area / 1000000).toFixed(4)} 平方公里
                      </span>
                    </p>
                    <p className="text-sm text-blue-600">
                      ({polygonData.area.toFixed(0)} 平方米)
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">顶点坐标（纬度, 经度）</h3>
                  <div className="bg-gray-50 rounded p-3 max-h-40 overflow-y-auto">
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                      {formatVertices(polygonData.vertices)}
                    </pre>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <button
                    onClick={exportData}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    导出数据
                  </button>
                  
                  <button
                    onClick={clearCurrent}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    清除当前
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">尚未绘制多边形</p>
                <p className="text-sm text-gray-500 mt-2">请在地图上绘制多边形以计算面积</p>
              </div>
            )}
            
            {/* 历史记录 */}
            {history.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-gray-900">历史记录</h3>
                  <button
                    onClick={clearHistory}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    清除历史
                  </button>
                </div>
                
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {history.map((item, index) => (
                    <div key={index} className="bg-gray-50 rounded p-3 border border-gray-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            记录 {index + 1}
                          </p>
                          <p className="text-xs text-gray-600">
                            {item.vertices.length} 顶点
                          </p>
                        </div>
                        <p className="text-sm font-bold text-blue-700">
                          {(item.area / 1000000).toFixed(2)} km²
                        </p>
                      </div>
                      <button
                        onClick={() => setPolygonData(item)}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                      >
                        加载
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 面积单位换算参考 */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">面积单位换算</h3>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>1 平方公里 = 1,000,000 平方米</li>
                <li>1 公顷 = 10,000 平方米</li>
                <li>1 亩 ≈ 666.67 平方米</li>
                <li>1 英亩 ≈ 4046.86 平方米</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* 算法说明 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">功能说明</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">多边形绘制</h3>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>支持手动点击地图添加顶点</li>
              <li>实时显示多边形轮廓</li>
              <li>自动闭合多边形并计算面积</li>
              <li>支持编辑和重新绘制</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">面积计算</h3>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>使用球面几何算法计算实际地理面积</li>
              <li>结果以平方米和平方公里显示</li>
              <li>支持数据导出为JSON格式</li>
              <li>保留历史记录便于对比</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};