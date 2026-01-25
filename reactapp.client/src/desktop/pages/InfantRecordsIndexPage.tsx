import { useNavigate } from 'react-router-dom';
import { MdThermostat, MdViewList } from 'react-icons/md';
import { DashboardLayout } from '../components/layout/DashboardLayout';

/**
 * 生活記録インデックスページ
 * 各種生活記録機能へのナビゲーション
 */
export function InfantRecordsIndexPage() {
  const navigate = useNavigate();

  const menuItems = [
    {
      id: 'manage',
      title: '乳児生活記録管理',
      description: '全ての生活記録を統合的に閲覧・管理します(ミルク・食事・睡眠・午睡チェック・排泄・体温・機嫌・室温湿度)',
      icon: MdViewList,
      path: '/desktop/infant-records/manage',
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      id: 'temperature',
      title: 'クラス体温一括入力',
      description: 'クラス全員の体温を一括で効率的に記録します',
      icon: MdThermostat,
      path: '/desktop/infant-records/class-temperature',
      iconColor: 'text-red-500',
      bgColor: 'bg-red-50',
    },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">生活記録</h1>
          <p className="mt-2 text-sm text-gray-600">
            各種生活記録の入力・管理を行います
          </p>
        </div>

        {/* メニューカード */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => navigate(item.path)}
                className="bg-white rounded-md shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start">
                  <div className={`${item.bgColor} p-3 rounded-lg`}>
                    <Icon className={`${item.iconColor} w-8 h-8`} />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-600">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
