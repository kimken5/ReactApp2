# TDD実装ガイド - 保育園保護者向けモバイルアプリ

## 1. TDD基本原則

### 1.1 Red-Green-Refactor サイクル
```
🔄 TDDサイクル (厳格遵守)
├── 🔴 RED段階 (5-15分)
│   ├── 失敗するテストを書く
│   ├── コンパイルエラーは許可
│   ├── 実装は一切しない  
│   ├── テストが失敗することを確認
│   └── 次の機能の明確な仕様定義
│
├── 🟢 GREEN段階 (5-15分)
│   ├── テストを通す最小限の実装
│   ├── 汚いコードでも構わない
│   ├── ハードコードも許可
│   ├── 全テストが合格することを確認
│   └── 機能動作を証明
│
└── 🔵 REFACTOR段階 (10-30分)
    ├── コード品質の向上
    ├── 重複の除去
    ├── 意図の明確化
    ├── 設計の改善
    └── 全テストが合格し続けることを確認
```

### 1.2 TDD禁止事項
```
❌ TDD違反行為 (絶対禁止)
├── 実装ファーストでテストを後から書く
├── テストなしでの実装変更
├── 失敗しないテストを書く
├── テストをスキップしての実装
├── リファクタリング段階での機能追加
├── 複数機能を一度にテスト
└── テスト失敗状態でのコミット

✅ TDD遵守事項 (必須実践)
├── 1つの失敗テストから開始
├── テスト合格後の即座リファクタリング
├── 小さなステップでの進行
├── 常に動作するコードの維持
├── 継続的な設計改善
├── テスト可読性の重視
└── チーム全員でのTDD実践
```

## 2. フロントエンド TDD実装

### 2.1 React Component TDD
```typescript
// 🔴 RED段階: 認証画面コンポーネントテスト
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { LoginScreen } from './LoginScreen'; // まだ存在しない

describe('LoginScreen', () => {
  it('should render phone number input field', () => {
    // Arrange & Act - この時点でコンポーネントは存在しないため失敗
    render(<LoginScreen />);
    
    // Assert
    const phoneInput = screen.getByLabelText('電話番号');
    expect(phoneInput).toBeInTheDocument();
    expect(phoneInput).toHaveAttribute('type', 'tel');
  });

  it('should validate phone number format', async () => {
    // Arrange
    const mockOnSubmit = vi.fn();
    render(<LoginScreen onSubmit={mockOnSubmit} />);
    
    // Act - 不正な電話番号を入力
    const phoneInput = screen.getByLabelText('電話番号');
    const submitButton = screen.getByRole('button', { name: '認証コード送信' });
    
    fireEvent.change(phoneInput, { target: { value: 'invalid-phone' } });
    fireEvent.click(submitButton);
    
    // Assert
    await waitFor(() => {
      expect(screen.getByText('正しい電話番号を入力してください')).toBeInTheDocument();
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should submit valid phone number', async () => {
    // Arrange
    const mockOnSubmit = vi.fn();
    render(<LoginScreen onSubmit={mockOnSubmit} />);
    
    // Act - 正しい電話番号を入力
    const phoneInput = screen.getByLabelText('電話番号');
    const submitButton = screen.getByRole('button', { name: '認証コード送信' });
    
    fireEvent.change(phoneInput, { target: { value: '+81-90-1234-5678' } });
    fireEvent.click(submitButton);
    
    // Assert
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('+81-90-1234-5678');
    });
  });
});

// 🟢 GREEN段階: 最小実装
import React, { useState } from 'react';
import { validatePhoneNumber } from '../utils/validation';

interface LoginScreenProps {
  onSubmit?: (phoneNumber: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSubmit }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePhoneNumber(phoneNumber)) {
      setError('正しい電話番号を入力してください');
      return;
    }
    
    setError('');
    onSubmit?.(phoneNumber);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="phoneNumber">電話番号</label>
        <input
          id="phoneNumber"
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          aria-describedby={error ? 'phoneError' : undefined}
        />
        {error && <span id="phoneError" role="alert">{error}</span>}
      </div>
      <button type="submit">認証コード送信</button>
    </form>
  );
};

// 🔵 REFACTOR段階: 設計改善
// - カスタムフック抽出
// - バリデーション改善
// - スタイリング追加
// - アクセシビリティ向上
```

### 2.2 欠席・遅刻・お迎え連絡機能 TDD (新機能)
```typescript
// 🔴 RED段階: 連絡フォームコンポーネントテスト
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ContactFormPage } from './ContactFormPage'; // まだ存在しない

describe('ContactFormPage (Contact Notifications)', () => {
  const mockChildData = {
    id: '1',
    name: '田中太郎',
    class: 'ひまわり組'
  };

  it('should render contact type selection', () => {
    // Arrange & Act - コンポーネントが存在しないため失敗
    render(<ContactFormPage childId="1" childName="田中太郎" />);
    
    // Assert - 連絡種別選択が表示されること
    expect(screen.getByLabelText('連絡種別')).toBeInTheDocument();
    expect(screen.getByDisplayValue('欠席')).toBeInTheDocument();
    expect(screen.getByDisplayValue('遅刻')).toBeInTheDocument();
    expect(screen.getByDisplayValue('お迎え')).toBeInTheDocument();
  });

  it('should show pickup fields only when pickup type selected', async () => {
    // Arrange
    render(<ContactFormPage childId="1" childName="田中太郎" />);
    
    // Act - お迎えを選択
    const typeSelect = screen.getByLabelText('連絡種別');
    fireEvent.change(typeSelect, { target: { value: 'pickup' } });
    
    // Assert - お迎え関連フィールドが表示されること
    await waitFor(() => {
      expect(screen.getByLabelText('お迎え者')).toBeInTheDocument();
      expect(screen.getByLabelText('お迎え時間')).toBeInTheDocument();
    });
  });

  it('should validate pickup fields when pickup type selected', async () => {
    // Arrange
    const mockOnSubmit = vi.fn();
    render(<ContactFormPage childId="1" childName="田中太郎" onSubmit={mockOnSubmit} />);
    
    // Act - お迎えを選択して必須項目を空で送信
    fireEvent.change(screen.getByLabelText('連絡種別'), { target: { value: 'pickup' } });
    fireEvent.change(screen.getByLabelText('理由'), { target: { value: '早退のため' } });
    fireEvent.click(screen.getByRole('button', { name: '送信する' }));
    
    // Assert - バリデーションエラーが表示されること
    await waitFor(() => {
      expect(screen.getByText('お迎え連絡の場合、お迎え者と時間を入力してください。')).toBeInTheDocument();
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should submit valid contact form', async () => {
    // Arrange
    const mockOnSubmit = vi.fn();
    render(<ContactFormPage childId="1" childName="田中太郎" onSubmit={mockOnSubmit} />);
    
    // Act - 正しいデータで送信
    fireEvent.change(screen.getByLabelText('対象日'), { target: { value: '2025-01-15' } });
    fireEvent.change(screen.getByLabelText('理由'), { target: { value: '発熱のため' } });
    fireEvent.click(screen.getByRole('button', { name: '送信する' }));
    
    // Assert
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        childId: '1',
        contactType: 'absence',
        date: '2025-01-15',
        reason: '発熱のため',
        additionalNotes: ''
      });
    });
  });

  it('should display child information', () => {
    // Act
    render(<ContactFormPage childId="1" childName="田中太郎" />);
    
    // Assert - 園児情報が表示されること
    expect(screen.getByText('田中太郎')).toBeInTheDocument();
    expect(screen.getByText('ひまわり組')).toBeInTheDocument();
  });
});

### 2.3 園児一覧機能 TDD (新機能)
```typescript
// 🔴 RED段階: 園児一覧コンポーネントテスト
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ChildrenListPage } from './ChildrenListPage'; // まだ存在しない

