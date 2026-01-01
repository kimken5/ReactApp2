// 献立管理用の型定義

// ===== 献立マスター管理 =====
export interface MenuMasterDto {
  id: number;
  nurseryId: number;
  menuName: string;
  ingredientName?: string;
  allergens?: string; // カンマ区切りのアレルゲンID ("1,3,7")
  allergenNames?: string; // アレルゲン名称（表示用）
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMenuMasterDto {
  menuName: string;
  ingredientName?: string;
  allergens?: string;
  description?: string;
}

export interface UpdateMenuMasterDto {
  menuName: string;
  ingredientName?: string;
  allergens?: string;
  description?: string;
}

export interface MenuMasterSearchDto {
  id: number;
  menuName: string;
  ingredientName?: string;
  allergens?: string;
  allergenNames?: string;
  description?: string;
}

// ===== 日別献立管理 =====
export interface DailyMenuDto {
  id: number;
  nurseryId: number;
  menuDate: string; // ISO date string
  menuType: 'Lunch' | 'MorningSnack' | 'AfternoonSnack';
  menuMasterId: number;
  sortOrder: number;
  notes?: string;
  menuName: string; // MenuMasterから取得
  ingredientName?: string; // MenuMasterから取得
  allergens?: string; // MenuMasterから取得
  allergenNames?: string; // アレルゲン名称（表示用）
  description?: string; // MenuMasterから取得
  createdAt: string;
  updatedAt: string;
}

export interface DailyMenuItemDto {
  menuMasterId: number;
  sortOrder: number;
  notes?: string;
}

export interface CreateDailyMenuDto {
  menuDate: string; // ISO date string
  menuType: 'Lunch' | 'MorningSnack' | 'AfternoonSnack';
  menuMasterId: number;
  sortOrder: number;
  notes?: string;
}

export interface UpdateDailyMenuDto {
  sortOrder?: number;
  notes?: string;
}

export interface BulkCreateDailyMenusDto {
  menuDate: string; // ISO date string
  morningSnacks: DailyMenuItemDto[];
  lunches: DailyMenuItemDto[];
  afternoonSnacks: DailyMenuItemDto[];
}

// ===== UI用のヘルパー型 =====
export const MenuTypeLabels: Record<'Lunch' | 'MorningSnack' | 'AfternoonSnack', string> = {
  Lunch: '給食',
  MorningSnack: '午前おやつ',
  AfternoonSnack: '午後おやつ',
};

export const MenuTypeColors: Record<'Lunch' | 'MorningSnack' | 'AfternoonSnack', string> = {
  Lunch: 'bg-blue-100 text-blue-800',
  MorningSnack: 'bg-green-100 text-green-800',
  AfternoonSnack: 'bg-orange-100 text-orange-800',
};
