import { useState } from 'react';
import { DeviceProvider } from '@/context/DeviceContext';
import { DeviceManagement } from '@/pages/DeviceManagement';
import { DeviceDeployment } from '@/pages/DeviceDeployment';
import { Statistics } from '@/pages/Statistics';
import { CoverageCalculator } from '@/pages/CoverageCalculator';
import { PolygonAreaCalculator } from '@/pages/PolygonAreaCalculator';
import { DistrictAreaCalculator } from '@/pages/DistrictAreaCalculator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Server,
  MapPin,
  BarChart3,
  Calculator,
  Hexagon,
  ChevronDown,
  Wifi,
  Cpu,
  Zap
} from 'lucide-react';

type Page = 'management' | 'deployment' | 'statistics' | 'coverage' | 'polygon' | 'district';

interface NavItem {
  id: Page;
  label: string;
  icon: React.ReactNode;
  hasDropdown?: boolean;
}

const navItems: NavItem[] = [
  { id: 'management', label: '设备管理', icon: <Server className="h-5 w-5" /> },
  { id: 'deployment', label: '设备部署', icon: <MapPin className="h-5 w-5" /> },
  { id: 'statistics', label: '数据统计', icon: <BarChart3 className="h-5 w-5" /> },
  { id: 'coverage', label: '覆盖计算', icon: <Wifi className="h-5 w-5" /> },
];

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('management');

  const renderPage = () => {
    switch (currentPage) {
      case 'management':
        return <DeviceManagement />;
      case 'deployment':
        return <DeviceDeployment />;
      case 'statistics':
        return <Statistics />;
      case 'coverage':
        return <CoverageCalculator />;
      case 'polygon':
        return <PolygonAreaCalculator />;
      case 'district':
        return <DistrictAreaCalculator />;
      default:
        return <DeviceManagement />;
    }
  };

  const isAreaCalcPage = currentPage === 'polygon' || currentPage === 'district';

  return (
    <DeviceProvider>
      <div className="min-h-screen bg-[#0a0a0f] relative">
        {/* 背景装饰 */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {/* 渐变光晕 */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-cyan-500/5 rounded-full blur-[100px]" />

          {/* 动态网格线 */}
          <div className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(6, 182, 212, 0.5) 1px, transparent 1px),
                linear-gradient(90deg, rgba(6, 182, 212, 0.5) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px'
            }}
          />
        </div>

        {/* 导航栏 */}
        <nav className="nav-glass sticky top-0 z-50 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-18 py-4">
              {/* Logo */}
              <div className="flex items-center gap-3 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-cyan-500/30 blur-xl rounded-full group-hover:bg-cyan-500/50 transition-all duration-500" />
                  <div className="relative p-2.5 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-xl border border-cyan-500/30">
                    <Hexagon className="h-7 w-7 text-cyan-400" strokeWidth={1.5} />
                    <Cpu className="h-4 w-4 text-cyan-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight">
                    <span className="title-glow">低空智联网</span>
                  </h1>
                  <p className="text-xs text-cyan-400/70 font-medium tracking-wider">设备部署系统</p>
                </div>
              </div>

              {/* 导航菜单 */}
              <div className="flex items-center gap-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentPage(item.id)}
                    className={`nav-btn flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                      currentPage === item.id
                        ? 'active'
                        : 'text-slate-400 hover:text-cyan-300'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}

                {/* 面积计算下拉菜单 */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={`nav-btn flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                        isAreaCalcPage
                          ? 'active'
                          : 'text-slate-400 hover:text-cyan-300'
                      }`}
                    >
                      <Calculator className="h-5 w-5" />
                      <span>面积计算</span>
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="glass-card border-cyan-500/30 bg-[#0f172a]/95 backdrop-blur-xl"
                    align="end"
                  >
                    <DropdownMenuItem
                      onClick={() => setCurrentPage('polygon')}
                      className={`cursor-pointer flex items-center gap-2 ${
                        currentPage === 'polygon' ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-300'
                      } focus:text-cyan-300 focus:bg-cyan-500/10`}
                    >
                      <div className="p-1.5 rounded-md bg-purple-500/20">
                        <Zap className="h-4 w-4 text-purple-400" />
                      </div>
                      <div>
                        <p className="font-medium">多边形面积</p>
                        <p className="text-xs text-slate-500">自定义区域计算</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setCurrentPage('district')}
                      className={`cursor-pointer flex items-center gap-2 mt-1 ${
                        currentPage === 'district' ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-300'
                      } focus:text-cyan-300 focus:bg-cyan-500/10`}
                    >
                      <div className="p-1.5 rounded-md bg-cyan-500/20">
                        <MapPin className="h-4 w-4 text-cyan-400" />
                      </div>
                      <div>
                        <p className="font-medium">行政区面积</p>
                        <p className="text-xs text-slate-500">按行政区统计</p>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </nav>

        {/* 主内容区域 */}
        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="fade-in">
            {renderPage()}
          </div>
        </main>

        {/* 页脚 */}
        <footer className="relative z-10 border-t border-cyan-500/10 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-slate-500 text-sm">
                © 2025 低空智联网设备部署系统. All rights reserved.
              </p>
              <div className="flex items-center gap-6 text-sm text-slate-500">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  系统运行正常
                </span>
                <span className="text-cyan-500/60">v2.0.0</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </DeviceProvider>
  );
}

export default App;