describe('ChildrenListPage', () => {
  const mockChildren = [
    { id: '1', name: '田中太郎', class: 'ひまわり組', isActive: true },
    { id: '2', name: '佐藤花子', class: 'さくら組', isActive: true },
    { id: '3', name: '山田次郎', class: 'ひまわり組', isActive: true }
  ];

  it('should display children with name and class only', () => {
    // Arrange & Act - コンポーネントが存在しないため失敗
    render(<ChildrenListPage children={mockChildren} />);
    
    // Assert - 名前とクラスのみ表示されること
    expect(screen.getByText('田中太郎')).toBeInTheDocument();
    expect(screen.getByText('ひまわり組')).toBeInTheDocument();
    expect(screen.getByText('佐藤花子')).toBeInTheDocument();
    expect(screen.getByText('さくら組')).toBeInTheDocument();
    
    // 統計情報が表示されないこと
    expect(screen.queryByText('総園児数')).not.toBeInTheDocument();
    expect(screen.queryByText('総連絡数')).not.toBeInTheDocument();
  });

  it('should display contact and history buttons for each child', () => {
    // Act
    render(<ChildrenListPage children={mockChildren} />);
    
    // Assert - 各園児に連絡と履歴ボタンが表示されること
    const contactButtons = screen.getAllByText('連絡');
    const historyButtons = screen.getAllByText('履歴');
    
    expect(contactButtons).toHaveLength(3);
    expect(historyButtons).toHaveLength(3);
  });

  it('should navigate to contact form when contact button clicked', () => {
    // Arrange
    const mockNavigate = vi.fn();
    render(<ChildrenListPage children={mockChildren} onNavigate={mockNavigate} />);
    
    // Act - 最初の園児の連絡ボタンをクリック
    const contactButton = screen.getAllByText('連絡')[0];
    fireEvent.click(contactButton);
    
    // Assert - 連絡フォームに遷移すること
    expect(mockNavigate).toHaveBeenCalledWith('/contact', {
      childId: '1',
      childName: '田中太郎'
    });
  });

  it('should navigate to history when history button clicked', () => {
    // Arrange
    const mockNavigate = vi.fn();
    render(<ChildrenListPage children={mockChildren} onNavigate={mockNavigate} />);
    
    // Act - 履歴ボタンをクリック
    const historyButton = screen.getAllByText('履歴')[0];
    fireEvent.click(historyButton);
    
    // Assert - 履歴画面に遷移すること
    expect(mockNavigate).toHaveBeenCalledWith('/contact-history', {
      childId: '1',
      childName: '田中太郎'
    });
  });
});

### 2.4 レポート機能 TDD (更新仕様対応)
```typescript
// 🔴 RED段階: レポートカードコンポーネントテスト
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ReportCard } from './ReportCard'; // まだ存在しない

describe('ReportCard (Updated Specifications)', () => {
  const mockReport = {
    id: 1,
    childName: '田中太郎',
    date: '2025-01-15',
    tags: ['活動', '食事'], // 複数タグ対応
    content: 'お絵描きを楽しみました。給食も完食しています。',
    isConfirmed: false,
    replyCount: 0
  };

  it('should render report with multiple tags', () => {
    // Arrange & Act - コンポーネントが存在しないため失敗
    render(<ReportCard report={mockReport} />);
    
    // Assert - タグアイコン表示確認
    expect(screen.getByText('🎨')).toBeInTheDocument(); // 活動アイコン
    expect(screen.getByText('🍽️')).toBeInTheDocument(); // 食事アイコン
    expect(screen.getByText('活動')).toBeInTheDocument();
    expect(screen.getByText('食事')).toBeInTheDocument();
  });

  it('should not display "園内レポート" title', () => {
    // Act
    render(<ReportCard report={mockReport} />);
    
    // Assert - タイトルが表示されないこと
    expect(screen.queryByText('園内レポート')).not.toBeInTheDocument();
  });

  it('should display separate confirmation and reply buttons', () => {
    // Act
    render(<ReportCard report={mockReport} />);
    
    // Assert - 別々のボタンが表示されること
    expect(screen.getByRole('button', { name: '確認' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '返信' })).toBeInTheDocument();
  });

  it('should allow reply after confirmation', async () => {
    // Arrange
    const mockOnConfirm = vi.fn();
    const mockOnReply = vi.fn();
    const confirmedReport = { ...mockReport, isConfirmed: true };
    
    render(
      <ReportCard 
        report={confirmedReport} 
        onConfirm={mockOnConfirm}
        onReply={mockOnReply}
      />
    );
    
    // Act & Assert - 確認済みでも返信ボタンが表示されること
    const replyButton = screen.getByRole('button', { name: '返信' });
    expect(replyButton).toBeInTheDocument();
    expect(replyButton).not.toBeDisabled();
  });

  it('should auto-confirm when replying', async () => {
    // Arrange
    const mockOnConfirm = vi.fn();
    const mockOnReply = vi.fn();
    
    render(
      <ReportCard 
        report={mockReport}
        onConfirm={mockOnConfirm}
        onReply={mockOnReply}
      />
    );
    
    // Act - 返信ボタンクリック
    fireEvent.click(screen.getByRole('button', { name: '返信' }));
    
    // Assert - 返信時に自動で確認も実行されること
    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith(mockReport.id);
      expect(mockOnReply).toHaveBeenCalledWith(mockReport.id);
    });
  });

  it('should not display report summary or counts', () => {
    // Act
    render(<ReportCard report={mockReport} />);
    
    // Assert - 概要や件数表示がないこと
    expect(screen.queryByText('総レポート数')).not.toBeInTheDocument();
    expect(screen.queryByText('未読レポート')).not.toBeInTheDocument();
    expect(screen.queryByText('レポート概要')).not.toBeInTheDocument();
  });

  // 6つの標準タグテスト
  const standardTags = [
    { tag: '活動', icon: '🎨' },
    { tag: '食事', icon: '🍽️' },
    { tag: '睡眠', icon: '😴' },
    { tag: 'ケガ', icon: '🩹' },
    { tag: '事故', icon: '⚠️' },
    { tag: '喧嘩', icon: '😤' }
  ];

  standardTags.forEach(({ tag, icon }) => {
    it(`should display correct icon for ${tag} tag`, () => {
      // Arrange
      const reportWithTag = { ...mockReport, tags: [tag] };
      
      // Act
      render(<ReportCard report={reportWithTag} />);
      
      // Assert
      expect(screen.getByText(icon)).toBeInTheDocument();
      expect(screen.getByText(tag)).toBeInTheDocument();
    });
  });
});

### 2.5 通知設定フック TDD
```typescript
// 🔴 RED段階: 通知設定フックテスト
import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useNotificationSettings } from './useNotificationSettings'; // まだ存在しない

