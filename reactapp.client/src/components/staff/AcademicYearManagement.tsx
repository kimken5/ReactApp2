import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { academicYearService } from '../../services/academicYearService';
import type { AcademicYear } from '../../types/academicYear';

/**
 * 年度管理メイン画面
 * 年度一覧表示、新規年度作成、年度スライド実行へのナビゲーション
 */
export default function AcademicYearManagement() {
  const navigate = useNavigate();
  const [years, setYears] = useState<AcademicYear[]>([]);
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
      const data = await academicYearService.getAcademicYears(nurseryId);
      setYears(data);
    } catch (err) {
      setError('年度一覧の取得に失敗しました');
      console.error('Failed to load academic years:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const handleCreateYear = () => {
    navigate('/staff/academic-years/create');
  };

  const handleYearSlide = () => {
    navigate('/staff/year-slide');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">年度管理</h1>
        <p className="text-gray-600">
          年度の作成・管理、年度スライド（年度切り替え）を行います
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* アクションボタン */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={handleCreateYear}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + 新規年度作成
        </button>
        <button
          onClick={handleYearSlide}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          年度スライド実行
        </button>
      </div>

      {/* 年度一覧テーブル */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                年度
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                期間
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ステータス
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                備考
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                作成日
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {years.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  年度が登録されていません
                </td>
              </tr>
            ) : (
              years.map((year) => (
                <tr key={year.year} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {year.year}年度
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(year.startDate)} 〜 {formatDate(year.endDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      {year.isCurrent && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          現在年度
                        </span>
                      )}
                      {year.isFuture && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          未来年度
                        </span>
                      )}
                      {!year.isCurrent && !year.isFuture && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          過去年度
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">
                      {year.notes || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {formatDate(year.createdAt)}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 説明セクション */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">
          年度スライドについて
        </h2>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>
              年度スライドは、現在年度のクラス割り当て（園児・職員）を新年度にコピーする処理です
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>
              実行前に必ず「年度スライド実行」ボタンからプレビューを確認してください
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>
              スライド実行後は元に戻せませんので、慎重に実行してください
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
