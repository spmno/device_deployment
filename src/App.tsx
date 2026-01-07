import { useState } from 'react';
import { DeviceProvider } from '@/context/DeviceContext';
import { DeviceManagement } from '@/pages/DeviceManagement';
import { DeviceDeployment } from '@/pages/DeviceDeployment';
import { Statistics } from '@/pages/Statistics';
import { Server, MapPin, BarChart3 } from 'lucide-react';

type Page = 'management' | 'deployment' | 'statistics';

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
      default:
        return <DeviceManagement />;
    }
  };

  return (
    <DeviceProvider>
      <div className="min-h-screen bg-gray-50">
        {/* 导航栏 */}
        <nav className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center">
                <Server className="h-8 w-8 text-blue-600 mr-2" />
                <h1 className="text-xl font-bold text-gray-900">
                  低空智联网设备部署系统
                </h1>
              </div>

              {/* 导航菜单 */}
              <div className="flex space-x-4">
                <button
                  onClick={() => setCurrentPage('management')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    currentPage === 'management'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Server className="h-5 w-5" />
                  <span>设备管理</span>
                </button>
                <button
                  onClick={() => setCurrentPage('deployment')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    currentPage === 'deployment'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <MapPin className="h-5 w-5" />
                  <span>设备部署</span>
                </button>
                <button
                  onClick={() => setCurrentPage('statistics')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    currentPage === 'statistics'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <BarChart3 className="h-5 w-5" />
                  <span>数据统计</span>
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* 主内容区域 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderPage()}
        </main>

        {/* 页脚 */}
        <footer className="bg-white border-t mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <p className="text-center text-gray-600 text-sm">
              © 2025 低空智联网设备部署系统. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </DeviceProvider>
  );
}

export default App;