describe('useNotificationSettings', () => {
  it('should initialize with default notification settings', () => {
    // Act - フックが存在しないため失敗
    const { result } = renderHook(() => useNotificationSettings());
    
    // Assert
    expect(result.current.settings).toEqual({
      pushNotificationsEnabled: true,
      reportNotificationsEnabled: true,
      absenceConfirmationEnabled: true,
      eventNotificationsEnabled: true,
      announcementNotificationsEnabled: true
    });
  });

  it('should disable sub-notifications when push notifications disabled', async () => {
    // Arrange
    const mockSettingsService = {
      updateSettings: vi.fn().mockResolvedValue({ success: true })
    };
    
    // Act
    const { result } = renderHook(() => useNotificationSettings(mockSettingsService));
    
    await act(async () => {
      await result.current.updateSetting('pushNotificationsEnabled', false);
    });
    
    // Assert - プッシュ通知無効時は全て無効になること
    expect(result.current.settings.pushNotificationsEnabled).toBe(false);
    expect(result.current.settings.reportNotificationsEnabled).toBe(false);
    expect(result.current.settings.absenceConfirmationEnabled).toBe(false);
    expect(result.current.settings.eventNotificationsEnabled).toBe(false);
    expect(result.current.settings.announcementNotificationsEnabled).toBe(false);
  });

  it('should allow individual sub-notification control when push enabled', async () => {
    // Arrange
    const { result } = renderHook(() => useNotificationSettings());
    
    // Act - 個別設定変更
    await act(async () => {
      await result.current.updateSetting('eventNotificationsEnabled', false);
    });
    
    // Assert - プッシュ通知有効時は個別制御可能
    expect(result.current.settings.pushNotificationsEnabled).toBe(true);
    expect(result.current.settings.eventNotificationsEnabled).toBe(false);
    expect(result.current.settings.reportNotificationsEnabled).toBe(true); // 他は影響なし
  });
});

// 🟢 GREEN段階: 最小実装
import { useState, useCallback } from 'react';

interface NotificationSettings {
  pushNotificationsEnabled: boolean;
  reportNotificationsEnabled: boolean;
  absenceConfirmationEnabled: boolean;
  eventNotificationsEnabled: boolean;
  announcementNotificationsEnabled: boolean;
}

export const useNotificationSettings = (settingsService?: SettingsService) => {
  const [settings, setSettings] = useState<NotificationSettings>({
    pushNotificationsEnabled: true,
    reportNotificationsEnabled: true,
    absenceConfirmationEnabled: true,
    eventNotificationsEnabled: true,
    announcementNotificationsEnabled: true
  });

  const updateSetting = useCallback(async (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings };
    
    if (key === 'pushNotificationsEnabled' && !value) {
      // プッシュ通知無効時は全て無効
      Object.keys(newSettings).forEach(k => {
        newSettings[k as keyof NotificationSettings] = false;
      });
    } else {
      newSettings[key] = value;
    }
    
    setSettings(newSettings);
    await settingsService?.updateSettings(newSettings);
  }, [settings, settingsService]);

  return {
    settings,
    updateSetting
  };
};
```

### 2.6 お知らせ通知機能 TDD (新機能)
```typescript
// 🔴 RED段階: お知らせ通知コンポーネントテスト
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { NotificationList } from './NotificationList'; // まだ存在しない

describe('NotificationList (Announcement Feature)', () => {
  const mockNotifications = [
    {
      id: 1,
      type: 'announcement',
      title: '緊急連絡',
      summary: '警報発令により本日は休園いたします',
      detail: '台風による警報発令のため、本日は安全を考慮し休園とさせていただきます。詳細は追ってご連絡いたします。',
      createdAt: '2025-01-15T08:00:00Z',
      isRead: false
    },
    {
      id: 2,
      type: 'report',
      title: '園内レポート',
      summary: '新しいレポートが投稿されました',
      createdAt: '2025-01-15T07:30:00Z',
      isRead: false
    },
    {
      id: 3,
      type: 'event',
      title: 'イベント通知',
      summary: '運動会の準備にご協力をお願いします',
      createdAt: '2025-01-15T07:00:00Z',
      isRead: true
    }
  ];

  it('should display notifications sorted by date descending', () => {
    // Act - コンポーネントが存在しないため失敗
    render(<NotificationList notifications={mockNotifications} />);
    
    // Assert - 日時降順で表示されること
    const notificationItems = screen.getAllByTestId('notification-item');
    expect(notificationItems).toHaveLength(3);
    
    // 最新のお知らせが最上位
    expect(notificationItems[0]).toHaveTextContent('緊急連絡');
    expect(notificationItems[1]).toHaveTextContent('園内レポート');
    expect(notificationItems[2]).toHaveTextContent('イベント通知');
  });

  it('should show announcement detail in dialog when tapped', async () => {
    // Arrange
    render(<NotificationList notifications={mockNotifications} />);
    
    // Act - お知らせ通知をタップ
    const announcementItem = screen.getByText('緊急連絡');
    fireEvent.click(announcementItem);
    
    // Assert - ダイアログで詳細表示
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('台風による警報発令のため、本日は安全を考慮し休園とさせていただきます')).toBeInTheDocument();
    });
  });

  it('should show navigation message for non-announcement notifications', async () => {
    // Arrange
    render(<NotificationList notifications={mockNotifications} />);
    
    // Act - レポート通知をタップ
    const reportItem = screen.getByText('園内レポート');
    fireEvent.click(reportItem);
    
    // Assert - 画面遷移メッセージ表示
    await waitFor(() => {
      expect(screen.getByText('各画面で確認してください')).toBeInTheDocument();
    });
  });

  it('should display only summary for announcements in list', () => {
    // Act
    render(<NotificationList notifications={mockNotifications} />);
    
    // Assert - お知らせは概要のみ表示
    expect(screen.getByText('警報発令により本日は休園いたします')).toBeInTheDocument();
    expect(screen.queryByText('台風による警報発令のため')).not.toBeInTheDocument(); // 詳細は非表示
  });
});
```

### 2.7 レポートフィルター TDD
```typescript
// 🔴 RED段階: レポートフィルターテスト
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ReportFilter } from './ReportFilter'; // まだ存在しない

describe('ReportFilter (Simplified)', () => {
  it('should render only date range and content search filters', () => {
    // Arrange
    const mockOnFilter = vi.fn();
    
    // Act - コンポーネントが存在しないため失敗
    render(<ReportFilter onFilter={mockOnFilter} />);
    
    // Assert - 日付範囲と内容検索のみ表示
    expect(screen.getByLabelText('開始日')).toBeInTheDocument();
    expect(screen.getByLabelText('終了日')).toBeInTheDocument();
    expect(screen.getByLabelText('内容検索')).toBeInTheDocument();
    
    // 削除されたフィルター項目が表示されないこと
    expect(screen.queryByLabelText('レポート種別')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('ステータス')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('子ども')).not.toBeInTheDocument();
  });

  it('should trigger filter on date range change', () => {
    // Arrange
    const mockOnFilter = vi.fn();
    render(<ReportFilter onFilter={mockOnFilter} />);
    
    // Act - 日付範囲変更
    fireEvent.change(screen.getByLabelText('開始日'), { target: { value: '2025-01-01' } });
    fireEvent.change(screen.getByLabelText('終了日'), { target: { value: '2025-01-31' } });
    
    // Assert
    expect(mockOnFilter).toHaveBeenCalledWith({
      startDate: '2025-01-01',
      endDate: '2025-01-31',
      contentSearch: ''
    });
  });

  it('should trigger filter on content search', () => {
    // Arrange
    const mockOnFilter = vi.fn();
    render(<ReportFilter onFilter={mockOnFilter} />);
    
    // Act - 内容検索
    fireEvent.change(screen.getByLabelText('内容検索'), { target: { value: '給食' } });
    
    // Assert
    expect(mockOnFilter).toHaveBeenCalledWith({
      startDate: '',
      endDate: '',
      contentSearch: '給食'
    });
  });
});
```

## 3. バックエンド TDD実装

### 3.1 欠席・遅刻・お迎え連絡サービス TDD (新機能)
```csharp
// 🔴 RED段階: 連絡通知サービステスト
using Xunit;
using Moq;
using FluentAssertions;

