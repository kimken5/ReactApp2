import { useState, useEffect } from 'react';
import { masterService } from '../../services/masterService';
import { fetchAddressByPostalCode } from '../../../services/publicApplicationService';
import type {
  ParentDto,
  UpdateParentRequestDto,
  ChildDto,
} from '../../types/master';

/**
 * 保護者編集モーダル
 */

interface ParentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  parentId: number;
}

export function ParentEditModal({ isOpen, onClose, onSuccess, parentId }: ParentEditModalProps) {
  const [parent, setParent] = useState<ParentDto | null>(null);
  const [children, setChildren] = useState<ChildDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // フォーム状態
  const [formData, setFormData] = useState({
    phoneNumber: '',
    name: '',
    nameKana: '',
    dateOfBirth: '',
    postalCode: '',
    prefecture: '',
    city: '',
    addressLine: '',
    homePhone: '',
    email: '',
    isActive: true,
  });

  // 園児選択状態
  const [selectedChildIds, setSelectedChildIds] = useState<Set<string>>(new Set());

  // オートコンプリート用状態
  const [childSearchQuery, setChildSearchQuery] = useState('');
  const [showChildSuggestions, setShowChildSuggestions] = useState(false);

  // モーダルが開いたときにデータを読み込む
  useEffect(() => {
    if (isOpen && parentId) {
      loadData();
    }
  }, [isOpen, parentId]);

  // 郵便番号から住所を自動入力
  useEffect(() => {
    const fetchAddress = async () => {
      if (formData.postalCode && formData.postalCode.replace(/-/g, '').length === 7) {
        const result = await fetchAddressByPostalCode(formData.postalCode);
        if (result) {
          setFormData(prev => ({
            ...prev,
            prefecture: result.prefecture,
            city: result.city,
          }));
        }
      }
    };

    fetchAddress();
  }, [formData.postalCode]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setErrors({});

      // 園児一覧と保護者データを並列取得
      const [childrenData, parentData] = await Promise.all([
        masterService.getChildren({ isActive: true }),
        masterService.getParent(parentId),
      ]);

      setChildren(childrenData);
      setParent(parentData);
      setFormData({
        phoneNumber: parentData.phoneNumber || '',
        name: parentData.name || '',
        nameKana: parentData.nameKana || '',
        dateOfBirth: parentData.dateOfBirth?.split('T')[0] || '',
        postalCode: parentData.postalCode || '',
        prefecture: parentData.prefecture || '',
        city: parentData.city || '',
        addressLine: parentData.addressLine || '',
        homePhone: parentData.homePhone || '',
        email: parentData.email || '',
        isActive: parentData.isActive,
      });

      // 紐付いている園児を選択状態にする
      if (parentData.children && parentData.children.length > 0) {
        const childIdSet = new Set(
          parentData.children.map(c => `${c.nurseryId}-${c.childId}`)
        );
        setSelectedChildIds(childIdSet);
      }
    } catch (error) {
      console.error('データの取得に失敗しました:', error);
      setErrors({ general: 'データの取得に失敗しました' });
    } finally {
      setIsLoading(false);
    }
  };

  // 入力値変更ハンドラ
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // エラークリア
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // オートコンプリート: 園児を追加
  const handleAddChild = (child: ChildDto) => {
    const key = `${child.nurseryId}-${child.childId}`;
    setSelectedChildIds(prev => new Set(prev).add(key));
    setChildSearchQuery('');
    setShowChildSuggestions(false);
  };

  // オートコンプリート: 園児を削除
  const handleRemoveChild = (nurseryId: number, childId: number) => {
    const key = `${nurseryId}-${childId}`;
    setSelectedChildIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(key);
      return newSet;
    });
  };

  // フィルタされた園児候補を取得
  const getFilteredChildren = () => {
    if (!childSearchQuery.trim()) return [];

    const query = childSearchQuery.toLowerCase();
    return children.filter(child => {
      const key = `${child.nurseryId}-${child.childId}`;
      // 既に選択済みの園児は除外
      if (selectedChildIds.has(key)) return false;
      // 名前で検索
      return child.name.toLowerCase().includes(query);
    }).slice(0, 10); // 最大10件まで表示
  };

  // 選択済み園児を取得
  const getSelectedChildren = () => {
    return children.filter(child => {
      const key = `${child.nurseryId}-${child.childId}`;
      return selectedChildIds.has(key);
    });
  };

  // バリデーション
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.phoneNumber) {
      newErrors.phoneNumber = '電話番号は必須です';
    }
    if (!formData.name) {
      newErrors.name = '氏名は必須です';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 保存処理
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setIsSaving(true);
      setErrors({});

      const updateRequest: UpdateParentRequestDto = {
        phoneNumber: formData.phoneNumber || undefined,
        name: formData.name || undefined,
        nameKana: formData.nameKana || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        postalCode: formData.postalCode || undefined,
        prefecture: formData.prefecture || undefined,
        city: formData.city || undefined,
        addressLine: formData.addressLine || undefined,
        homePhone: formData.homePhone || undefined,
        email: formData.email || undefined,
        isActive: formData.isActive,
      };

      const result = await masterService.updateParent(parentId, updateRequest);
      console.log('保存成功:', result);
      onSuccess();
    } catch (error: any) {
      console.error('保存に失敗しました:', error);

      let errorMessage = '保存に失敗しました';
      if (error?.response?.data) {
        const responseData = error.response.data;
        if (responseData.error?.message) {
          errorMessage = responseData.error.message;
        } else if (responseData.message) {
          errorMessage = responseData.message;
        } else if (responseData.title) {
          errorMessage = responseData.title;
        } else if (typeof responseData === 'string') {
          errorMessage = responseData;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      setErrors({ general: errorMessage });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 max-w-4xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between rounded-t-lg">
            <h2 className="text-xl font-semibold text-gray-800">保護者編集</h2>
            <button
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
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">読み込み中...</p>
                </div>
              </div>
            ) : (
              <>
                {/* エラーメッセージ */}
                {errors.general && (
                  <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {errors.general}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* 基本情報 */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">基本情報</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 電話番号 */}
                      <div>
                        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                          電話番号 <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="tel"
                          id="phoneNumber"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleChange}
                          className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 ${errors.phoneNumber ? 'border-red-500' : 'border-gray-200'}`}
                          placeholder="090-1234-5678"
                        />
                        {errors.phoneNumber && (
                          <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
                        )}
                      </div>

                      {/* 氏名 */}
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                          氏名 <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 ${errors.name ? 'border-red-500' : 'border-gray-200'}`}
                          placeholder="山田 太郎"
                        />
                        {errors.name && (
                          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                        )}
                      </div>

                      {/* ふりがな */}
                      <div>
                        <label htmlFor="nameKana" className="block text-sm font-medium text-gray-700 mb-2">
                          ふりがな
                        </label>
                        <input
                          type="text"
                          id="nameKana"
                          name="nameKana"
                          value={formData.nameKana}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                          placeholder="やまだ たろう"
                        />
                      </div>

                      {/* 生年月日 */}
                      <div>
                        <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
                          生年月日
                        </label>
                        <input
                          type="date"
                          id="dateOfBirth"
                          name="dateOfBirth"
                          value={formData.dateOfBirth}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                        />
                      </div>

                      {/* メールアドレス */}
                      <div className="md:col-span-2">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                          メールアドレス
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                          placeholder="example@example.com"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 住所情報 */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">住所情報</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 郵便番号 */}
                      <div>
                        <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
                          郵便番号
                        </label>
                        <input
                          type="text"
                          id="postalCode"
                          name="postalCode"
                          value={formData.postalCode}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                          placeholder="123-4567"
                        />
                      </div>

                      {/* 自宅電話番号 */}
                      <div>
                        <label htmlFor="homePhone" className="block text-sm font-medium text-gray-700 mb-2">
                          自宅電話番号
                        </label>
                        <input
                          type="tel"
                          id="homePhone"
                          name="homePhone"
                          value={formData.homePhone}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                          placeholder="03-1234-5678"
                        />
                      </div>

                      {/* 都道府県 */}
                      <div>
                        <label htmlFor="prefecture" className="block text-sm font-medium text-gray-700 mb-2">
                          都道府県
                        </label>
                        <input
                          type="text"
                          id="prefecture"
                          name="prefecture"
                          value={formData.prefecture}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                          placeholder="東京都"
                        />
                      </div>

                      {/* 市区町村 */}
                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                          市区町村
                        </label>
                        <input
                          type="text"
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                          placeholder="渋谷区"
                        />
                      </div>

                      {/* 町名・番地 */}
                      <div className="md:col-span-2">
                        <label htmlFor="addressLine" className="block text-sm font-medium text-gray-700 mb-2">
                          町名・番地
                        </label>
                        <input
                          type="text"
                          id="addressLine"
                          name="addressLine"
                          value={formData.addressLine}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                          placeholder="神南1-2-3"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 園児選択 */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">紐付ける園児</h3>

                    {/* オートコンプリート検索 */}
                    <div className="mb-4 relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        園児を追加
                      </label>
                      <input
                        type="text"
                        value={childSearchQuery}
                        onChange={(e) => {
                          setChildSearchQuery(e.target.value);
                          setShowChildSuggestions(true);
                        }}
                        onFocus={() => setShowChildSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowChildSuggestions(false), 200)}
                        placeholder="園児名を入力..."
                        className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                      />

                      {/* サジェストリスト */}
                      {showChildSuggestions && childSearchQuery && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {getFilteredChildren().length === 0 ? (
                            <div className="px-4 py-3 text-gray-500 text-sm">
                              該当する園児が見つかりません
                            </div>
                          ) : (
                            getFilteredChildren().map((child) => (
                              <button
                                key={`${child.nurseryId}-${child.childId}`}
                                type="button"
                                onClick={() => handleAddChild(child)}
                                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition border-b border-gray-100 last:border-b-0"
                              >
                                <div className="font-medium text-gray-900">{child.name}</div>
                                <div className="text-sm text-gray-600">
                                  {child.className || '未配属'} / {child.age}歳
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {/* 選択済み園児一覧 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        選択済み園児
                      </label>
                      {getSelectedChildren().length === 0 ? (
                        <p className="text-gray-500 text-center py-8 border border-gray-200 rounded-lg">
                          園児が選択されていません
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {getSelectedChildren().map((child) => (
                            <div
                              key={`${child.nurseryId}-${child.childId}`}
                              className="p-4 border border-gray-200 rounded-lg bg-gray-50 flex items-start justify-between"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 truncate">{child.name}</div>
                                <div className="text-sm text-gray-600">
                                  {child.className || '未配属'} / {child.age}歳
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveChild(child.nurseryId, child.childId)}
                                className="ml-2 text-red-600 hover:text-red-800 transition"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="mt-2 text-sm text-gray-500">
                        選択数: {getSelectedChildren().length} 人
                      </p>
                    </div>
                  </div>
                </form>
              </>
            )}
          </div>

          {/* Footer - 固定 */}
          {!isLoading && (
            <div className="bg-white px-6 py-4 border-t border-gray-200 flex justify-end gap-3 rounded-b-lg">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isSaving}
                onClick={handleSubmit}
                className={`px-6 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-md font-medium transition ${isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}`}
              >
                {isSaving ? '保存中...' : '保存する'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
