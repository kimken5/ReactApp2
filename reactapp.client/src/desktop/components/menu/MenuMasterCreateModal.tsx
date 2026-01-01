import { useState, useEffect } from 'react';
import { menuService } from '../../services/menuService';
import { fetchAllergens, type Allergen } from '../../../services/allergenService';
import type { CreateMenuMasterDto } from '../../types/menu';


interface MenuMasterCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (menuMasterId: number) => void;
  activeMenuType: 'MorningSnack' | 'Lunch' | 'AfternoonSnack';
}

/**
 * 献立マスター作成モーダル
 * 日別献立画面から新規献立マスターを登録し、自動的に日別献立にも追加
 */
export function MenuMasterCreateModal({
  isOpen,
  onClose,
  onSuccess,
  activeMenuType,
}: MenuMasterCreateModalProps) {
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    menuName: '',
    ingredientName: '',
    allergenIds: [] as number[],
    description: '',
  });

  // アレルゲンマスター取得
  useEffect(() => {
    const loadAllergens = async () => {
      try {
        const data = await fetchAllergens();
        setAllergens(data);
      } catch (error) {
        console.error('アレルゲンマスターの取得に失敗しました:', error);
      }
    };

    if (isOpen) {
      loadAllergens();
    }
  }, [isOpen]);

  // モーダルを閉じる際にフォームをリセット
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        menuName: '',
        ingredientName: '',
        allergenIds: [],
        description: '',
      });
      setErrors({});
    }
  }, [isOpen]);

  // フォーム入力ハンドラ
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // アレルゲンチェックボックスのトグル
  const toggleAllergen = (allergenId: number) => {
    setFormData((prev) => {
      const newAllergenIds = prev.allergenIds.includes(allergenId)
        ? prev.allergenIds.filter((id) => id !== allergenId)
        : [...prev.allergenIds, allergenId];

      return { ...prev, allergenIds: newAllergenIds.sort((a, b) => a - b) };
    });
  };

  // バリデーション
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.menuName.trim()) {
      newErrors.menuName = '献立名を入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 保存
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setIsSaving(true);

      // アレルゲンIDをカンマ区切り文字列に変換
      const allergensString = formData.allergenIds.join(',');

      const requestData: CreateMenuMasterDto = {
        menuName: formData.menuName,
        ingredientName: formData.ingredientName || undefined,
        allergens: allergensString || undefined,
        description: formData.description || undefined,
      };

      const newMenuMaster = await menuService.createMenuMaster(requestData);

      // 成功したら親コンポーネントに通知（献立マスターIDを渡す）
      onSuccess(newMenuMaster.id);
      onClose();
    } catch (error: any) {
      console.error('献立マスター保存エラー:', error);
      setErrors({
        general: error.response?.data?.message || '献立マスターの保存に失敗しました',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 max-w-3xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between rounded-t-lg">
            <h2 className="text-xl font-semibold text-gray-800">新規献立作成</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-4 flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* エラーメッセージ */}
              {errors.general && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {errors.general}
                </div>
              )}

              {/* 献立名 */}
              <div>
                <label htmlFor="menuName" className="block text-sm font-medium text-gray-700 mb-2">
                  献立名 <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  id="menuName"
                  name="menuName"
                  value={formData.menuName}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 ${
                    errors.menuName ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="例: カレーライス、みかん、牛乳"
                />
                {errors.menuName && <p className="mt-1 text-sm text-red-600">{errors.menuName}</p>}
                <p className="mt-1 text-xs text-gray-500">※ おやつでも給食でも使える献立名を登録してください</p>
              </div>

              {/* 食材 */}
              <div>
                <label htmlFor="ingredientName" className="block text-sm font-medium text-gray-700 mb-2">
                  食材
                </label>
                <input
                  type="text"
                  id="ingredientName"
                  name="ingredientName"
                  value={formData.ingredientName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                  placeholder="例: 米、豚肉、にんじん、玉ねぎ"
                />
                <p className="mt-1 text-xs text-gray-500">※ 食材名をカンマ区切りで入力してください</p>
              </div>

              {/* アレルゲン */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  アレルゲン
                </label>
                <div className="grid grid-cols-4 gap-3 p-4 border border-gray-200 rounded-md bg-gray-50">
                  {allergens.map((allergen) => (
                    <label key={allergen.id} className="flex items-center cursor-pointer hover:bg-white px-2 py-1 rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.allergenIds.includes(allergen.id)}
                        onChange={() => toggleAllergen(allergen.id)}
                        className="mr-2 h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500 cursor-pointer"
                      />
                      <span className="text-sm text-gray-700">{allergen.allergenName}</span>
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500">該当する食物アレルゲンをすべて選択してください</p>
              </div>

              {/* 説明・備考 */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  説明・備考
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                  placeholder="献立の説明や備考を入力してください"
                />
              </div>
            </form>
          </div>

          {/* Footer - 固定 */}
          <div className="bg-white px-6 py-4 border-t border-gray-200 flex justify-end gap-3 rounded-b-lg">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition"
              disabled={isSaving}
            >
              キャンセル
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSaving}
              className={`px-6 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-md font-medium transition ${
                isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'
              }`}
            >
              {isSaving ? '保存中...' : '保存して追加'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