public class ContactNotificationServiceTests
{
    [Fact]
    public async Task SendContactNotificationAsync_ValidAbsence_ShouldReturnSuccess()
    {
        // Arrange - サービスはまだ存在しない
        var mockRepository = new Mock<IContactNotificationRepository>();
        var mockNotificationService = new Mock<INotificationService>();
        
        var service = new ContactNotificationService(mockRepository.Object, mockNotificationService.Object);
        var notification = new ContactNotificationRequest
        {
            ChildId = 1,
            Type = ContactType.Absence,
            Date = DateTime.Today.AddDays(1),
            Reason = "発熱のため",
            AdditionalNotes = "午後には回復予定です"
        };
        
        // Act
        var result = await service.SendContactNotificationAsync(notification);
        
        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();
        result.ContactId.Should().NotBeNull();
        
        mockRepository.Verify(x => x.SaveAsync(It.IsAny<ContactNotification>()), Times.Once);
        mockNotificationService.Verify(x => x.SendStaffNotificationAsync(It.IsAny<StaffNotificationRequest>()), Times.Once);
    }

    [Fact]
    public async Task SendContactNotificationAsync_PickupWithoutPersonAndTime_ShouldFail()
    {
        // Arrange
        var service = new ContactNotificationService(null, null);
        var notification = new ContactNotificationRequest
        {
            ChildId = 1,
            Type = ContactType.Pickup,
            Date = DateTime.Today,
            Reason = "早退のため"
            // PickupPerson and PickupTime not provided
        };
        
        // Act
        var result = await service.SendContactNotificationAsync(notification);
        
        // Assert
        result.Success.Should().BeFalse();
        result.ErrorMessage.Should().Contain("お迎え連絡の場合、お迎え者と時間を入力してください");
    }

    [Theory]
    [InlineData(ContactType.Absence)]
    [InlineData(ContactType.Tardiness)]
    [InlineData(ContactType.Pickup)]
    public async Task SendContactNotificationAsync_DifferentTypes_ShouldSetCorrectStatus(ContactType type)
    {
        // Arrange
        var mockRepository = new Mock<IContactNotificationRepository>();
        var service = new ContactNotificationService(mockRepository.Object, null);
        var request = new ContactNotificationRequest 
        { 
            Type = type, 
            Reason = "Test",
            PickupPerson = type == ContactType.Pickup ? "母" : null,
            PickupTime = type == ContactType.Pickup ? TimeSpan.FromHours(15) : null
        };
        
        // Act
        var result = await service.SendContactNotificationAsync(request);
        
        // Assert - 種別により適切なステータスが設定されること
        result.Success.Should().BeTrue();
        mockRepository.Verify(x => x.SaveAsync(It.Is<ContactNotification>(cn => 
            cn.Type == type && cn.Status == ContactNotificationStatus.Submitted
        )), Times.Once);
    }

    [Fact]
    public async Task GetContactHistoryAsync_ShouldReturnSortedByDateDescending()
    {
        // Arrange
        var mockRepository = new Mock<IContactNotificationRepository>();
        var service = new ContactNotificationService(mockRepository.Object, null);
        
        var contacts = new[]
        {
            new ContactNotification { Id = 1, Date = DateTime.Today, CreatedAt = DateTime.UtcNow.AddHours(-1) },
            new ContactNotification { Id = 2, Date = DateTime.Today.AddDays(-1), CreatedAt = DateTime.UtcNow.AddHours(-2) },
            new ContactNotification { Id = 3, Date = DateTime.Today.AddDays(-2), CreatedAt = DateTime.UtcNow.AddHours(-3) }
        };
        
        mockRepository.Setup(x => x.GetByChildIdAsync(1))
                      .ReturnsAsync(contacts);
        
        // Act
        var result = await service.GetContactHistoryAsync(1);
        
        // Assert - 日付降順でソートされること
        result.Should().NotBeNull();
        result.Should().BeInDescendingOrder(x => x.Date);
        result.First().Id.Should().Be(1); // 最新が最上位
    }
}

