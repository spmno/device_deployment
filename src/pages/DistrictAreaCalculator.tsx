import { useEffect, useRef, useState } from 'react';
import { MapPin, Calculator, Trash2, Download, Search } from 'lucide-react';

interface DistrictData {
  name: string;
  adcode: string;
  level: string;
  center: [number, number];
  boundary: [number, number][];
  area: number;
}

declare global {
  interface Window {
    AMap: any;
  }
}

export const DistrictAreaCalculator: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const districtSearchRef = useRef<any>(null);
  const polygonRef = useRef<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLevel, setSearchLevel] = useState<'district' | 'street'>('district');
  const [isSearching, setIsSearching] = useState(false);
  const [districtData, setDistrictData] = useState<DistrictData | null>(null);
  const [history, setHistory] = useState<DistrictData[]>([]);

  // 初始化地图
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
        'AMap.Scale',
        'AMap.DistrictSearch',
      ], () => {
        // 添加工具栏
        const toolbar = new window.AMap.ToolBar();
        mapInstanceRef.current.addControl(toolbar);

        const scale = new window.AMap.Scale();
        mapInstanceRef.current.addControl(scale);
      });
    }

    return () => {
      // 清理
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 初始化行政区搜索（根据搜索级别）
  useEffect(() => {
    if (!window.AMap) return;

    districtSearchRef.current = new window.AMap.DistrictSearch({
      subdistrict: 0, // 不返回下级行政区
      extensions: 'all', // 返回行政区边界坐标组
      level: searchLevel, // 查询行政级别：district（区县）或 street（乡镇/街道）
    });
  }, [searchLevel]);

  // 处理搜索
  const handleSearch = () => {
    if (!searchQuery.trim() || !districtSearchRef.current) return;

    setIsSearching(true);
    setDistrictData(null);

    // 清除已有的多边形
    clearPolygon();

    // 查询行政区
    districtSearchRef.current.search(searchQuery, (status: string, result: any) => {
      setIsSearching(false);

      if (status === 'complete' && result && result.districtList && result.districtList.length > 0) {
        const district = result.districtList[0];

        // 获取行政区边界
        const bounds = district.boundaries;
        if (bounds && bounds.length > 0) {
          const boundary = bounds[0];
          const vertices: [number, number][] = boundary.map((point: any) => [point.lng, point.lat]);

          // 计算面积（使用高德API）
          let area = 0;
          if (window.AMap && window.AMap.GeometryUtil && typeof window.AMap.GeometryUtil.computeArea === 'function') {
            area = window.AMap.GeometryUtil.computeArea(boundary);
          } else {
            area = calculateSphericalArea(vertices);
          }

          const data: DistrictData = {
            name: district.name,
            adcode: district.adcode,
            level: district.level,
            center: [district.center.lng, district.center.lat],
            boundary: vertices,
            area,
          };

          setDistrictData(data);
          setHistory(prev => [data, ...prev.slice(0, 9)]); // 保留最近10个

          // 将地图中心移动到行政区中心
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setCenter(data.center);
            mapInstanceRef.current.setFitView();

            // 在地图上绘制行政区边界
            const polygon = new window.AMap.Polygon({
              path: boundary,
              strokeColor: '#0066FF',
              strokeOpacity: 1,
              strokeWeight: 3,
              fillColor: '#0066FF',
              fillOpacity: 0.2,
            });
            polygon.setMap(mapInstanceRef.current);
            polygonRef.current = polygon;
          }
        }
      } else {
        alert('未找到该行政区，请检查名称是否正确');
      }
    });
  };

  // 清除多边形
  const clearPolygon = () => {
    if (polygonRef.current) {
      polygonRef.current.setMap(null);
      polygonRef.current = null;
    }
    setDistrictData(null);
  };

  // 球面多边形面积计算（平方米）
  const calculateSphericalArea = (vertices: [number, number][]): number => {
    if (vertices.length < 3) return 0;

    // 确保多边形闭合
    const closedVertices = [...vertices];
    if (closedVertices[0][0] !== closedVertices[closedVertices.length-1][0] ||
        closedVertices[0][1] !== closedVertices[closedVertices.length-1][1]) {
      closedVertices.push(closedVertices[0]);
    }

    const R = 6371000; // 地球半径（米）
    let area = 0;

    for (let i = 0; i < closedVertices.length - 1; i++) {
      const λ1 = closedVertices[i][0] * Math.PI / 180;
      const φ1 = closedVertices[i][1] * Math.PI / 180;
      const λ2 = closedVertices[i+1][0] * Math.PI / 180;
      const φ2 = closedVertices[i+1][1] * Math.PI / 180;

      area += (λ2 - λ1) * (2 + Math.sin(φ1) + Math.sin(φ2));
    }

    area = Math.abs(area * R * R / 2);
    return area;
  };

  // 导出数据
  const exportData = () => {
    if (!districtData) return;

    const dataStr = JSON.stringify({
      name: districtData.name,
      adcode: districtData.adcode,
      level: districtData.level,
      center: districtData.center,
      boundary: districtData.boundary,
      area: districtData.area,
      areaKm2: districtData.area / 1000000,
      timestamp: new Date().toISOString(),
    }, null, 2);

    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `district-area-${districtData.name}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatBoundary = (boundary: [number, number][]): string => {
    return boundary.map(v => `${v[1].toFixed(6)}, ${v[0].toFixed(6)}`).join('\n');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">行政区面积计算</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：地图区域 */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-6 w-6" />
              行政区地图
            </h2>

            <div className="border rounded-lg overflow-hidden" style={{ height: '600px' }}>
              <div ref={mapRef} className="w-full h-full" style={{ minHeight: '500px' }} />
            </div>

            <div className="mt-4 text-sm text-gray-600">
              <p>💡 使用说明：</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>选择行政级别：区县级或乡镇/街道级</li>
                <li>输入行政区名称（如：海淀区、朝阳区、万寿路街道、十八里店乡等）</li>
                <li>点击"搜索"按钮查询行政区</li>
                <li>系统会自动将地图中心移动到该行政区并高亮显示</li>
                <li>自动计算行政区面积</li>
                <li>支持导出计算结果</li>
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

            {/* 搜索框 */}
            <div>
              <h3 className="font-medium text-gray-900 mb-2">行政区搜索</h3>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">行政级别</label>
                  <select
                    value={searchLevel}
                    onChange={(e) => setSearchLevel(e.target.value as 'district' | 'street')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="district">区县级</option>
                    <option value="street">乡镇/街道级</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="输入行政区名称..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={isSearching || !searchQuery.trim()}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Search className="h-4 w-4" />
                    {isSearching ? '搜索中...' : '搜索'}
                  </button>
                </div>
              </div>
            </div>

            {districtData ? (
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">当前行政区</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-blue-700">
                      名称: <span className="font-bold">{districtData.name}</span>
                    </p>
                    <p className="text-sm text-blue-700">
                      行政区代码: <span className="font-bold">{districtData.adcode}</span>
                    </p>
                    <p className="text-sm text-blue-700">
                      级别: <span className="font-bold">{districtData.level}</span>
                    </p>
                    <p className="text-sm text-blue-700">
                      面积: <span className="font-bold">
                        {(districtData.area / 1000000).toFixed(4)} 平方公里
                      </span>
                    </p>
                    <p className="text-sm text-blue-600">
                      ({districtData.area.toFixed(0)} 平方米)
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">中心坐标（经度, 纬度）</h3>
                  <div className="bg-gray-50 rounded p-3">
                    <pre className="text-xs text-gray-600">
                      {districtData.center[0].toFixed(6)}, {districtData.center[1].toFixed(6)}
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
                    onClick={clearPolygon}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    清除
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">尚未搜索行政区</p>
                <p className="text-sm text-gray-500 mt-2">请输入行政区名称进行搜索</p>
              </div>
            )}

            {/* 历史记录 */}
            {history.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-gray-900">历史记录</h3>
                  <button
                    onClick={() => setHistory([])}
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
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {item.level}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-blue-700">
                          {(item.area / 1000000).toFixed(2)} km²
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setDistrictData(item);
                          if (mapInstanceRef.current) {
                            mapInstanceRef.current.setCenter(item.center);
                            mapInstanceRef.current.setFitView();
                            const polygon = new window.AMap.Polygon({
                              path: item.boundary,
                              strokeColor: '#0066FF',
                              strokeOpacity: 1,
                              strokeWeight: 3,
                              fillColor: '#0066FF',
                              fillOpacity: 0.2,
                            });
                            polygon.setMap(mapInstanceRef.current);
                            polygonRef.current = polygon;
                          }
                        }}
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
            <h3 className="font-medium text-gray-900 mb-2">行政区搜索</h3>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>支持区县级和乡镇/街道级查询</li>
              <li>支持输入行政区划名称（如：海淀区、朝阳区、万寿路街道）</li>
              <li>支持不同级别行政区划查询</li>
              <li>自动定位到行政区中心</li>
              <li>高亮显示行政区边界</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">面积计算</h3>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>使用高德地图API获取精确边界</li>
              <li>采用球面几何算法计算实际地理面积</li>
              <li>结果以平方米和平方公里显示</li>
              <li>支持数据导出为JSON格式</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
