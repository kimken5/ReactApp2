import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { menuService } from '../services/menuService';
import { fetchAllergens, type Allergen } from '../../services/allergenService';
import type {
  MenuMasterDto,
  CreateMenuMasterDto,
  UpdateMenuMasterDto,
} from '../types/menu';

/**
 * 献立マスター作成・編集ページ
 */
export function MenuMasterFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [menuMaster, setMenuMaster] = useState<MenuMasterDto | null>(null);
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

    loadAllergens();
  }, []);

  // 初期データ読み込み
  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      if (isEditMode && id) {
        const data = await menuService.getMenuMasterById(parseInt(id, 10));
        setMenuMaster(data);

        // アレルゲンIDを配列に変換
        const allergenIdArray = data.allergens
          ? data.allergens.split(',').map((id) => parseInt(id.trim(), 10))
          : [];

        setFormData({
          menuName: data.menuName,
          ingredientName: data.ingredientName || '',
          allergenIds: allergenIdArray,
          description: data.description || '',
        });
      }
    } catch (error) {
      console.error('データの取得に失敗しました:', error);
      setErrors({ general: 'データの取得に失敗しました' });
    } finally {
      setIsLoading(false);
    }
  };

  // フォーム入力ハンドラ
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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

      const requestData = {
        menuName: formData.menuName,
        ingredientName: formData.ingredientName || undefined,
        allergens: allergensString || undefined,
        description: formData.description || undefined,
      };

      if (isEditMode && id) {
        await menuService.updateMenuMaster(parseInt(id, 10), requestData as UpdateMenuMasterDto);
      } else {
        await menuService.createMenuMaster(requestData as CreateMenuMasterDto);
      }

      navigate('/desktop/menu-masters');
    } catch (error: any) {
      console.error('献立マスター保存エラー:', error);
      setErrors({
        general: error.response?.data?.message || '献立マスターの保存に失敗しました',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{isEditMode ? '献立マスター編集' : '献立マスター作成'}</h1>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">読み込み中...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ページタイトル */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{isEditMode ? '献立マスター編集' : '献立マスター作成'}</h1>
        </div>

        {/* エラーメッセージ */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {errors.general}
          </div>
        )}

        {/* フォーム */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6 space-y-6">
            {/* 献立名 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                献立名 <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="menuName"
                value={formData.menuName}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-md border ${
                  errors.menuName ? 'border-red-500' : 'border-gray-300'
                } shadow-sm focus:border-blue-500 focus:ring-blue-500`}
                placeholder="例: カレーライス、みかん、牛乳"
              />
              {errors.menuName && <p className="mt-1 text-sm text-red-600">{errors.menuName}</p>}
              <p className="mt-1 text-xs text-gray-500">※ おやつでも給食でも使える献立名を登録してください</p>
            </div>

            {/* 食材 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                食材
              </label>
              <input
                type="text"
                name="ingredientName"
                value={formData.ingredientName}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="例: 米、豚肉、にんじん、玉ねぎ"
              />
              <p className="mt-1 text-xs text-gray-500">※ 食材名をカンマ区切りで入力してください</p>
            </div>

            {/* アレルゲン */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                アレルゲン
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {allergens.map((allergen) => (
                  <label key={allergen.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allergenIds.includes(allergen.id)}
                      onChange={() => toggleAllergen(allergen.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{allergen.allergenName}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 説明・備考 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                説明・備考
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="献立の説明や備考を入力してください"
              />
            </div>
          </div>

          {/* フッター */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/desktop/menu-masters')}
              className="px-6 py-2 border border-gray-200 rounded-md text-gray-700 font-medium hover:shadow-md transition-all duration-200"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`px-6 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-md font-medium transition-all duration-200 ${
                isSaving ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-lg'
              }`}
            >
              {isSaving ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  保存中...
                </span>
              ) : (
                isEditMode ? '保存する' : '作成する'
              )}
            </button>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
}