### 3.2 お知らせサービス TDD (新機能)
```csharp
// 🔴 RED段階: お知らせサービステスト
using Xunit;
using Moq;
using FluentAssertions;

public class AnnouncementServiceTests
{
    [Fact]
    public async Task CreateAnnouncementAsync_ValidData_ShouldReturnSuccess()
    {
        // Arrange - サービスはまだ存在しない
        var mockRepository = new Mock<IAnnouncementRepository>();
        var mockNotificationService = new Mock<INotificationService>();
        
        var service = new AnnouncementService(mockRepository.Object, mockNotificationService.Object);
        var announcement = new CreateAnnouncementRequest
        {
            Type = AnnouncementType.Emergency,
            Title = "緊急連絡",
            Summary = "警報発令により本日は休園いたします",
            Detail = "台風による警報発令のため、本日は安全を考慮し休園とさせていただきます。",
            TargetType = TargetType.AllParents
        };
        
        // Act
        var result = await service.CreateAnnouncementAsync(announcement);
        
        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();
        result.AnnouncementId.Should().NotBeNull();
        
        mockRepository.Verify(x => x.SaveAsync(It.IsAny<Announcement>()), Times.Once);
        mockNotificationService.Verify(x => x.SendPushNotificationAsync(It.IsAny<PushNotificationRequest>()), Times.Once);
    }

    [Theory]
    [InlineData(AnnouncementType.Emergency)]
    [InlineData(AnnouncementType.CooperationRequest)]
    [InlineData(AnnouncementType.General)]
    public async Task CreateAnnouncementAsync_DifferentTypes_ShouldSetCorrectPriority(AnnouncementType type)
    {
        // Arrange
        var service = new AnnouncementService(null, null);
        var request = new CreateAnnouncementRequest { Type = type, Title = "Test", Summary = "Test" };
        
        // Act
        var result = await service.CreateAnnouncementAsync(request);
        
        // Assert - 種別により優先度が設定されること
        var expectedPriority = type == AnnouncementType.Emergency ? Priority.High :
                              type == AnnouncementType.CooperationRequest ? Priority.Medium : Priority.Low;
        
        // 実装で確認される内容
        result.Priority.Should().Be(expectedPriority);
    }
}

// 🔴 RED段階: 通知統合サービステスト
public class NotificationListServiceTests
{
    [Fact]
    public async Task GetNotificationListAsync_ShouldReturnSortedByDateDescending()
    {
        // Arrange - サービスはまだ存在しない
        var mockSmsProvider = new Mock<ISmsProvider>();
        var mockCodeGenerator = new Mock<IAuthCodeGenerator>();
        var mockRepository = new Mock<ISmsAuthRepository>();
        
        mockCodeGenerator.Setup(x => x.Generate()).Returns("123456");
        mockSmsProvider.Setup(x => x.SendAsync(It.IsAny<string>(), It.IsAny<string>()))
                      .ReturnsAsync(true);
        
        var service = new SmsAuthenticationService(
            mockSmsProvider.Object, 
            mockCodeGenerator.Object, 
            mockRepository.Object);
        
        // Act
        var result = await service.SendAuthCodeAsync("+81-90-1234-5678");
        
        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();
        result.CodeId.Should().NotBeNull();
        
        mockSmsProvider.Verify(x => x.SendAsync(
            "+81-90-1234-5678", 
            "認証コード: 123456"), Times.Once);
        mockRepository.Verify(x => x.SaveAsync(It.IsAny<SmsAuthCode>()), Times.Once);
    }

    {
        // Arrange
        var mockAnnouncementRepo = new Mock<IAnnouncementRepository>();
        var mockReportRepo = new Mock<IReportRepository>();
        var mockEventRepo = new Mock<IEventRepository>();
        
        var service = new NotificationListService(mockAnnouncementRepo.Object, mockReportRepo.Object, mockEventRepo.Object);
        
        var announcements = new[] {
            new Notification { Id = 1, Type = NotificationType.Announcement, CreatedAt = DateTime.UtcNow.AddHours(-1) },
            new Notification { Id = 2, Type = NotificationType.Report, CreatedAt = DateTime.UtcNow.AddHours(-2) },
            new Notification { Id = 3, Type = NotificationType.Event, CreatedAt = DateTime.UtcNow.AddHours(-3) }
        };
        
        mockAnnouncementRepo.Setup(x => x.GetNotificationsAsync(It.IsAny<string>()))
                           .ReturnsAsync(announcements.Where(x => x.Type == NotificationType.Announcement));
        
        // Act
        var result = await service.GetNotificationListAsync("user123");
        
        // Assert - 日時降順でソートされること
        result.Should().NotBeNull();
        result.Should().BeInDescendingOrder(x => x.CreatedAt);
        result.First().Id.Should().Be(1); // 最新が最上位
    }
    
    [Fact]  
    public async Task GetAnnouncementDetailAsync_ValidId_ShouldReturnDetail()
    {
    {
        // Arrange
        var mockRepository = new Mock<IAnnouncementRepository>();
        var service = new NotificationListService(mockRepository.Object, null, null);
        
        var announcement = new AnnouncementDetail
        {
            Id = 1,
            Title = "緊急連絡",
            Summary = "警報発令により本日は休園いたします",
            Detail = "台風による警報発令のため、本日は安全を考慮し休園とさせていただきます。詳細は追ってご連絡いたします。",
            Type = AnnouncementType.Emergency,
            CreatedAt = DateTime.UtcNow
        };
        
        mockRepository.Setup(x => x.GetDetailAsync(1)).ReturnsAsync(announcement);
        
        // Act
        var result = await service.GetAnnouncementDetailAsync(1);
        
        // Assert
        result.Should().NotBeNull();
        result.Title.Should().Be("緊急連絡");
        result.Detail.Should().Contain("台風による警報発令のため");
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData(null)]
    public async Task SendAuthCodeAsync_NullOrEmptyPhoneNumber_ShouldThrowArgumentException(string phoneNumber)
    {
        // Arrange
        var service = new SmsAuthenticationService(null, null, null);
        
        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(() => 
            service.SendAuthCodeAsync(phoneNumber));
    }
}

// 🟢 GREEN段階: 最小実装
public class SmsAuthenticationService : ISmsAuthenticationService
{
    private readonly ISmsProvider _smsProvider;
    private readonly IAuthCodeGenerator _codeGenerator;
    private readonly ISmsAuthRepository _repository;

    public SmsAuthenticationService(
        ISmsProvider smsProvider,
        IAuthCodeGenerator codeGenerator,
        ISmsAuthRepository repository)
    {
        _smsProvider = smsProvider;
        _codeGenerator = codeGenerator;
        _repository = repository;
    }

    public async Task<SmsAuthResult> SendAuthCodeAsync(string phoneNumber)
    {
        // バリデーション
        if (string.IsNullOrWhiteSpace(phoneNumber))
            throw new ArgumentException("電話番号が必要です", nameof(phoneNumber));

        if (!IsValidPhoneNumber(phoneNumber))
            return new SmsAuthResult { Success = false, ErrorMessage = "無効な電話番号です" };

        // 認証コード生成
        var code = _codeGenerator.Generate();
        var authCode = new SmsAuthCode
        {
            PhoneNumber = phoneNumber,
            Code = code,
            ExpiresAt = DateTime.UtcNow.AddMinutes(5),
            CreatedAt = DateTime.UtcNow
        };

        // データベース保存
        await _repository.SaveAsync(authCode);

        // SMS送信
        var message = $"認証コード: {code}";
        var sent = await _smsProvider.SendAsync(phoneNumber, message);

        if (!sent)
            return new SmsAuthResult { Success = false, ErrorMessage = "SMS送信に失敗しました" };

        return new SmsAuthResult 
        { 
            Success = true, 
            CodeId = authCode.Id.ToString() 
        };
    }

    private bool IsValidPhoneNumber(string phoneNumber)
    {
        // 簡易バリデーション（リファクタ段階で改善）
        return phoneNumber.StartsWith("+81") && phoneNumber.Length >= 13;
    }
}
```

