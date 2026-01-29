import { useMemo } from 'react';
import { useDevices } from '@/context/DeviceContext';
import {
  BarChart3,
  DollarSign,
  MapPin,
  Server,
  Activity,
  TrendingUp,
  Target,
  Wifi,
  Zap
} from 'lucide-react';

export const Statistics: React.FC = () => {
  const { devices } = useDevices();

  const stats = useMemo(() => {
    const totalDevices = devices.length;
    const deployedDevices = devices.filter((device) => device.deployed).length;
    const undeployedDevices = totalDevices - deployedDevices;

    const totalCoverage = devices
      .filter((device) => device.deployed)
      .reduce((sum, device) => sum + device.coverageRange, 0);

    const totalCost = devices.reduce((sum, device) => sum + device.price, 0);
    const averagePrice = totalDevices > 0 ? totalCost / totalDevices : 0;
    const averageCoverage = deployedDevices > 0 ? totalCoverage / deployedDevices : 0;

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

  interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    color: 'cyan' | 'purple' | 'green' | 'orange';
    delay?: number;
  }

  const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, color, delay = 0 }) => {
    const colorClasses = {
      cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400',
      purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
      green: 'from-green-500/20 to-green-600/10 border-green-500/30 text-green-400',
      orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-400',
    };

    return (
      <div
        className={`glass-card rounded-xl p-5 fade-in ${colorClasses[color]}`}
        style={{ animationDelay: `${delay}s` }}
      >
        <div className="flex items-start justify-between">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center border`}>
            {icon}
          </div>
          {subtitle && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {subtitle}
            </span>
          )}
        </div>
        <div className="mt-4">
          <p className="text-slate-400 text-sm">{title}</p>
          <p className="text-3xl font-bold text-slate-100 mt-1">{value}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold title-glow mb-1">数据统计分析</h1>
        <p className="text-slate-400 text-sm">全面了解设备部署情况和性能指标</p>
      </div>

      {/* 核心统计数据卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="设备总数"
          value={stats.totalDevices}
          icon={<Server className="h-6 w-6" />}
          color="cyan"
          delay={0}
        />
        <StatCard
          title="已部署设备"
          value={stats.deployedDevices}
          subtitle={`${stats.totalDevices > 0 ? ((stats.deployedDevices / stats.totalDevices) * 100).toFixed(0) : 0}%`}
          icon={<MapPin className="h-6 w-6" />}
          color="green"
          delay={0.1}
        />
        <StatCard
          title="未部署设备"
          value={stats.undeployedDevices}
          icon={<Activity className="h-6 w-6" />}
          color="orange"
          delay={0.2}
        />
        <StatCard
          title="总覆盖范围"
          value={`${stats.totalCoverage.toFixed(1)} km`}
          icon={<Wifi className="h-6 w-6" />}
          color="purple"
          delay={0.3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 成本统计 */}
        <div className="glass-card rounded-xl p-6 fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
              <DollarSign className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">成本统计</h2>
              <p className="text-slate-500 text-xs">设备投资概览</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-400" />
                </div>
                <span className="text-slate-400">总成本</span>
              </div>
              <span className="text-2xl font-bold text-green-400">
                ¥{stats.totalCost.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-cyan-400" />
                </div>
                <span className="text-slate-400">平均价格</span>
              </div>
              <span className="text-xl font-semibold text-slate-200">
                ¥{stats.averagePrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-purple-400" />
                </div>
                <span className="text-slate-400">部署率</span>
              </div>
              <span className="text-xl font-semibold text-purple-400">
                {stats.totalDevices > 0
                  ? ((stats.deployedDevices / stats.totalDevices) * 100).toFixed(1)
                  : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* 覆盖范围统计 */}
        <div className="glass-card rounded-xl p-6 fade-in" style={{ animationDelay: '0.5s' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
              <BarChart3 className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">覆盖范围统计</h2>
              <p className="text-slate-500 text-xs">信号覆盖分析</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Wifi className="h-5 w-5 text-purple-400" />
                </div>
                <span className="text-slate-400">总覆盖范围</span>
              </div>
              <span className="text-2xl font-bold text-purple-400">
                {stats.totalCoverage.toFixed(1)} km
              </span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-cyan-400" />
                </div>
                <span className="text-slate-400">平均覆盖范围</span>
              </div>
              <span className="text-xl font-semibold text-slate-200">
                {stats.averageCoverage.toFixed(1)} km
              </span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Server className="h-5 w-5 text-green-400" />
                </div>
                <span className="text-slate-400">已部署设备数</span>
              </div>
              <span className="text-xl font-semibold text-green-400">
                {stats.deployedDevices} 台
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 设备类型分布 */}
      <div className="glass-card rounded-xl p-6 fade-in" style={{ animationDelay: '0.6s' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
            <Zap className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-100">设备类型分布</h2>
            <p className="text-slate-500 text-xs">按设备类型统计</p>
          </div>
        </div>

        {Object.keys(stats.devicesByType).length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto rounded-full bg-slate-800 flex items-center justify-center mb-4">
              <Server className="h-8 w-8 text-slate-600" />
            </div>
            <p className="text-slate-500">暂无设备数据</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(stats.devicesByType).map(([type, count], index) => {
              const percentage = ((count / stats.totalDevices) * 100).toFixed(1);
              const colors = [
                { bg: 'from-cyan-500 to-cyan-600', glow: 'shadow-cyan-500/30' },
                { bg: 'from-purple-500 to-purple-600', glow: 'shadow-purple-500/30' },
                { bg: 'from-green-500 to-green-600', glow: 'shadow-green-500/30' },
                { bg: 'from-orange-500 to-orange-600', glow: 'shadow-orange-500/30' },
                { bg: 'from-pink-500 to-pink-600', glow: 'shadow-pink-500/30' },
              ];
              const color = colors[index % colors.length];

              return (
                <div
                  key={type}
                  className="glass-card rounded-xl p-4 hover:border-cyan-500/40 transition-all"
                  style={{ animationDelay: `${0.7 + index * 0.1}s` }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-slate-200">{type}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${color.bg} text-white shadow-lg ${color.glow}`}>
                      {count}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">占比</span>
                      <span className="text-cyan-400 font-medium">{percentage}%</span>
                    </div>
                    <div className="progress-neon h-2 rounded-full">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${color.bg} transition-all duration-1000`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 部署状态概览 */}
      <div className="glass-card rounded-xl p-6 fade-in" style={{ animationDelay: '0.8s' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
            <Activity className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-100">部署状态概览</h2>
            <p className="text-slate-500 text-xs">实时部署状态监控</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
            <div className="inline-flex p-4 rounded-2xl bg-green-500/20 mb-4">
              <Server className="h-8 w-8 text-green-400" />
            </div>
            <h3 className="text-3xl font-bold text-green-400 mb-1">{stats.deployedDevices}</h3>
            <p className="text-slate-400 text-sm">已部署设备</p>
          </div>

          <div className="text-center p-6 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
            <div className="inline-flex p-4 rounded-2xl bg-orange-500/20 mb-4">
              <Activity className="h-8 w-8 text-orange-400" />
            </div>
            <h3 className="text-3xl font-bold text-orange-400 mb-1">{stats.undeployedDevices}</h3>
            <p className="text-slate-400 text-sm">未部署设备</p>
          </div>

          <div className="text-center p-6 rounded-xl bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20">
            <div className="inline-flex p-4 rounded-2xl bg-cyan-500/20 mb-4">
              <BarChart3 className="h-8 w-8 text-cyan-400" />
            </div>
            <h3 className="text-3xl font-bold text-cyan-400 mb-1">
              {stats.totalDevices > 0
                ? ((stats.deployedDevices / stats.totalDevices) * 100).toFixed(1)
                : 0}%
            </h3>
            <p className="text-slate-400 text-sm">部署完成率</p>
          </div>
        </div>
      </div>
    </div>
  );
};
