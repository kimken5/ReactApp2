/**
 * アレルゲンマスターAPI
 * AllergenMasterテーブルから28項目のアレルゲン一覧を取得
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export interface Allergen {
  id: number;
  allergenName: string;
  sortOrder: number;
}

/**
 * アレルゲン一覧を取得
 * @returns アレルゲン配列（SortOrder順）
 */
export async function fetchAllergens(): Promise<Allergen[]> {
  const response = await axios.get<Allergen[]>(`${API_BASE_URL}/api/allergens`);
  return response.data;
}
