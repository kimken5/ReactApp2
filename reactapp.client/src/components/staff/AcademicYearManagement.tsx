import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../desktop/components/layout/DashboardLayout';
import { academicYearService } from '../../services/academicYearService';
import type { AcademicYear } from '../../types/academicYear';

/**
 * 年度管理ダッシュボード
 * 年度管理の各機能へのナビゲーションとステータス確認
 */
export default function AcademicYearManagement() {
  const navigate = useNavigate();
  const [currentYear, setCurrentYear] = useState<AcademicYear | null>(null);
  const [futureYears, setFutureYears] = useState<AcademicYear[]>([]);
  const [pastYears, setPastYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // TODO: 実際のnurseryIdはユーザーコンテキストから取得
  const nurseryId = 1;

  useEffect(() => {
    loadYears();
  }, []);

  const loadYears = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 年度管理: データ読み込み開始...');
      console.log('📍 デモモード:', new URLSearchParams(window.location.search).get('demo') === 'true');

      // 現在年度取得
      const current = await academicYearService.getCurrentYear(nurseryId);
      console.log('✅ 現在年度:', current);
      setCurrentYear(current);

      // 全年度取得して分類
      const allYears = await academicYearService.getAcademicYears(nurseryId);
      console.log('✅ 全年度:', allYears);
      setFutureYears(allYears.filter(y => y.isFuture));
      setPastYears(allYears.filter(y => !y.isCurrent && !y.isFuture));
    } catch (err) {
      setError('年度情報の取得に失敗しました');
      console.error('❌ 年度情報の取得に失敗:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-96">
          <div className="text-gray-600">読み込み中...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

      {/* 現在年度確認セクション */}
      <section className="mb-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">現在年度確認</h2>
        <div className="bg-white rounded-md shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
          {currentYear ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  現在年度
                </span>
                <span className="text-2xl font-bold text-gray-800">{currentYear.year}年度</span>
              </div>
              <div className="text-gray-600">
                期間: {formatDate(currentYear.startDate)} 〜 {formatDate(currentYear.endDate)}
              </div>
              {currentYear.notes && (
                <div className="text-sm text-gray-500">
                  備考: {currentYear.notes}
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500">
              現在年度が設定されていません
              <button
                onClick={() => navigate('/desktop/academic-years/create')}
                className="ml-4 text-blue-600 hover:text-blue-700 underline"
              >
                年度を作成する
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 翌年度クラス構成設定セクション */}
      <section className="mb-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">翌年度クラス構成設定</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/desktop/class-assignment')}
            className="bg-white rounded-md shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200 text-left"
          >
            <h3 className="text-base font-semibold text-gray-800 mb-2">クラス別園児割り当て</h3>
            <p className="text-xs text-gray-600 mb-4">
              翌年度のクラスに園児を個別に割り当てます
            </p>
            <div className="text-xs text-blue-600 font-medium">設定画面へ →</div>
          </button>

          <button
            onClick={() => {
              // TODO: 一括登録画面へ遷移
              alert('一括登録機能は今後実装予定です');
            }}
            className="bg-white rounded-md shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200 text-left"
          >
            <h3 className="text-base font-semibold text-gray-800 mb-2">一括登録</h3>
            <p className="text-xs text-gray-600 mb-4">
              CSVファイルなどから一括でクラス構成を登録します
            </p>
            <div className="text-xs text-blue-600 font-medium">登録画面へ →</div>
          </button>
        </div>
      </section>

      {/* 翌年度担任設定セクション */}
      <section className="mb-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">翌年度担任設定</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => {
              // TODO: クラス別担任割り当て画面へ遷移
              alert('クラス別担任割り当て機能は今後実装予定です');
            }}
            className="bg-white rounded-md shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200 text-left"
          >
            <h3 className="text-base font-semibold text-gray-800 mb-2">クラス別担任割り当て</h3>
            <p className="text-xs text-gray-600 mb-4">
              翌年度の各クラスに担任を割り当てます
            </p>
            <div className="text-xs text-blue-600 font-medium">設定画面へ →</div>
          </button>

          <button
            onClick={() => {
              // TODO: 役割設定画面へ遷移
              alert('役割設定機能は今後実装予定です');
            }}
            className="bg-white rounded-md shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200 text-left"
          >
            <h3 className="text-base font-semibold text-gray-800 mb-2">役割設定（主担任/副担任）</h3>
            <p className="text-xs text-gray-600 mb-4">
              担任の役割（主担任・副担任）を設定します
            </p>
            <div className="text-xs text-blue-600 font-medium">設定画面へ →</div>
          </button>
        </div>
      </section>

      {/* 年度スライド実行セクション */}
      <section className="mb-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">年度スライド実行</h2>
        <div className="bg-white rounded-md shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="mb-4">
            <p className="text-gray-700 mb-2">
              年度スライドを実行すると、現在年度のクラス割り当て（園児・職員）を新年度にコピーします。
            </p>
            <p className="text-xs text-gray-600">
              ※実行前に必ずプレビューで影響範囲を確認してください。実行後は元に戻せません。
            </p>
          </div>

          {futureYears.length > 0 ? (
            <div className="space-y-3">
              <div className="text-xs text-gray-600">
                スライド可能な未来年度: {futureYears.map(y => `${y.year}年度`).join(', ')}
              </div>
              <button
                onClick={() => navigate('/desktop/year-slide')}
                className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm rounded-md hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
              >
                年度スライド実行画面へ
              </button>
            </div>
          ) : (
            <div className="text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-4">
              <p className="mb-2">スライド可能な未来年度がありません。</p>
              <button
                onClick={() => navigate('/desktop/academic-years/create')}
                className="text-blue-600 hover:text-blue-700 underline"
              >
                未来年度を作成する
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 過去年度参照セクション */}
      <section className="mb-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">過去年度参照</h2>
        <div className="bg-white rounded-md shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
          {pastYears.length > 0 ? (
            <div className="space-y-4">
              <p className="text-gray-700">
                過去年度のクラス構成と担任構成を確認できます
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        年度
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        期間
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pastYears.map((year) => (
                      <tr key={year.year} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-800">{year.year}年度</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-xs text-gray-600">
                            {formatDate(year.startDate)} 〜 {formatDate(year.endDate)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            onClick={() => {
                              // TODO: 年度詳細画面へ遷移
                              alert(`${year.year}年度の詳細表示機能は今後実装予定です`);
                            }}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            詳細を見る
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">
              過去年度のデータがありません
            </div>
          )}
        </div>
      </section>

      {/* クイックアクション */}
      <section>
        <h2 className="text-base font-semibold text-gray-800 mb-4">その他の操作</h2>
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/desktop/academic-years/create')}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm rounded-md hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
          >
            + 新規年度作成
          </button>
        </div>
      </section>
    </div>
    </DashboardLayout>
  );
}
