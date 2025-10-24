import { DashboardLayout } from '../components/layout/DashboardLayout';
import { useDesktopAuth } from '../contexts/DesktopAuthContext';

/**
 * デスクトップアプリ用ダッシュボードページ
 */

export function DashboardPage() {
  const { state } = useDesktopAuth();

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">ダッシュボード</h1>
          <p className="text-gray-600">
            {state.nursery?.name} - {state.nursery?.currentAcademicYear}年度
          </p>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="在園児数"
            value="120"
            subtitle="前月比 +3"
            icon="👶"
            color="blue"
          />
          <StatCard
            title="職員数"
            value="25"
            subtitle="在職中"
            icon="👩‍🏫"
            color="green"
          />
          <StatCard
            title="クラス数"
            value="8"
            subtitle="全年齢"
            icon="👥"
            color="purple"
          />
          <StatCard
            title="今日の欠席"
            value="5"
            subtitle="通知済み"
            icon="📞"
            color="orange"
          />
        </div>

        {/* 最近の活動 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">最近の連絡帳</h2>
            <div className="space-y-3">
              <ActivityItem
                title="さくら組 - 田中太郎くん"
                time="10分前"
                status="公開済み"
                statusColor="green"
              />
              <ActivityItem
                title="ひまわり組 - 佐藤花子さん"
                time="30分前"
                status="下書き"
                statusColor="gray"
              />
              <ActivityItem
                title="すみれ組 - 鈴木次郎くん"
                time="1時間前"
                status="公開済み"
                statusColor="green"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">今日の予定</h2>
            <div className="space-y-3">
              <EventItem
                title="避難訓練"
                time="10:30 - 11:00"
                type="全体"
              />
              <EventItem
                title="身体測定（さくら組）"
                time="14:00 - 14:30"
                type="クラス"
              />
              <EventItem
                title="職員会議"
                time="17:00 - 18:00"
                type="職員"
              />
            </div>
          </div>
        </div>

        {/* クイックアクション */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">クイックアクション</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickActionButton icon="📋" label="連絡帳作成" href="/desktop/daily-reports/create" />
            <QuickActionButton icon="👶" label="園児登録" href="/desktop/children/create" />
            <QuickActionButton icon="📸" label="写真アップロード" href="/desktop/photos/upload" />
            <QuickActionButton icon="📢" label="お知らせ作成" href="/desktop/announcements/create" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// サブコンポーネント

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

function StatCard({ title, value, subtitle, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center text-2xl`}>
          {icon}
        </div>
      </div>
      <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-800 mb-1">{value}</p>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
  );
}

interface ActivityItemProps {
  title: string;
  time: string;
  status: string;
  statusColor: 'green' | 'gray';
}

function ActivityItem({ title, time, status, statusColor }: ActivityItemProps) {
  const statusColors = {
    green: 'bg-green-100 text-green-800',
    gray: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-800">{title}</p>
        <p className="text-xs text-gray-500">{time}</p>
      </div>
      <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[statusColor]}`}>
        {status}
      </span>
    </div>
  );
}

interface EventItemProps {
  title: string;
  time: string;
  type: string;
}

function EventItem({ title, time, type }: EventItemProps) {
  return (
    <div className="flex items-start space-x-3 py-2 border-b border-gray-100 last:border-0">
      <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-800">{title}</p>
        <div className="flex items-center space-x-2 mt-1">
          <p className="text-xs text-gray-500">{time}</p>
          <span className="text-xs text-gray-400">•</span>
          <p className="text-xs text-gray-500">{type}</p>
        </div>
      </div>
    </div>
  );
}

interface QuickActionButtonProps {
  icon: string;
  label: string;
  href: string;
}

function QuickActionButton({ icon, label, href }: QuickActionButtonProps) {
  return (
    <a
      href={href}
      className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow hover:shadow-md transition border border-gray-100"
    >
      <span className="text-4xl mb-2">{icon}</span>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </a>
  );
}
