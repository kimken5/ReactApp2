import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { academicYearService } from '../../services/academicYearService';
import type { CreateAcademicYearRequest } from '../../types/academicYear';

/**
 * 新規年度作成フォーム
 */
export default function AcademicYearCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // TODO: 実際のnurseryIdはユーザーコンテキストから取得
  const nurseryId = 1;

  const [formData, setFormData] = useState({
    year: new Date().getFullYear() + 1, // デフォルトは翌年度
    startDate: '',
    endDate: '',
    isFuture: true,
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      const request: CreateAcademicYearRequest = {
        nurseryId,
        year: formData.year,
        isFuture: formData.isFuture,
        notes: formData.notes || undefined,
      };

      // 日付が指定されている場合のみ送信
      if (formData.startDate) {
        request.startDate = formData.startDate;
      }
      if (formData.endDate) {
        request.endDate = formData.endDate;
      }

      await academicYearService.createAcademicYear(request);

      // 成功したら一覧画面に戻る
      navigate('/staff/academic-years');
    } catch (err: any) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('年度の作成に失敗しました');
      }
      console.error('Failed to create academic year:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/staff/academic-years');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">新規年度作成</h1>
        <p className="text-gray-600">
          新しい年度を作成します。通常は翌年度を未来年度として作成します。
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        {/* 年度 */}
        <div className="mb-6">
          <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
            年度 <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="year"
            required
            min={2000}
            max={2100}
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="2025"
          />
          <p className="mt-1 text-sm text-gray-500">
            例: 2025（2025年度 = 2025年4月〜2026年3月）
          </p>
        </div>

        {/* 開始日 */}
        <div className="mb-6">
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
            開始日（任意）
          </label>
          <input
            type="date"
            id="startDate"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            未指定の場合は自動的に4月1日に設定されます
          </p>
        </div>

        {/* 終了日 */}
        <div className="mb-6">
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
            終了日（任意）
          </label>
          <input
            type="date"
            id="endDate"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            未指定の場合は自動的に翌年3月31日に設定されます
          </p>
        </div>

        {/* 未来年度フラグ */}
        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isFuture}
              onChange={(e) => setFormData({ ...formData, isFuture: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              未来年度として作成（次年度準備用）
            </span>
          </label>
          <p className="mt-1 ml-6 text-sm text-gray-500">
            年度スライド実行時に、未来年度が現在年度に切り替わります
          </p>
        </div>

        {/* 備考 */}
        <div className="mb-6">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            備考（任意）
          </label>
          <textarea
            id="notes"
            rows={3}
            maxLength={500}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="年度に関する追加情報があれば入力してください"
          />
          <p className="mt-1 text-sm text-gray-500">
            {formData.notes.length} / 500文字
          </p>
        </div>

        {/* ボタン */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? '作成中...' : '作成'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors font-medium"
          >
            キャンセル
          </button>
        </div>
      </form>

      {/* 注意事項 */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-yellow-900 mb-2">注意事項</h3>
        <ul className="space-y-1 text-sm text-yellow-800">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>一度作成した年度は削除できません</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>同じ年度を重複して作成することはできません</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>開始日は終了日より前である必要があります</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
