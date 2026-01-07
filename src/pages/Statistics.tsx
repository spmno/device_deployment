import { useMemo } from 'react';
import { useDevices } from '@/context/DeviceContext';
import { BarChart3, DollarSign, MapPin, Server, Activity } from 'lucide-react';

export const Statistics: React.FC = () => {
  const { devices } = useDevices();

  const stats = useMemo(() => {
    const totalDevices = devices.length;
    const deployedDevices = devices.filter((device) => device.deployed).length;
    const undeployedDevices = totalDevices - deployedDevices;

    // 计算总覆盖范围（简化计算：将所有已部署设备的覆盖范围相加）
    const totalCoverage = devices
      .filter((device) => device.deployed)
      .reduce((sum, device) => sum + device.coverageRange, 0);

    // 计算总成本
    const totalCost = devices.reduce((sum, device) => sum + device.price, 0);

    // 计算平均价格
    const averagePrice = totalDevices > 0 ? totalCost / totalDevices : 0;

    // 计算平均覆盖范围
    const averageCoverage = deployedDevices > 0 ? totalCoverage / deployedDevices : 0;

    // 按类型统计
    const devicesByType = devices.reduce((acc, device) => {
      acc[device.type] = (acc[device.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalDevices,
      deployedDevices,
      undeployedDevices,
      totalCoverage,
      totalCost,
      averagePrice,
      averageCoverage,
      devicesByType,
    };
  }, [devices]);

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, icon, color }) => (
    <div className={`${color} rounded-lg p-6 text-white`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium">{title}</h3>
        <div className="p-2 bg-white bg-opacity-20 rounded-lg">{icon}</div>
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">数据统计分析</h1>

      {/* 核心统计数据卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="设备总数"
          value={stats.totalDevices}
          icon={<Server className="h-6 w-6" />}
          color="bg-blue-600"
        />
        <StatCard
          title="已部署设备"
          value={stats.deployedDevices}
          icon={<MapPin className="h-6 w-6" />}
          color="bg-green-600"
        />
        <StatCard
          title="未部署设备"
          value={stats.undeployedDevices}
          icon={<Activity className="h-6 w-6" />}
          color="bg-orange-600"
        />
        <StatCard
          title="总覆盖范围"
          value={`${stats.totalCoverage.toFixed(1)} 公里`}
          icon={<BarChart3 className="h-6 w-6" />}
          color="bg-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 成本统计 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            成本统计
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b">
              <span className="text-gray-600">总成本</span>
              <span className="text-2xl font-bold text-green-600">
                ¥{stats.totalCost.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b">
              <span className="text-gray-600">平均价格</span>
              <span className="text-lg font-medium">
                ¥{stats.averagePrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-600">部署率</span>
              <span className="text-lg font-medium text-blue-600">
                {stats.totalDevices > 0
                  ? ((stats.deployedDevices / stats.totalDevices) * 100).toFixed(1)
                  : 0}
                %
              </span>
            </div>
          </div>
        </div>

        {/* 覆盖范围统计 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            覆盖范围统计
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b">
              <span className="text-gray-600">总覆盖范围</span>
              <span className="text-2xl font-bold text-purple-600">
                {stats.totalCoverage.toFixed(1)} 公里
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b">
              <span className="text-gray-600">平均覆盖范围</span>
              <span className="text-lg font-medium">
                {stats.averageCoverage.toFixed(1)} 公里
              </span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-600">已部署设备数</span>
              <span className="text-lg font-medium text-green-600">
                {stats.deployedDevices} 台
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 设备类型分布 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-orange-600" />
          设备类型分布
        </h2>
        {Object.keys(stats.devicesByType).length === 0 ? (
          <p className="text-gray-500 text-center py-4">暂无设备数据</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(stats.devicesByType).map(([type, count]) => (
              <div
                key={type}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <h3 className="font-medium mb-2">{type}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">数量</span>
                  <span className="text-2xl font-bold text-blue-600">{count}</span>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>占比</span>
                    <span>{((count / stats.totalDevices) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(count / stats.totalDevices) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 部署状态概览 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">部署状态概览</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="inline-block p-4 rounded-full bg-green-100 mb-2">
              <Server className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-green-600">{stats.deployedDevices}</h3>
            <p className="text-gray-600">已部署</p>
          </div>
          <div className="text-center">
            <div className="inline-block p-4 rounded-full bg-orange-100 mb-2">
              <Activity className="h-8 w-8 text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold text-orange-600">{stats.undeployedDevices}</h3>
            <p className="text-gray-600">未部署</p>
          </div>
          <div className="text-center">
            <div className="inline-block p-4 rounded-full bg-blue-100 mb-2">
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-blue-600">
              {stats.totalDevices > 0
                ? ((stats.deployedDevices / stats.totalDevices) * 100).toFixed(1)
                : 0}%
            </h3>
            <p className="text-gray-600">部署率</p>
          </div>
        </div>
      </div>
    </div>
  );
};
