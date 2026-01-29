import { useEffect, useRef, useState } from 'react';
import {
  MapPin,
  Calculator,
  Trash2,
  Download,
  Search,
  CheckCircle2,
  Info,
  History,
  Building2,
  Target
} from 'lucide-react';

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

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new window.AMap.Map(mapRef.current, {
        zoom: 12,
        center: [116.397428, 39.90923],
        viewMode: '2D',
        mapStyle: 'amap://styles/dark',
      });

      window.AMap.plugin([
        'AMap.ToolBar',
        'AMap.Scale',
        'AMap.DistrictSearch',
      ], () => {
        const toolbar = new window.AMap.ToolBar();
        mapInstanceRef.current.addControl(toolbar);

        const scale = new window.AMap.Scale();
        mapInstanceRef.current.addControl(scale);
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 初始化行政区搜索
  useEffect(() => {
    if (!window.AMap) return;

    districtSearchRef.current = new window.AMap.DistrictSearch({
      subdistrict: 0,
      extensions: 'all',
      level: searchLevel,
    });
  }, [searchLevel]);

  // 处理搜索
  const handleSearch = () => {
    if (!searchQuery.trim() || !districtSearchRef.current) return;

    setIsSearching(true);
    setDistrictData(null);
    clearPolygon();

    districtSearchRef.current.search(searchQuery, (status: string, result: any) => {
      setIsSearching(false);

      if (status === 'complete' && result && result.districtList && result.districtList.length > 0) {
        const district = result.districtList[0];
        const bounds = district.boundaries;

        if (bounds && bounds.length > 0) {
          const boundary = bounds[0];
          const vertices: [number, number][] = boundary.map((point: any) => [point.lng, point.lat]);

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
          setHistory(prev => [data, ...prev.slice(0, 9)]);

          if (mapInstanceRef.current) {
            mapInstanceRef.current.setCenter(data.center);
            mapInstanceRef.current.setFitView();

            const polygon = new window.AMap.Polygon({
              path: boundary,
              strokeColor: '#06b6d4',
              strokeOpacity: 1,
              strokeWeight: 3,
              fillColor: '#06b6d4',
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

  const clearPolygon = () => {
    if (polygonRef.current) {
      polygonRef.current.setMap(null);
      polygonRef.current = null;
    }
    setDistrictData(null);
  };

  const calculateSphericalArea = (vertices: [number, number][]): number => {
    if (vertices.length < 3) return 0;

    const closedVertices = [...vertices];
    if (closedVertices[0][0] !== closedVertices[closedVertices.length-1][0] ||
        closedVertices[0][1] !== closedVertices[closedVertices.length-1][1]) {
      closedVertices.push(closedVertices[0]);
    }

    const R = 6371000;
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

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold title-glow mb-1">行政区面积计算</h1>
        <p className="text-slate-400 text-sm">搜索行政区并计算其实际地理面积</p>
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
                <h2 className="text-lg font-semibold text-slate-100">行政区地图</h2>
                <p className="text-slate-500 text-xs">搜索并查看行政区边界</p>
              </div>
            </div>

            <div className="border border-cyan-500/20 rounded-xl overflow-hidden" style={{ height: '600px' }}>
              <div ref={mapRef} className="w-full h-full" style={{ minHeight: '500px' }} />
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
                  选择行政级别：区县级或乡镇/街道级
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2" />
                  输入行政区名称（如：海淀区、朝阳区）
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2" />
                  点击"搜索"按钮查询行政区
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2" />
                  系统会自动高亮显示并计算面积
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

            {/* 搜索框 */}
            <div className="mb-5">
              <h3 className="font-medium text-slate-300 mb-3 text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-500" />
                行政区搜索
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">行政级别</label>
                  <select
                    value={searchLevel}
                    onChange={(e) => setSearchLevel(e.target.value as 'district' | 'street')}
                    className="input-glow w-full px-4 py-2.5 rounded-lg text-slate-200"
                  >
                    <option value="district" className="bg-slate-900">区县级</option>
                    <option value="street" className="bg-slate-900">乡镇/街道级</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="输入行政区名称..."
                    className="input-glow flex-1 px-4 py-2.5 rounded-lg text-sm"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={isSearching || !searchQuery.trim()}
                    className="btn-neon px-4 py-2.5 rounded-lg text-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    <Search className="h-4 w-4" />
                    {isSearching ? '...' : '搜索'}
                  </button>
                </div>
              </div>
            </div>

            {districtData ? (
              <div className="space-y-4">
                <div className="rounded-xl p-4 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20">
                  <h3 className="font-medium text-cyan-400 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    当前行政区
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">名称</span>
                      <span className="text-slate-200 font-medium">{districtData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">行政区代码</span>
                      <span className="text-slate-200 font-mono">{districtData.adcode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">级别</span>
                      <span className="text-slate-200">{districtData.level}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-cyan-500/20">
                      <span className="text-slate-400">面积</span>
                      <span className="text-cyan-400 font-bold text-lg">
                        {(districtData.area / 1000000).toFixed(4)} km²
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 text-xs">
                        ({districtData.area.toFixed(0)} m²)
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-slate-300 mb-2 text-sm flex items-center gap-2">
                    <Target className="h-4 w-4 text-slate-500" />
                    中心坐标（经度, 纬度）
                  </h3>
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                    <pre className="text-xs text-slate-400 font-mono">
                      {districtData.center[0].toFixed(6)}, {districtData.center[1].toFixed(6)}
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
                    onClick={clearPolygon}
                    className="btn-secondary flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                    清除
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto rounded-full bg-slate-800 flex items-center justify-center mb-4">
                  <Calculator className="h-8 w-8 text-slate-600" />
                </div>
                <p className="text-slate-400">尚未搜索行政区</p>
                <p className="text-slate-500 text-sm mt-2">请输入行政区名称进行搜索</p>
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
                  onClick={() => setHistory([])}
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
                    onClick={() => {
                      setDistrictData(item);
                      if (mapInstanceRef.current) {
                        mapInstanceRef.current.setCenter(item.center);
                        mapInstanceRef.current.setFitView();
                        const polygon = new window.AMap.Polygon({
                          path: item.boundary,
                          strokeColor: '#06b6d4',
                          strokeOpacity: 1,
                          strokeWeight: 3,
                          fillColor: '#06b6d4',
                          fillOpacity: 0.2,
                        });
                        polygon.setMap(mapInstanceRef.current);
                        polygonRef.current = polygon;
                      }
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-slate-300">
                          {item.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.level}
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
              <Building2 className="h-4 w-4" />
              行政区搜索
            </h3>
            <ul className="text-sm text-slate-400 space-y-2">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2" />
                支持区县级和乡镇/街道级查询
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2" />
                支持输入行政区划名称
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2" />
                自动定位到行政区中心
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2" />
                高亮显示行政区边界
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
                使用高德地图API获取精确边界
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2" />
                采用球面几何算法计算实际地理面积
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2" />
                结果以平方米和平方公里显示
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2" />
                支持数据导出为JSON格式
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
