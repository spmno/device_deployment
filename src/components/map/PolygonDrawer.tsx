import { useEffect, useRef, useState } from 'react';

interface PolygonDrawerProps {
  onPolygonComplete?: (vertices: [number, number][], area: number) => void;
}

declare global {
  interface Window {
    AMap: any;
  }
}

export const PolygonDrawer: React.FC<PolygonDrawerProps> = ({
  onPolygonComplete,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const mouseToolRef = useRef<any>(null);
  const placeSearchRef = useRef<any>(null);
  const polygonRef = useRef<any>(null);
  const [drawing, setDrawing] = useState(false);
  const [vertices, setVertices] = useState<[number, number][]>([]);
  const [area, setArea] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 初始化地图和插件
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
        'AMap.MouseTool',
        'AMap.PlaceSearch',
        'AMap.AutoComplete',
      ], () => {
        // 添加工具栏
        const toolbar = new window.AMap.ToolBar();
        mapInstanceRef.current.addControl(toolbar);

        const scale = new window.AMap.Scale();
        mapInstanceRef.current.addControl(scale);

        // 初始化鼠标工具
        mouseToolRef.current = new window.AMap.MouseTool(mapInstanceRef.current);

        // 初始化地点搜索
        placeSearchRef.current = new window.AMap.PlaceSearch({
          pageSize: 10,
          pageIndex: 1,
          map: mapInstanceRef.current,
        });

        // 监听搜索完成事件
        placeSearchRef.current.on('complete', (result: any) => {
          setIsSearching(false);
          if (result.info === 'OK') {
            setSearchResults(result.poiList.pois);
          } else {
            setSearchResults([]);
          }
        });

        placeSearchRef.current.on('error', (result: any) => {
          setIsSearching(false);
          console.error('搜索出错:', result);
          setSearchResults([]);
        });
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

  // 处理搜索
  const handleSearch = () => {
    if (!searchQuery.trim() || !placeSearchRef.current) return;
    
    setIsSearching(true);
    setSearchResults([]);
    
    // 执行地点搜索
    placeSearchRef.current.search(searchQuery);
  };

  // 处理搜索结果点击
  const handleResultClick = (result: any) => {
    if (!mapInstanceRef.current) return;
    
    const location = result.location;
    if (location) {
      // 将地图中心移动到搜索结果位置
      mapInstanceRef.current.setCenter([location.lng, location.lat]);
      mapInstanceRef.current.setZoom(15);
      
      // 添加标记
      const marker = new window.AMap.Marker({
        position: [location.lng, location.lat],
        title: result.name,
      });
      marker.setMap(mapInstanceRef.current);
      
      // 清除之前的搜索结果
      setSearchResults([]);
      setSearchQuery(result.name);
    }
  };

  // 开始绘制多边形
  const startDrawing = () => {
    if (!mouseToolRef.current || !mapInstanceRef.current) return;
    
    // 清除已有的多边形
    clearPolygon();
    setDrawing(true);

    // 使用鼠标工具绘制多边形（双击结束绘制）
    mouseToolRef.current.polygon({
      strokeColor: '#0066FF',
      strokeOpacity: 1,
      strokeWeight: 3,
      fillColor: '#0066FF',
      fillOpacity: 0.2,
    });

    // 监听绘制完成事件（双击结束）
    mouseToolRef.current.on('draw', (event: any) => {
      if (event.obj && event.obj.getPath) {
        const path = event.obj.getPath();
        const vertices: [number, number][] = path.map((point: any) => [point.lng, point.lat]);
        setVertices(vertices);
        
        // 计算面积
        const calculatedArea = computeArea(path);
        setArea(calculatedArea);
        
        // 保存多边形引用
        polygonRef.current = event.obj;
        
        // 停止绘制模式
        mouseToolRef.current.close(false);
        setDrawing(false);
        
        // 回调
        if (onPolygonComplete) {
          onPolygonComplete(vertices, calculatedArea);
        }
      }
    });
  };

  // 清除多边形
  const clearPolygon = () => {
    if (polygonRef.current) {
      polygonRef.current.setMap(null);
      polygonRef.current = null;
    }
    if (mouseToolRef.current) {
      mouseToolRef.current.close(false);
    }
    setVertices([]);
    setArea(null);
    setDrawing(false);
  };

  // 计算面积（优先使用高德地图API，备用球面算法）
  const computeArea = (path: any[]): number => {
    if (window.AMap && window.AMap.GeometryUtil && typeof window.AMap.GeometryUtil.computeArea === 'function') {
      return window.AMap.GeometryUtil.computeArea(path);
    }
    
    // 备用：球面多边形面积（平方米）
    return calculateSphericalArea(path.map((point: any) => [point.lng, point.lat] as [number, number]));
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

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" style={{ minHeight: '500px' }} />
      
      {/* 左上角：搜索功能区 */}
      <div className="absolute top-4 left-4 bg-white bg-opacity-90 px-4 py-3 rounded-lg shadow-md z-10 space-y-2 min-w-64">
        <h3 className="text-sm font-medium text-gray-700 mb-2">地点搜索</h3>
        
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="输入地点名称..."
              className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isSearching ? '搜索中...' : '搜索'}
            </button>
          </div>
          
          {searchResults.length > 0 && (
            <div className="border border-gray-200 rounded max-h-48 overflow-y-auto">
              <div className="p-2 bg-gray-50 border-b border-gray-200">
                <p className="text-xs text-gray-600">搜索结果：</p>
              </div>
              <div className="space-y-1 p-1">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleResultClick(result)}
                    className="w-full text-left px-2 py-1.5 text-xs hover:bg-gray-100 rounded truncate"
                    title={`${result.name} - ${result.address || '无地址信息'}`}
                  >
                    <div className="font-medium text-gray-800">{result.name}</div>
                    <div className="text-gray-600 truncate">{result.address || '无地址信息'}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* 右上角：多边形绘制功能区 */}
      <div className="absolute top-4 right-4 bg-white bg-opacity-90 px-4 py-3 rounded-lg shadow-md z-10 space-y-2 min-w-64">
        <h3 className="text-sm font-medium text-gray-700">多边形面积计算</h3>
        
        <div className="flex flex-col gap-2">
          <button
            onClick={startDrawing}
            disabled={drawing}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {drawing ? '绘制中（双击结束）' : '开始绘制'}
          </button>
          
          <button
            onClick={clearPolygon}
            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            清除多边形
          </button>
        </div>
        
        {(vertices.length > 0 || area !== null) && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              顶点数: <span className="font-medium">{vertices.length}</span>
            </p>
            {area !== null && (
              <p className="text-xs text-gray-600">
                面积: <span className="font-medium">
                  {(area / 1000000).toFixed(4)} 平方公里
                </span>
                <br />
                <span className="text-gray-500">
                  ({area.toFixed(0)} 平方米)
                </span>
              </p>
            )}
          </div>
        )}
        
        <div className="text-xs text-gray-500 mt-2">
          <p>💡 双击结束绘制</p>
        </div>
      </div>
    </div>
  );
};