### 3.3 レポートサービス TDD (更新仕様)
```csharp
// 🔴 RED段階: レポートサービステスト
public class ReportServiceTests
{
    [Fact]
    public async Task CreateReportAsync_WithMultipleTags_ShouldSaveCorrectly()
    {
        // Arrange - サービスが複数タグ対応していない状態
        var mockRepository = new Mock<IReportRepository>();
        var service = new ReportService(mockRepository.Object);
        
        var reportRequest = new CreateReportRequest
        {
            ChildId = 1,
            Content = "お絵描きを楽しみました。給食も完食しています。",
            Tags = new[] { "活動", "食事" }, // 複数タグ
            Date = DateTime.Today
        };
        
        // Act
        var result = await service.CreateReportAsync(reportRequest);
        
        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();
        
        mockRepository.Verify(x => x.SaveAsync(It.Is<DailyReport>(r => 
            r.Tags.Contains("活動") && r.Tags.Contains("食事")
        )), Times.Once);
    }
    
    [Theory]
    [InlineData("活動")]
    [InlineData("食事")]
    [InlineData("睡眠")]
    [InlineData("ケガ")]
    [InlineData("事故")]
    [InlineData("喧嘩")]
    public async Task CreateReportAsync_WithStandardTags_ShouldAcceptValidTags(string tag)
    {
        // Arrange
        var service = new ReportService(null);
        var request = new CreateReportRequest { Tags = new[] { tag } };
        
        // Act & Assert - 6つの標準タグのみ受け入れること
        var result = await service.CreateReportAsync(request);
        result.Success.Should().BeTrue();
    }
    
    [Fact]
    public async Task ConfirmReportAsync_ShouldNotRequireReply()
    {
        // Arrange - 確認機能が返信要求と分離されている状態
        var mockRepository = new Mock<IReportRepository>();
        var service = new ReportService(mockRepository.Object);
        
        // Act - 確認のみ実行
        var result = await service.ConfirmReportAsync(1, "user123");
        
        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();
        
        mockRepository.Verify(x => x.UpdateConfirmationAsync(1, "user123", true), Times.Once);
        // 返信要求は実行されないこと
        mockRepository.Verify(x => x.UpdateReplyRequiredAsync(It.IsAny<int>(), It.IsAny<bool>()), Times.Never);
    }
    
    [Fact]
    public async Task ReplyToReportAsync_ShouldAutoConfirm()
    {
        // Arrange
        var mockRepository = new Mock<IReportRepository>();
        var service = new ReportService(mockRepository.Object);
        
        var replyRequest = new ReportReplyRequest
        {
            ReportId = 1,
            UserId = "user123",
            Content = "ありがとうございます。"
        };
        
        // Act - 返信実行
        var result = await service.ReplyToReportAsync(replyRequest);
        
        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();
        
        // 返信時に自動確認されること
        mockRepository.Verify(x => x.UpdateConfirmationAsync(1, "user123", true), Times.Once);
        mockRepository.Verify(x => x.SaveReplyAsync(It.IsAny<ReportReply>()), Times.Once);
    }
}

### 3.4 APIコントローラー TDD (更新仕様対応)
```csharp
// 🔴 RED段階: お知らせコントローラーテスト
public class AnnouncementControllerTests
{
    [Fact]
    public async Task CreateAnnouncement_ValidRequest_ShouldReturnOk()
    {
    {
        // Arrange
        var mockService = new Mock<IAnnouncementService>();
        var controller = new AnnouncementController(mockService.Object);
        var request = new CreateAnnouncementRequest 
        { 
            Type = AnnouncementType.Emergency,
            Title = "緊急連絡",
            Summary = "警報発令により本日は休園いたします",
            Detail = "台風による警報発令のため、安全を考慮し休園とします。"
        };
        
        mockService.Setup(x => x.CreateAnnouncementAsync(request))
                   .ReturnsAsync(new AnnouncementResult { Success = true, AnnouncementId = 1 });
        
        // Act - コントローラーはまだ存在しない
        var result = await controller.CreateAnnouncement(request);
        
        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        okResult.Value.Should().BeEquivalentTo(new 
        { 
            success = true, 
            data = new { announcementId = 1, message = "お知らせを作成しました" }
        });
    }

    
    [Fact]
    public async Task GetNotificationList_ShouldReturnSortedNotifications()
    {
        // Arrange
        var mockService = new Mock<INotificationListService>();
        var controller = new NotificationController(mockService.Object);
        
        var notifications = new[]
        {
            new NotificationSummary { Id = 1, Type = "announcement", Title = "緊急連絡", CreatedAt = DateTime.UtcNow },
            new NotificationSummary { Id = 2, Type = "report", Title = "園内レポート", CreatedAt = DateTime.UtcNow.AddHours(-1) }
        };
        
        mockService.Setup(x => x.GetNotificationListAsync("user123"))
                   .ReturnsAsync(notifications);
        
        // Act
        var result = await controller.GetNotificationList("user123");
        
        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        okResult.Value.Should().BeEquivalentTo(new 
        { 
            success = true, 
            data = notifications 
        });
    }
    
    [Fact]
    public async Task GetAnnouncementDetail_ValidId_ShouldReturnDetail()
    {
        // Arrange
        var mockService = new Mock<INotificationListService>();
        var controller = new NotificationController(mockService.Object);
        
        var detail = new AnnouncementDetail
        {
            Id = 1,
            Title = "緊急連絡",
            Summary = "警報発令により本日は休園いたします",
            Detail = "台風による警報発令のため、詳細内容..."
        };
        
        mockService.Setup(x => x.GetAnnouncementDetailAsync(1))
                   .ReturnsAsync(detail);
        
        // Act
        var result = await controller.GetAnnouncementDetail(1);
        
        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        okResult.Value.Should().BeEquivalentTo(new { success = true, data = detail });
    }
}

// 🟢 GREEN段階: 最小実装
[ApiController]
[Route("api/v1/[controller]")]
public class AnnouncementController : ControllerBase
{
    private readonly IAnnouncementService _announcementService;

    public AnnouncementController(IAnnouncementService announcementService)
    {
        _announcementService = announcementService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateAnnouncement([FromBody] CreateAnnouncementRequest request)
    {
        try
        {
            var result = await _announcementService.CreateAnnouncementAsync(request);
            
            if (!result.Success)
            {
                return BadRequest(new 
                { 
                    success = false, 
                    error = new { message = result.ErrorMessage }
                });
            }

            return Ok(new 
            { 
                success = true, 
                data = new 
                { 
                    announcementId = result.AnnouncementId,
                    message = "お知らせを作成しました" 
                }
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new 
            { 
                success = false, 
                error = new { message = ex.Message }
            });
        }
    }
}

[ApiController]
[Route("api/v1/[controller]")]
public class NotificationController : ControllerBase
{
    private readonly INotificationListService _notificationService;

    public NotificationController(INotificationListService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpGet("list/{userId}")]
    public async Task<IActionResult> GetNotificationList(string userId)
    {
        var notifications = await _notificationService.GetNotificationListAsync(userId);
        
        return Ok(new 
        { 
            success = true, 
            data = notifications
        });
    }
    
    [HttpGet("announcement/{id}/detail")]
    public async Task<IActionResult> GetAnnouncementDetail(int id)
    {
        var detail = await _notificationService.GetAnnouncementDetailAsync(id);
        
        if (detail == null)
        {
            return NotFound(new { success = false, error = new { message = "お知らせが見つかりません" } });
        }
        
        return Ok(new { success = true, data = detail });
    }
}
```

## 4. E2Eテスト TDD

### 4.1 欠席・遅刻・お迎え連絡E2E TDD (新機能)
```typescript
// 🔴 RED段階: 連絡機能E2Eテスト
import { test, expect } from '@playwright/test';

test.describe('Contact Notification System', () => {
  test.beforeEach(async ({ page }) => {
    // ログイン状態でテスト開始
    await page.goto('/login');
    await page.getByLabel('電話番号').fill('+81-90-1234-5678');
    await page.getByRole('button', { name: '認証コード送信' }).click();
    await page.getByLabel('認証コード').fill('123456');
    await page.getByRole('button', { name: 'ログイン' }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display children list with contact buttons', async ({ page }) => {
    // Arrange - この時点では園児一覧機能が未実装のため失敗
    await page.goto('/children');
    
    // Act & Assert - 園児一覧が表示されること
    await expect(page.getByText('田中太郎')).toBeVisible();
    await expect(page.getByText('ひまわり組')).toBeVisible();
    
    // 連絡・履歴ボタンが表示されること
    await expect(page.getByRole('button', { name: '連絡' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: '履歴' }).first()).toBeVisible();
    
    // 統計情報が表示されないこと
    await expect(page.getByText('総園児数')).not.toBeVisible();
  });

  test('should navigate to contact form and submit absence notification', async ({ page }) => {
    // Arrange
    await page.goto('/children');
    
    // Act - 連絡ボタンをクリック
    await page.getByRole('button', { name: '連絡' }).first().click();
    
    // Assert - 連絡フォームに遷移すること
    await expect(page).toHaveURL(/\/contact\?childId=.*&childName=.*/);
    await expect(page.getByText('園への連絡')).toBeVisible();
    
    // Act - 欠席連絡を入力・送信
    await page.getByLabel('連絡種別').selectOption('absence');
    await page.getByLabel('対象日').fill('2025-01-20');
    await page.getByLabel('理由').fill('発熱のため');
    await page.getByRole('button', { name: '送信する' }).click();
    
    // Assert - 送信完了画面が表示されること
    await expect(page.getByText('送信完了')).toBeVisible();
    await expect(page.getByText('連絡メッセージが正常に送信されました。')).toBeVisible();
  });

  test('should handle pickup notification with required fields', async ({ page }) => {
    // Arrange
    await page.goto('/contact?childId=1&childName=田中太郎');
    
    // Act - お迎え連絡を選択
    await page.getByLabel('連絡種別').selectOption('pickup');
    
    // Assert - お迎え関連フィールドが表示されること
    await expect(page.getByLabel('お迎え者')).toBeVisible();
    await expect(page.getByLabel('お迎え時間')).toBeVisible();
    
    // Act - 必要な情報を入力して送信
    await page.getByLabel('お迎え者').fill('母');
    await page.getByLabel('お迎え時間').fill('15:00');
    await page.getByLabel('理由').fill('早退のため');
    await page.getByRole('button', { name: '送信する' }).click();
    
    // Assert - 送信成功
    await expect(page.getByText('送信完了')).toBeVisible();
  });

  test('should display contact history', async ({ page }) => {
    // Arrange
    await page.goto('/children');
    
    // Act - 履歴ボタンをクリック
    await page.getByRole('button', { name: '履歴' }).first().click();
    
    // Assert - 履歴画面に遷移すること
    await expect(page).toHaveURL(/\/contact-history\?childId=.*&childName=.*/);
    await expect(page.getByText('連絡履歴')).toBeVisible();
    
    // 履歴が日付降順で表示されること
    const historyItems = page.locator('[data-testid="contact-history-item"]');
    await expect(historyItems.first()).toContainText('2025-01-15');
    await expect(historyItems.nth(1)).toContainText('2025-01-14');
  });
});

### 4.2 レポート機能E2E TDD (更新仕様)
```typescript
// 🔴 RED段階: レポート機能E2Eテスト
import { test, expect } from '@playwright/test';

test.describe('Report System (Updated Specifications)', () => {
  test.beforeEach(async ({ page }) => {
    // ログイン状態でテスト開始
    await page.goto('/login');
    await page.getByLabel('電話番号').fill('+81-90-1234-5678');
    await page.getByRole('button', { name: '認証コード送信' }).click();
    await page.getByLabel('認証コード').fill('123456');
    await page.getByRole('button', { name: 'ログイン' }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display report with multiple tags', async ({ page }) => {
    // Arrange - この時点ではタグ機能が未実装のため失敗
    await page.goto('/reports');
    
    // Act & Assert - 複数タグ表示テスト
    // タグアイコンとテキストが表示されること
    await expect(page.locator('[data-testid="tag-icon-活動"]')).toHaveText('🎨');
    await expect(page.locator('[data-testid="tag-text-活動"]')).toHaveText('活動');
    await expect(page.locator('[data-testid="tag-icon-食事"]')).toHaveText('🍽️');
    await expect(page.locator('[data-testid="tag-text-食事"]')).toHaveText('食事');
    
    // "園内レポート"タイトルが表示されないこと
    await expect(page.getByText('園内レポート')).not.toBeVisible();
  });

  test('should handle separate confirmation and reply buttons', async ({ page }) => {
    // Arrange
    await page.goto('/reports');
    
    // Act & Assert - 別々のボタンが表示されること
    const reportCard = page.locator('[data-testid="report-card"]).first();
    await expect(reportCard.getByRole('button', { name: '確認' })).toBeVisible();
    await expect(reportCard.getByRole('button', { name: '返信' })).toBeVisible();
    
    // 確認ボタンクリック
    await reportCard.getByRole('button', { name: '確認' }).click();
    
    // 確認後も返信ボタンが有効なこと
    await expect(reportCard.getByRole('button', { name: '返信' })).toBeEnabled();
  });

  test('should auto-confirm when replying', async ({ page }) => {
    // Arrange
    await page.goto('/reports');
    
    // Act - 返信ボタンを直接クリック(確認せずに)
    const reportCard = page.locator('[data-testid="report-card"]').first();
    await reportCard.getByRole('button', { name: '返信' }).click();
    
    // 返信フォーム入力
    await page.getByLabel('返信内容').fill('ありがとうございます。');
    await page.getByRole('button', { name: '送信' }).click();
    
    // Assert - 返信時に自動で確認されること
    await expect(reportCard.locator('[data-testid="confirmation-status"]')).toHaveText('確認済み');
  });

  test('should filter reports by date range and content', async ({ page }) => {
    // Arrange
    await page.goto('/reports');
    
    // Act - フィルター操作
    await page.getByLabel('開始日').fill('2025-01-01');
    await page.getByLabel('終了日').fill('2025-01-31');
    await page.getByLabel('内容検索').fill('給食');
    await page.getByRole('button', { name: '絞り込み' }).click();
    
    // Assert - 絞り込み結果が表示されること
    const filteredReports = page.locator('[data-testid="report-card"]');
    await expect(filteredReports).toHaveCount(2); // フィルター結果
    await expect(page.getByText('給食')).toBeVisible();
    
    // 削除されたフィルター項目が表示されないこと
    await expect(page.getByLabel('レポート種別')).not.toBeVisible();
    await expect(page.getByLabel('ステータス')).not.toBeVisible();
  });

  // 6つの標準タグアイコンテスト
  const standardTags = [
    { tag: '活動', icon: '🎨' },
    { tag: '食事', icon: '🍽️' },
    { tag: '睡眠', icon: '😴' },
    { tag: 'ケガ', icon: '🩹' },
    { tag: '事故', icon: '⚠️' },
    { tag: '喧嘩', icon: '😤' }
  ];

  standardTags.forEach(({ tag, icon }) => {
    test(`should display correct icon for ${tag} tag`, async ({ page }) => {
      // Arrange
      await page.goto('/reports');
      
      // Act & Assert - 各タグのアイコンが正しく表示されること
      await expect(page.locator(`[data-testid="tag-icon-${tag}"]`)).toHaveText(icon);
      await expect(page.locator(`[data-testid="tag-text-${tag}"]`)).toHaveText(tag);
    });
  });
});

### 4.3 通知機能E2E TDD (新機能)
```typescript
// 🔴 RED段階: 通知機能E2Eテスト
test.describe('Notification System (New Features)', () => {
  test.beforeEach(async ({ page }) => {
    // ログイン状態でテスト開始
    await page.goto('/login');
    await page.getByLabel('電話番号').fill('+81-90-1234-5678');
    await page.getByRole('button', { name: '認証コード送信' }).click();
    await page.getByLabel('認証コード').fill('123456');
    await page.getByRole('button', { name: 'ログイン' }).click();
  });

  test('should display unified notification list sorted by date', async ({ page }) => {
    // Arrange - この時点では通知一覧機能が未実装のため失敗
    await page.goto('/notifications');
    
    // Act & Assert - 通知一覧が日時降順で表示されること
    const notificationItems = page.locator('[data-testid="notification-item"]');
    await expect(notificationItems).toHaveCount(3);
    
    // 最新のお知らせが最上位
    await expect(notificationItems.first()).toContainText('緊急連絡');
    await expect(notificationItems.nth(1)).toContainText('園内レポート');
    await expect(notificationItems.nth(2)).toContainText('イベント通知');
  });

  test('should show announcement detail in dialog', async ({ page }) => {
    // Arrange
    await page.goto('/notifications');
    
    // Act - お知らせ通知をタップ
    const announcementItem = page.getByText('緊急連絡');
    await announcementItem.click();
    
    // Assert - ダイアログで詳細表示
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('台風による警報発令のため')).toBeVisible();
    await expect(page.getByRole('button', { name: '閉じる' })).toBeVisible();
  });

  test('should show navigation message for non-announcement notifications', async ({ page }) => {
    // Arrange
    await page.goto('/notifications');
    
    // Act - レポート通知をタップ
    const reportItem = page.getByText('園内レポート');
    await reportItem.click();
    
    // Assert - 画面遷移メッセージ表示
    await expect(page.getByText('各画面で確認してください')).toBeVisible();
    await expect(page.getByRole('button', { name: 'OK' })).toBeVisible();
  });

  test('should manage notification settings with hierarchical control', async ({ page }) => {
    // Arrange
    await page.goto('/settings/notifications');
    
    // Act - プッシュ通知を無効化
    const pushNotificationToggle = page.getByLabel('プッシュ通知');
    await pushNotificationToggle.uncheck();
    
    // Assert - 全てのサブ通知が無効化されること
    await expect(page.getByLabel('レポート通知')).toBeDisabled();
    await expect(page.getByLabel('欠席・遅刻確認通知')).toBeDisabled();
    await expect(page.getByLabel('イベント通知')).toBeDisabled();
    await expect(page.getByLabel('お知らせ通知')).toBeDisabled();
    
    // Act - プッシュ通知を再有効化
    await pushNotificationToggle.check();
    
    // Assert - 個別制御が可能になること
    await expect(page.getByLabel('イベント通知')).toBeEnabled();
    await page.getByLabel('イベント通知').uncheck();
    await expect(page.getByLabel('レポート通知')).toBeChecked(); // 他は影響なし
  });
});
```

### 4.4 オフライン機能E2E TDD (将来機能)
```typescript
// 🔴 RED段階: オフライン機能E2Eテスト
test.describe('Offline Functionality', () => {
  test('should cache reports for offline viewing', async ({ page, context }) => {
    // Arrange - オンライン状態でデータロード
    await page.goto('/reports');
    await expect(page.locator('[data-testid="report-card"]')).toHaveCount(5);
    
    // Act - ネットワークをオフラインに設定
    await context.setOffline(true);
    await page.reload();
    
    // Assert - キャッシュされたデータが表示されること
    await expect(page.getByText('オフラインモード')).toBeVisible();
    await expect(page.locator('[data-testid="report-card"]')).toHaveCount(5); // キャッシュデータ
  });

  test('should queue actions for sync when online', async ({ page, context }) => {
    // Arrange - オンライン状態で確認アクション
    await page.goto('/reports');
    
    // Act - オフラインで確認アクション実行
    await context.setOffline(true);
    const reportCard = page.locator('[data-testid="report-card"]').first();
    await reportCard.getByRole('button', { name: '確認' }).click();
    
    // Assert - オフラインキューに追加されること
    await expect(page.getByText('オフラインで確認しました。オンライン時に同期します。')).toBeVisible();
    
    // Act - オンラインに復帰
    await context.setOffline(false);
    await page.reload();
    
    // Assert - キューされたアクションが同期されること
    await expect(reportCard.locator('[data-testid="confirmation-status"]')).toHaveText('確認済み');
    await expect(page.getByText('同期完了')).toBeVisible();
  });

  test('should show sync status and offline indicator', async ({ page, context }) => {
    // Arrange
    await page.goto('/dashboard');
    
    // Act - オフラインに設定
    await context.setOffline(true);
    await page.reload();
    
    // Assert - オフラインインジケーターが表示されること
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    await expect(page.getByText('オフライン')).toBeVisible();
    
    // Act - オンラインに復帰
    await context.setOffline(false);
    
    // Assert - 同期ステータスが表示されること
    await expect(page.locator('[data-testid="sync-status"]')).toBeVisible();
    await expect(page.getByText('同期中')).toBeVisible();
  });
});
```

## 5. TDD実践ルール

### 5.1 チームTDD規約
```
📋 TDD実践規約 (必須遵守)

【開発フロー】
1. 機能要求 → テスト設計 → RED実装 → GREEN実装 → REFACTOR
2. 1つのテストにつき1つの振る舞いのみテスト
3. テスト名は振る舞いを明確に表現
4. 実装前にテストレビュー必須
5. GREEN段階では最小限の実装のみ

【コミットルール】  
1. REDコミット: 失敗するテストのみ
2. GREENコミット: テスト通過する実装
3. REFACTORコミット: 品質向上のみ
4. 各段階で必ずコミット
5. 失敗テストのままマージ禁止

【レビュールール】
1. テスト設計の妥当性確認
2. 実装の最小性確認  
3. リファクタリングの適切性確認
4. TDDサイクル遵守確認
5. 全テスト合格確認

【品質基準】
1. テストカバレッジ: >95%
2. テスト実行時間: <10分 (単体テスト)
3. テスト可読性: チーム全員が理解可能
4. テスト保守性: 要求変更に追従可能
5. テスト独立性: 他テストに依存しない
```

### 5.2 TDD違反対策
```
⚠️ TDD違反検出・防止策

【自動化チェック】
├── CI/CD でのテスト先行チェック
├── コミット前フックでのテスト実行
├── プルリクエストでの TDD 規約チェック
├── テストカバレッジ自動計測
└── コード品質自動解析

【チーム管理】
├── TDD ペアプログラミング
├── TDD モブプログラミング
├── TDD レトロスペクティブ
├── TDD 教育・研修
└── TDD メンター制度

【違反時対応】
├── 即座のレビューフィードバック
├── TDD 再学習機会提供
├── ペアプログラミングでのサポート
├── 違反原因分析・改善
└── チーム全体での振り返り
```

この TDD 実装ガイドにより、チーム全員が一貫した TDD 実践を行い、高品質で保守性の高いコードを継続的に作成できます。

## 6. 仕様変更対応テスト概要

### 6.1 更新された機能テストカバレッジ
```
📋 テストカバレッジ一覧 (仕様更新後)

● 欠席・遅刻・お迎え連絡機能 (0% → 95%)
  ├─ 連絡フォームテスト (3種類 + 条件付きフィールド)
  ├─ 園児一覧表示テスト (名前・クラスのみ + 統計削除)
  ├─ 連絡履歴テスト (日付降順ソート)
  ├─ バリデーションテスト (お迎え必須項目)
  └─ 送信完了テスト

● レポート機能 (75% → 95%)
  ├─ 複数タグ表示テスト (6種類×アイコン/テキスト)
  ├─ 確認/返信分離テスト (別々ボタン + 確認後返信可能)
  ├─ 返信時自動確認テスト
  ├─ タイトル非表示テスト ("園内レポート"削除)
  └─ 簡素化フィルターテスト (日付 + 内容検索のみ)

● 通知設定機能 (0% → 90%)
  ├─ 階層制御テスト (プッシュON/OFF→サブ通知全制御)
  ├─ 個別設定テスト (イベント/お知らせ/レポート/欠席確認)
  └─ 設定永続化テスト

● お知らせ通知機能 (0% → 85%)
  ├─ 編集/作成テスト (3種類: 緊急/協力依頼/一般)
  ├─ 通知一覧表示テスト (日時降順ソート)
  ├─ お知らせ詳細ダイアログテスト
  └─ 非お知らせナビゲーションテスト

● E2E統合テスト (60% → 90%)
  ├─ レポート機能統合テスト
  ├─ 通知機能統合テスト
  └─ オフライン機能テスト(将来)
```

### 6.2 テスト実行戦略
```
📝 テスト実行スケジュール

【Phase 1: コア機能テスト】 (Week 1-2)
1. 欠席・遅刻・お迎え連絡機能テスト完成
   - 連絡フォームコンポーネントテスト
   - 園児一覧テスト
   - バリデーションテスト

2. レポート機能テスト完成
   - 複数タグシステムテスト
   - 確認/返信分離テスト
   - UIコンポーネントテスト

2. 通知設定テスト完成
   - 階層制御ロジックテスト
   - 設定永続化テスト

【Phase 2: 新機能テスト】 (Week 3-4)
1. お知らせ機能テスト完成
   - サービスレイヤーテスト
   - APIコントローラーテスト
   - UI統合テスト

2. 統合テスト実行
   - E2Eシナリオテスト
   - クロスブラウザテスト

【Phase 3: パフォーマンス/リグレッション】 (Week 5)
1. パフォーマンステスト
2. リグレッションテスト完全実行
3. テストカバレッジ最終確認 (>95%)
```

この更新された TDD 実装ガイドにより、仕様変更を反映した包括的なテスト戦略で高品質なコードを継続的に作成できます。