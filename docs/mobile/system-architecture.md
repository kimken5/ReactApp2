# 保育園保護者向けモバイルアプリ - システム設計書

## 1. システムアーキテクチャ概要

### 1.1 アーキテクチャ原則
- **マイクロサービス指向**: 機能単位での独立性とスケーラビリティ
- **API First**: フロントエンドとバックエンドの完全分離
- **セキュリティ by Design**: 設計段階からのセキュリティ組み込み
- **スケーラビリティ**: 将来的な機能拡張とユーザー増加への対応
- **保守性**: 理解しやすく変更容易な設計

### 1.2 システム構成図

```
┌─────────────────────────────────────────────────────────────┐
│                    外部サービス                              │
├─────────────────┬─────────────────┬─────────────────────────┤
│  SMS Gateway    │  File Storage   │  Push Notification      │
│  (メディア4U)    │  (Azure Blob/   │  (Azure Hub)            │
│                 │   AWS S3)       │                         │
└─────────────────┴─────────────────┴─────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────┐
│                    CDN & Load Balancer                      │
│              (Azure Front Door / AWS CloudFront)           │
└─────────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway                           │
│        (Rate Limiting, Authentication, Routing)            │
└─────────────────────────────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│保護者モバイルアプリ│ │スタッフモバイルアプリ│ │   管理画面      │
│   (React PWA)   │ │   (React PWA)   │ │  (Admin Panel)  │
└─────────────────┘ └─────────────────┘ └─────────────────┘
                           │
┌─────────────────────────────────────────────────────────────┐
│                 ASP.NET Core Web API                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │Authentication│ │Notification │ │   Report    │           │
│  │   Service    │ │   Service   │ │  Service    │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │Announcement │ │   Photo     │ │   Calendar  │           │
│  │   Service   │ │  Service    │ │   Service   │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │Customization│ │   Staff     │ │File Storage │           │
│  │   Service   │ │  Service    │ │   Service   │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Attachment  │ │   Family    │ │   Settings  │           │
│  │   Service   │ │  Service    │ │   Service   │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────┐
│                    データベース層                            │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│ │   主データ   │ │  認証データ  │ │      キャッシュ        │ │
│ │ (SQL Server) │ │(SQL Server) │ │     (Redis)           │ │
│ └─────────────┘ └─────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 2. アーキテクチャ詳細設計

### 2.1 レイヤー構成

#### 2.1.0 レポート管理コンポーネント詳細設計

##### 2.1.0.1 フロントエンドコンポーネント構成

```typescript
// レポート一覧コンポーネント (/staff/reports)
interface ReportListComponent {
  // 状態管理
  reports: DailyReport[];
  filterStatus: 'all' | 'draft' | 'published';
  isLoading: boolean;

  // 機能
  fetchReports: (filter: ReportFilter) => Promise<void>;
  navigateToEdit: (reportId: number) => void;
  navigateToCreate: () => void;
  handleFilterChange: (status: string) => void;

  // UI表示項目
  // - ステータスフィルターボタン（全て/下書き/公開済み）
  // - レポートカードリスト（園児名、タイトル、カテゴリ、作成日時、ステータスバッジ）
  // - 新規作成ボタン（画面下部固定）
}

// レポート作成・編集コンポーネント（共通）
interface ReportCreateEditComponent {
  // Props
  mode: 'create' | 'edit';
  reportId?: number;

  // 状態管理
  selectedChild: ClassChild | null;
  reportContent: string;
  reportTags: string[];
  uploadedPhotos: string[];
  isSubmitting: boolean;
  isDraft: boolean;

  // 機能
  // 作成モード
  handleCreateDraft: () => Promise<void>;
  handleCreatePublished: () => Promise<void>;

  // 編集モード
  loadReportData: (reportId: number) => Promise<void>;
  handleUpdateDraft: () => Promise<void>;
  handleUpdatePublished: () => Promise<void>;
  handlePublishReport: () => Promise<void>;
  handleDeleteReport: () => Promise<void>;

  // 共通機能
  handleChildSelect: (child: ClassChild) => void;
  handleTagSelect: (tag: string) => void;
  handlePhotoUpload: (file: File) => Promise<void>;

  // UI表示項目
  // - 園児選択エリア（編集時は変更不可）
  // - タグ選択エリア
  // - コンテンツ入力エリア
  // - 写真アップロードエリア
  // - アクションボタン（下書き保存/公開/削除）
}

// データモデル
interface DailyReport {
  id: number;
  nurseryId: number;
  childId: number;
  staffId: number;
  reportDate: string;
  category: string;
  title: string;
  content: string;
  tags?: string;
  photos?: string;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

interface ReportFilter {
  status?: 'draft' | 'published';
  startDate?: string;
  endDate?: string;
}
```

##### 2.1.0.2 バックエンドサービス設計

```csharp
// レポート管理サービス実装
public class ReportService : IReportService
{
    private readonly NurseryDbContext _context;
    private readonly IFileStorageService _fileStorage;
    private readonly IAuthorizationService _authService;

    // スタッフレポート一覧取得（フィルター機能付き）
    public async Task<IEnumerable<DailyReport>> GetReportsForStaffAsync(
        int nurseryId,
        int staffId,
        ReportFilter filter)
    {
        var query = _context.DailyReports
            .Where(r => r.NurseryId == nurseryId && r.StaffId == staffId);

        // ステータスフィルター適用
        if (filter.Status.HasValue)
        {
            query = query.Where(r => r.Status == filter.Status.Value);
        }

        // 日付範囲フィルター適用
        if (filter.StartDate.HasValue)
        {
            query = query.Where(r => r.ReportDate >= filter.StartDate.Value);
        }
        if (filter.EndDate.HasValue)
        {
            query = query.Where(r => r.ReportDate <= filter.EndDate.Value);
        }

        return await query
            .Include(r => r.Child)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

    // レポート詳細取得（認可チェック付き）
    public async Task<DailyReport> GetReportByIdAsync(int reportId, int nurseryId, int staffId)
    {
        var report = await _context.DailyReports
            .Include(r => r.Child)
            .FirstOrDefaultAsync(r =>
                r.Id == reportId &&
                r.NurseryId == nurseryId &&
                r.StaffId == staffId);

        if (report == null)
        {
            throw new NotFoundException("レポートが見つかりません");
        }

        return report;
    }

    // レポート更新
    public async Task<DailyReport> UpdateReportAsync(int reportId, UpdateReportRequest request)
    {
        var report = await _context.DailyReports.FindAsync(reportId);
        if (report == null)
        {
            throw new NotFoundException("レポートが見つかりません");
        }

        // 権限チェック
        if (report.StaffId != request.StaffId || report.NurseryId != request.NurseryId)
        {
            throw new UnauthorizedException("このレポートを編集する権限がありません");
        }

        // 更新処理
        report.Title = request.Title;
        report.Content = request.Content;
        report.Category = request.Category;
        report.Tags = request.Tags;
        report.Photos = request.Photos;
        report.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return report;
    }

    // レポート削除（下書きのみ）
    public async Task<bool> DeleteReportAsync(int reportId, int nurseryId, int staffId)
    {
        var report = await _context.DailyReports.FindAsync(reportId);
        if (report == null)
        {
            throw new NotFoundException("レポートが見つかりません");
        }

        // 権限チェック
        if (report.StaffId != staffId || report.NurseryId != nurseryId)
        {
            throw new UnauthorizedException("このレポートを削除する権限がありません");
        }

        // 公開済みレポートの削除不可チェック
        if (report.Status == "published")
        {
            throw new BusinessRuleException("公開済みのレポートは削除できません");
        }

        // 関連する写真も削除
        if (!string.IsNullOrEmpty(report.Photos))
        {
            var photoUrls = JsonSerializer.Deserialize<string[]>(report.Photos);
            foreach (var photoUrl in photoUrls)
            {
                await _fileStorage.DeletePhotoAndThumbnailAsync(photoUrl);
            }
        }

        _context.DailyReports.Remove(report);
        await _context.SaveChangesAsync();
        return true;
    }

    // レポート公開（下書き→公開への変更）
    public async Task<bool> PublishReportAsync(int reportId, int nurseryId, int staffId)
    {
        var report = await _context.DailyReports.FindAsync(reportId);
        if (report == null)
        {
            throw new NotFoundException("レポートが見つかりません");
        }

        // 権限チェック
        if (report.StaffId != staffId || report.NurseryId != nurseryId)
        {
            throw new UnauthorizedException("このレポートを公開する権限がありません");
        }

        // 既に公開済みの場合
        if (report.Status == "published")
        {
            throw new BusinessRuleException("既に公開済みのレポートです");
        }

        // 公開処理
        report.Status = "published";
        report.PublishedAt = DateTime.UtcNow;
        report.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // プッシュ通知送信（保護者へ）
        // await _notificationService.NotifyParentsOfNewReport(report);

        return true;
    }
}
```

##### 2.1.0.3 ルーティング設計

```typescript
// React Router設定
const staffRoutes = [
  {
    path: '/staff/dashboard',
    element: <StaffDashboard />
  },
  {
    path: '/staff/reports',
    element: <ReportList />  // レポート一覧画面
  },
  {
    path: '/staff/reports/create',
    element: <ReportCreate mode="create" />  // 新規作成画面
  },
  {
    path: '/staff/reports/edit/:id',
    element: <ReportCreate mode="edit" />  // 編集画面（同じコンポーネント）
  }
];
```

##### 2.1.0.4 ビジネスルール実装

```csharp
// レポート削除ビジネスルール検証
public class ReportDeletionValidator
{
    public ValidationResult Validate(DailyReport report, int requestingStaffId)
    {
        var errors = new List<string>();

        // BR-RM-001: 公開されたレポートは削除できない
        if (report.Status == "published")
        {
            errors.Add("公開済みのレポートは削除できません。保護者が既に閲覧している可能性があります。");
        }

        // BR-RM-002: 作成者のみが削除可能
        if (report.StaffId != requestingStaffId)
        {
            errors.Add("他のスタッフが作成したレポートは削除できません。");
        }

        return new ValidationResult
        {
            IsValid = errors.Count == 0,
            Errors = errors
        };
    }
}

// レポート公開ビジネスルール検証
public class ReportPublishValidator
{
    public ValidationResult Validate(DailyReport report)
    {
        var errors = new List<string>();

        // 必須項目チェック
        if (string.IsNullOrWhiteSpace(report.Title))
        {
            errors.Add("タイトルは必須です。");
        }

        if (string.IsNullOrWhiteSpace(report.Content))
        {
            errors.Add("内容は必須です。");
        }

        // BR-RM-004: 下書きから公開への変更は取り消し不可
        if (report.Status == "published")
        {
            errors.Add("既に公開済みのレポートです。");
        }

        return new ValidationResult
        {
            IsValid = errors.Count == 0,
            Errors = errors
        };
    }
}
```


#### 2.1.1 プレゼンテーション層

##### フロントエンド技術スタック
```typescript
// React + TypeScript + Vite構成
interface FrontendTechStack {
  framework: "React 19.1";
  language: "TypeScript";
  bundler: "Vite";
  styling: "CSS-in-JS (Inline Styles)";
  icons: "React Icons (Material Design Icons)";
  routing: "React Router";
  stateManagement: "Context API + useReducer";
  httpClient: "Fetch API";
  formValidation: "Native HTML5 + Custom Logic";
}

// アイコンライブラリ仕様
interface IconSpecification {
  library: "react-icons/md"; // Material Design Icons
  usage: {
    import: "import { MdIconName } from 'react-icons/md'";
    standardSize: "16px | 20px | 24px | 32px";
    colorScheme: "#2563eb (Primary) | #64748b (Secondary) | #dc2626 (Error)";
  };
  commonIcons: {
    navigation: ["MdArrowBack", "MdHome", "MdMenu"];
    actions: ["MdSend", "MdEdit", "MdDelete", "MdRefresh"];
    content: ["MdMessage", "MdHistory", "MdDateRange", "MdAccessTime"];
    status: ["MdCheck", "MdWarning", "MdError", "MdInfo"];
  };
}
```

```csharp
// 保護者用モバイルアプリアーキテクチャ
public interface IParentMobileApp
{
    // コンポーネント構成
    - LoginComponent              // SMS認証
    - DashboardComponent          // ダッシュボード
    - ContactFormComponent        // 欠席・遅刻・お迎え連絡
    - CalendarComponent           // カレンダー・行事
    - ReportsComponent            // 園内報告受信
    - PhotoGalleryComponent       // 写真ギャラリー
    - FamilyManagementComponent   // 家族一覧・登録
    - CustomizationComponent      // カスタマイズ設定
}

// スタッフ用モバイルアプリアーキテクチャ
public interface IStaffMobileApp
{
    // コンポーネント構成
    - StaffLoginComponent         // スタッフ認証
    - StaffDashboardComponent     // スタッフダッシュボード
    - ContactNotificationComponent // 連絡通知受信・確認
    - ContactHistoryComponent     // 連絡履歴管理
    - ReportCreationComponent     // レポート作成（新規・編集共通）
    - ReportListComponent         // レポート一覧表示
    - ReportManagementComponent   // レポート編集・削除管理
    - PhotoUploadComponent        // 写真アップロード
    - CalendarComponent           // カレンダー閲覧（保護者用と共通、APIエンドポイントのみ異なる）
    - AnnouncementComponent       // クラスお知らせ作成
}

// 状態管理 (Context API + useReducer)
public interface IAppState
{
    User CurrentUser;
    Child[] Children;
    Report[] Reports;
    Photo[] Photos;
    Event[] Events;
    FamilyMember[] FamilyMembers;
    CustomizationSettings CustomizationSettings;

    // スタッフ専用状態
    StaffReport[] StaffReports;        // スタッフが作成したレポート一覧
    ReportFilter CurrentReportFilter;   // レポートフィルター（全て/下書き/公開済み）
}
```

#### 2.1.2 API Gateway層
```csharp
// API Gateway設定
public class ApiGatewayConfiguration
{
    public RateLimitConfiguration RateLimit;
    public AuthenticationConfiguration Auth;
    public RoutingConfiguration Routes;
    public CorsConfiguration Cors;
}

// レート制限
public class RateLimitConfiguration
{
    public int RequestsPerMinute = 100;
    public int SMSRequestsPerDay = 3;
    public int AuthAttemptsPerFiveMinutes = 3;
}
```

#### 2.1.3 アプリケーション層
```csharp
// サービス層構成
public interface IApplicationServices
{
    IAuthenticationService AuthenticationService;
    INotificationService NotificationService;
    IReportService ReportService;
    IPhotoService PhotoService;
    ICalendarService CalendarService;      // 週表示・月表示対応（全日イベント専用行対応、スタッフ権限フィルタリング）
    IFamilyService FamilyService;
    IFileStorageService FileStorageService;
    IAttachmentService AttachmentService;
    ICustomizationService CustomizationService; // フォントサイズ・言語設定機能
    IStaffService StaffService;           // スタッフ機能統合
}

// カレンダーサービス - 保護者・スタッフ権限フィルタリング
// 注: 保護者用とスタッフ用でCalendarDataレスポンス形式は完全に同一
// フロントエンドは同じCalendarコンポーネントを使用し、APIエンドポイントのみ切り替え
public interface ICalendarService
{
    // 保護者用カレンダー取得（紐づく園児の学年・クラスに基づくイベントフィルタリング）
    // 複数園児の場合: すべての園児の学年・クラスのイベントを表示
    Task<CalendarData> GetParentCalendarAsync(int parentId, int year, int month, string? categoryFilter = null);

    // スタッフ用カレンダー取得（受け持ちクラス・学年に基づくイベントフィルタリング）
    // レスポンス形式はGetParentCalendarAsyncと同一のCalendarData
    Task<CalendarData> GetStaffCalendarAsync(int staffId, int year, int month, string? categoryFilter = null);

    // イベント詳細取得
    Task<CalendarEvent> GetEventDetailAsync(int eventId, int userId, UserRole role);
}

// 保護者カレンダー権限フィルタリングロジック
// 保護者に紐づく全園児の学年・クラスに基づいてイベントをフィルタリング
public class ParentCalendarPermissionFilter
{
    // 保護者の表示可能なイベントをフィルタリング
    // GetParentCalendarAsync内でこのメソッドを使用してイベントをフィルタリング
    public async Task<List<CalendarEvent>> FilterEventsByParentPermissions(
        int parentId,
        List<CalendarEvent> allEvents)
    {
        // 保護者に紐づく全園児を取得
        var children = await GetChildrenForParent(parentId);
        var childClassIds = children.Select(c => c.ClassId).Distinct().ToList();
        var childGrades = children
            .Select(c => c.Class.GradeLevel)
            .Distinct()
            .ToList();

        return allEvents.Where(e => IsEventAccessibleForParent(e, childClassIds, childGrades)).ToList();
    }

    // イベントが保護者に表示可能かを判定
    private bool IsEventAccessibleForParent(
        CalendarEvent evt,
        List<int> childClassIds,
        List<int> childGrades)
    {
        // 全体系カテゴリは常に表示（全保護者アクセス可能）
        if (evt.Category == EventCategory.GeneralAnnouncement ||
            evt.Category == EventCategory.GeneralEvent ||
            evt.Category == EventCategory.NurseryHoliday)
        {
            return true;
        }

        // クラス活動: 園児が所属するクラスのみ表示
        if (evt.Category == EventCategory.ClassActivity)
        {
            return evt.TargetClassId.HasValue &&
                   childClassIds.Contains(evt.TargetClassId.Value);
        }

        // 学年活動: 園児が所属する学年のみ表示
        if (evt.Category == EventCategory.GradeActivity)
        {
            return evt.TargetGradeLevel.HasValue &&
                   childGrades.Contains(evt.TargetGradeLevel.Value);
        }

        return false;
    }
}

// スタッフカレンダー権限フィルタリングロジック
// APIレスポンスは保護者用と同じCalendarData形式で返すが、イベントリストが権限フィルタリングされる
public class StaffCalendarPermissionFilter
{
    // スタッフの表示可能なイベントをフィルタリング
    // GetStaffCalendarAsync内でこのメソッドを使用してイベントをフィルタリング
    public async Task<List<CalendarEvent>> FilterEventsByStaffPermissions(
        int staffId,
        List<CalendarEvent> allEvents)
    {
        var staffAssignments = await GetStaffClassAssignments(staffId);
        var assignedClassIds = staffAssignments.Select(a => a.ClassId).ToList();
        var assignedGrades = staffAssignments
            .Select(a => a.Class.GradeLevel)
            .Distinct()
            .ToList();

        return allEvents.Where(e => IsEventAccessibleForStaff(e, assignedClassIds, assignedGrades)).ToList();
    }

    // イベントがスタッフに表示可能かを判定
    private bool IsEventAccessibleForStaff(
        CalendarEvent evt,
        List<int> assignedClassIds,
        List<int> assignedGrades)
    {
        // 全体系カテゴリは常に表示（全スタッフアクセス可能）
        if (evt.Category == EventCategory.GeneralAnnouncement ||
            evt.Category == EventCategory.GeneralEvent ||
            evt.Category == EventCategory.NurseryHoliday)
        {
            return true;
        }

        // クラス活動: 受け持ちクラスのみ表示
        if (evt.Category == EventCategory.ClassActivity)
        {
            return evt.TargetClassId.HasValue &&
                   assignedClassIds.Contains(evt.TargetClassId.Value);
        }

        // 学年活動: 受け持ち学年のみ表示
        if (evt.Category == EventCategory.GradeActivity)
        {
            return evt.TargetGradeLevel.HasValue &&
                   assignedGrades.Contains(evt.TargetGradeLevel.Value);
        }

        return false;
    }
}

// 認証サービス
public interface IAuthenticationService
{
    Task<AuthResult> SendSmsCodeAsync(string phoneNumber);
    Task<AuthResult> VerifySmsCodeAsync(string phoneNumber, string code);
    Task<AuthResult> RefreshTokenAsync(string refreshToken);
    Task<bool> RevokeTokenAsync(string token);
}

// 通知サービス
public interface INotificationService
{
    Task<bool> SendContactNotificationAsync(ContactNotification notification);
    Task<bool> SendPushNotificationAsync(PushNotification notification);
    Task<bool> SendSmsInvitationAsync(FamilyInvitation invitation);
}

// レポートサービス
public interface IReportService
{
    // 保護者用レポート機能
    Task<IEnumerable<DailyReport>> GetReportsForChildAsync(int childId, DateTime date);
    Task<bool> AcknowledgeReportAsync(int reportId, int parentId);

    // スタッフ用レポート管理機能
    Task<IEnumerable<DailyReport>> GetReportsForStaffAsync(int nurseryId, int staffId, ReportFilter filter);
    Task<DailyReport> GetReportByIdAsync(int reportId, int nurseryId, int staffId);
    Task<DailyReport> CreateReportAsync(CreateReportRequest request);
    Task<DailyReport> UpdateReportAsync(int reportId, UpdateReportRequest request);
    Task<bool> DeleteReportAsync(int reportId, int nurseryId, int staffId);
    Task<bool> PublishReportAsync(int reportId, int nurseryId, int staffId);
}

// 添付ファイルサービス
public interface IAttachmentService
{
    Task<AttachmentMetadata> UploadAttachmentAsync(IFormFile file, string uploadedBy);
    Task<AttachmentDownloadInfo> GetAttachmentDownloadInfoAsync(string attachmentId, int userId);
    Task<bool> DeleteAttachmentAsync(string attachmentId, string deletedBy);
    Task<IEnumerable<AttachmentMetadata>> GetAttachmentsForAnnouncementAsync(string announcementId);
    Task<bool> ValidateFileTypeAsync(IFormFile file);
    Task<string> GeneratePresignedUrlAsync(string attachmentId, TimeSpan expiration);
}

// 写真サービス
public interface IPhotoService
{
    Task<IEnumerable<PhotoUploadResult>> UploadPhotosAsync(IEnumerable<IFormFile> files, PhotoUploadSettings settings);
    Task<bool> UpdatePhotoVisibilityAsync(int photoId, PhotoVisibility visibility);
    Task<bool> UpdatePhotoDescriptionAsync(int photoId, string description);
    Task<bool> DeletePhotoAsync(int photoId, int userId);
    Task<IEnumerable<Photo>> GetPhotosForChildAsync(int childId, PhotoFilter filter);
    Task<IEnumerable<Photo>> GetPhotosForClassAsync(string classId, PhotoFilter filter);
    Task<IEnumerable<Photo>> GetPhotosForGradeAsync(string gradeId, PhotoFilter filter);
    Task<string> GeneratePhotoThumbnailAsync(string originalPhotoUrl);
    Task<bool> ValidatePhotoPermissionsAsync(int photoId, int userId);
}

// ファイルストレージサービス
public interface IFileStorageService
{
    Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType);
    Task<Stream> DownloadFileAsync(string fileUrl);
    Task<bool> DeleteFileAsync(string fileUrl);
    Task<string> GeneratePresignedDownloadUrlAsync(string fileUrl, TimeSpan expiration);
    Task<string> UploadPhotoAsync(Stream photoStream, string fileName, PhotoStorageOptions options);
    Task<bool> DeletePhotoAndThumbnailAsync(string photoUrl);
}

// カスタマイズサービス
public interface ICustomizationService
{
    Task<CustomizationSettings> GetUserCustomizationAsync(int userId);
    Task<bool> UpdateFontSizeAsync(int userId, FontSize fontSize);
    Task<bool> UpdateLanguageAsync(int userId, Language language);
    Task<bool> ResetToDefaultAsync(int userId);
    Task<CustomizationSettings> GetDefaultSettingsAsync();
}

// スタッフサービス
public interface IStaffService
{
    // スタッフ認証・管理
    Task<StaffAuthResult> AuthenticateStaffAsync(string phoneNumber, string code);
    Task<Staff> GetStaffByIdAsync(int staffId);
    Task<IEnumerable<Child>> GetStaffClassChildrenAsync(int staffId);

    // 連絡通知管理
    Task<IEnumerable<ContactNotification>> GetPendingNotificationsAsync(int staffId);
    Task<bool> AcknowledgeNotificationAsync(int notificationId, int staffId, string response = null);
    Task<IEnumerable<ContactNotification>> GetContactHistoryAsync(int staffId, ContactHistoryFilter filter);

    // レポート作成・管理
    Task<int> CreateReportAsync(CreateStaffReportDto dto);
    Task<int> SaveReportDraftAsync(CreateStaffReportDto dto);
    Task<IEnumerable<DailyReport>> GetStaffReportsAsync(int staffId, ReportFilter filter);
    Task<DailyReport> GetReportByIdAsync(int reportId, int staffId);
    Task<bool> UpdateReportAsync(int reportId, UpdateStaffReportDto dto);
    Task<bool> DeleteReportAsync(int reportId, int staffId);
    Task<bool> PublishReportAsync(int reportId, int staffId);
    Task<IEnumerable<ReportTemplate>> GetReportTemplatesAsync();
    Task<IEnumerable<int>> CreateBulkReportsAsync(BulkReportDto dto);

    // 写真管理
    Task<IEnumerable<PhotoUploadResult>> UploadPhotosAsync(StaffPhotoUploadDto dto);
    Task<bool> TagChildrenInPhotoAsync(int photoId, List<int> childrenIds);
    Task<bool> UpdatePhotoVisibilityAsync(int photoId, PhotoVisibility visibility);
    Task<bool> UpdatePhotoDescriptionAsync(int photoId, string description);
    Task<bool> DeletePhotoAsync(int photoId, int staffId);
    Task<IEnumerable<Photo>> GetStaffPhotosAsync(int staffId, PhotoFilter filter);

    // お知らせ管理
    Task<int> CreateAnnouncementAsync(CreateAnnouncementDto dto);
    Task<int> ScheduleAnnouncementAsync(ScheduleAnnouncementDto dto);
    Task<IEnumerable<StaffAnnouncement>> GetSentAnnouncementsAsync(int staffId);
}
```

#### 2.1.4 ドメイン層
```csharp
// ドメインサービス
public interface IDomainServices
{
    IUserDomainService UserDomainService;
    INotificationDomainService NotificationDomainService;
    ISecurityDomainService SecurityDomainService;
}

// セキュリティドメインサービス
public interface ISecurityDomainService
{
    bool ValidatePhoneNumber(string phoneNumber);
    string GenerateAuthCode();
    bool ValidateAuthCode(string code, DateTime createdAt);
    string GenerateInvitationCode();
    bool ValidatePermissions(int userId, string action, int resourceId);
}
```

#### 2.1.5 インフラストラクチャ層
```csharp
// リポジトリパターン
public interface IRepositories
{
    IParentRepository ParentRepository;
    IChildRepository ChildRepository;
    INurseryRepository NurseryRepository;
    IReportRepository ReportRepository;
    IPhotoRepository PhotoRepository;
    IEventRepository EventRepository;
}

// 外部サービス統合
public interface IExternalServices
{
    ISmsService SmsService;              // メディア4U SMS認証サービス
    IFileStorageService FileStorageService; // Azure Blob/AWS S3
    IPushNotificationService PushService;   // Azure Notification Hub
    ICacheService CacheService;          // Redis
}
```

### 2.2 データアクセス層設計

#### 2.2.1 Entity Framework Core設定
```csharp
public class NurseryDbContext : DbContext
{
    public DbSet<Nursery> Nurseries { get; set; }
    public DbSet<Class> Classes { get; set; }
    public DbSet<Teacher> Teachers { get; set; }
    public DbSet<Child> Children { get; set; }
    public DbSet<Parent> Parents { get; set; }
    public DbSet<ParentChildRelationship> ParentChildRelationships { get; set; }
    public DbSet<ContactNotification> ContactNotifications { get; set; }
    public DbSet<Event> Events { get; set; }
    public DbSet<DailyReport> DailyReports { get; set; }
    public DbSet<Photo> Photos { get; set; }
    public DbSet<SmsAuthentication> SmsAuthentications { get; set; }
    public DbSet<FamilyInvitation> FamilyInvitations { get; set; }
    public DbSet<Attachment> Attachments { get; set; }
    public DbSet<AnnouncementAttachment> AnnouncementAttachments { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // 複合キー設定
        modelBuilder.Entity<ParentChildRelationship>()
            .HasKey(pc => new { pc.ParentId, pc.ChildId });

        modelBuilder.Entity<AnnouncementAttachment>()
            .HasKey(aa => new { aa.AnnouncementId, aa.AttachmentId });

        // インデックス設定
        modelBuilder.Entity<Parent>()
            .HasIndex(p => p.PhoneNumber)
            .IsUnique();

        modelBuilder.Entity<Child>()
            .HasIndex(c => new { c.NurseryId, c.ClassId });

        // 外部キー制約
        modelBuilder.Entity<ParentChildRelationship>()
            .HasOne(pc => pc.Parent)
            .WithMany(p => p.ChildRelationships)
            .HasForeignKey(pc => pc.ParentId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ParentChildRelationship>()
            .HasOne(pc => pc.Child)
            .WithMany(c => c.ParentRelationships)
            .HasForeignKey(pc => pc.ChildId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
```

#### 2.2.2 リポジトリ実装例
```csharp
public class ParentRepository : IParentRepository
{
    private readonly NurseryDbContext _context;
    private readonly ICacheService _cache;

    public ParentRepository(NurseryDbContext context, ICacheService cache)
    {
        _context = context;
        _cache = cache;
    }

    public async Task<Parent> GetByPhoneNumberAsync(string phoneNumber)
    {
        var cacheKey = $"parent:phone:{phoneNumber}";
        var cached = await _cache.GetAsync<Parent>(cacheKey);
        if (cached != null) return cached;

        var parent = await _context.Parents
            .Include(p => p.ChildRelationships)
            .ThenInclude(cr => cr.Child)
            .FirstOrDefaultAsync(p => p.PhoneNumber == phoneNumber);

        if (parent != null)
        {
            await _cache.SetAsync(cacheKey, parent, TimeSpan.FromMinutes(30));
        }

        return parent;
    }

    public async Task<IEnumerable<Child>> GetChildrenForParentAsync(int parentId)
    {
        var cacheKey = $"parent:children:{parentId}";
        var cached = await _cache.GetAsync<IEnumerable<Child>>(cacheKey);
        if (cached != null) return cached;

        var children = await _context.ParentChildRelationships
            .Where(pcr => pcr.ParentId == parentId)
            .Select(pcr => pcr.Child)
            .Include(c => c.ParentRelationships)
            .ToListAsync();

        await _cache.SetAsync(cacheKey, children, TimeSpan.FromMinutes(15));
        return children;
    }
}
```

## 3. パフォーマンス設計

### 3.1 キャッシュ戦略
```csharp
public class CacheConfiguration
{
    // レベル別キャッシュ戦略
    public Dictionary<string, CachePolicy> Policies = new()
    {
        // 頻繁に参照される静的データ
        ["nursery_data"] = new CachePolicy { Duration = TimeSpan.FromHours(24) },
        ["class_data"] = new CachePolicy { Duration = TimeSpan.FromHours(12) },
        
        // ユーザー固有データ
        ["user_profile"] = new CachePolicy { Duration = TimeSpan.FromMinutes(30) },
        ["user_children"] = new CachePolicy { Duration = TimeSpan.FromMinutes(15) },
        
        // 動的データ
        ["daily_reports"] = new CachePolicy { Duration = TimeSpan.FromMinutes(10) },
        ["recent_photos"] = new CachePolicy { Duration = TimeSpan.FromMinutes(5) },
        
        // セッション・認証データ
        ["sms_codes"] = new CachePolicy { Duration = TimeSpan.FromMinutes(5) },
        ["jwt_tokens"] = new CachePolicy { Duration = TimeSpan.FromHours(1) }
    };
}
```

### 3.2 データベース最適化
```sql
-- パフォーマンス最適化のためのインデックス設計

-- 親の電話番号検索（認証時）
CREATE UNIQUE INDEX IX_Parents_PhoneNumber 
ON Parents (PhoneNumber);

-- 子どもの保育園・クラス検索
CREATE INDEX IX_Children_NurseryId_ClassId 
ON Children (NurseryId, ClassId);

-- レポート検索（子ども・日付別）
CREATE INDEX IX_DailyReports_ChildId_ReportDate 
ON DailyReports (ChildId, ReportDate DESC);

-- 写真検索（子ども・公開日別）
CREATE INDEX IX_Photos_ChildId_PublishDate 
ON Photos (ChildId, PublishDate DESC);

-- 写真検索（プライバシー設定別）
CREATE INDEX IX_Photos_PrivacySetting 
ON Photos (PrivacySetting);

-- 欠席・遅刻・お迎え連絡検索（子ども・対象日別）
CREATE INDEX IX_ContactNotifications_ChildId_TargetDate 
ON ContactNotifications (ChildId, TargetDate DESC);

-- イベント検索（日付範囲）
CREATE INDEX IX_Events_StartDateTime_EndDateTime 
ON Events (StartDateTime, EndDateTime);

-- SMS認証検索（電話番号・作成日時）
CREATE INDEX IX_SmsAuthentication_PhoneNumber_CreatedAt 
ON SmsAuthentication (PhoneNumber, CreatedAt DESC);

-- 添付ファイル検索（お知らせ別）
CREATE INDEX IX_AnnouncementAttachments_AnnouncementId 
ON AnnouncementAttachments (AnnouncementId);

-- 添付ファイル検索（ファイルタイプ・アップロード日時）
CREATE INDEX IX_Attachments_FileType_UploadedAt 
ON Attachments (FileType, UploadedAt DESC);
```

## 4. セキュリティアーキテクチャ

### 4.1 認証・認可フロー
```csharp
public class SecurityArchitecture
{
    // 多層防御アプローチ
    public SecurityLayer[] Layers = new[]
    {
        // Layer 1: Network Security
        new SecurityLayer
        {
            Name = "Network",
            Components = new[] { "HTTPS", "CORS", "Rate Limiting", "DDoS Protection" }
        },
        
        // Layer 2: Authentication
        new SecurityLayer
        {
            Name = "Authentication",
            Components = new[] { "SMS OTP", "JWT Tokens", "Refresh Token Rotation" }
        },
        
        // Layer 3: Authorization
        new SecurityLayer
        {
            Name = "Authorization",
            Components = new[] { "Role-Based Access", "Resource-Level Permissions", "Family Scope" }
        },
        
        // Layer 4: Data Protection
        new SecurityLayer
        {
            Name = "Data Protection",
            Components = new[] { "Encryption at Rest", "Encryption in Transit", "PII Masking" }
        },
        
        // Layer 5: Application Security
        new SecurityLayer
        {
            Name = "Application",
            Components = new[] { "Input Validation", "SQL Injection Prevention", "XSS Protection" }
        }
    };
}
```

### 4.2 権限管理システム
```csharp
public class PermissionSystem
{
    public enum Permission
    {
        // 基本権限
        ViewOwnChildReports,
        ViewOwnChildPhotos,
        DownloadOwnChildPhotos,
        
        // 通知権限
        SubmitContactNotification,
        ReceivePushNotifications,
        ReceiveSmsNotifications,
        
        // 家族登録権限
        InviteFamilyMembers,
        ManageFamilyPermissions,
        RemoveFamilyMembers,
        
        // スタッフ権限
        CreateDailyReports,
        UploadPhotos,
        ViewClassChildren,
        ReceiveContactNotifications,
        AcknowledgeContactNotifications,
        CreateClassAnnouncements,
        ViewContactHistory,
        ManagePhotoTags,
        AccessStaffCalendar,
        
        // 管理者権限
        ManageNurserySettings,
        ManageStaffAccounts,
        ViewSystemLogs,
        ManageParentAccounts
    }
    
    public class PermissionMatrix
    {
        public Dictionary<UserRole, Permission[]> RolePermissions = new()
        {
            [UserRole.PrimaryParent] = new[]
            {
                Permission.ViewOwnChildReports,
                Permission.ViewOwnChildPhotos,
                Permission.DownloadOwnChildPhotos,
                Permission.SubmitContactNotification,
                Permission.ReceivePushNotifications,
                Permission.InviteFamilyMembers,
                Permission.ManageFamilyPermissions
            },
            
            [UserRole.FamilyMember] = new[]
            {
                Permission.ViewOwnChildReports,
                Permission.ViewOwnChildPhotos,
                Permission.ReceivePushNotifications
                // 注: お迎え連絡権限は家族設定で個別に制御
            },
            
            [UserRole.Teacher] = new[]
            {
                Permission.CreateDailyReports,
                Permission.UploadPhotos,
                Permission.ViewClassChildren,
                Permission.ReceiveContactNotifications,
                Permission.AcknowledgeContactNotifications,
                Permission.CreateClassAnnouncements,
                Permission.ViewContactHistory,
                Permission.ManagePhotoTags,
                Permission.AccessStaffCalendar  // 権限ベースフィルタリング適用
            },
            
            [UserRole.Administrator] = new[]
            {
                Permission.ManageNurserySettings,
                Permission.ManageStaffAccounts,
                Permission.ViewSystemLogs
            }
        };
    }
}
```

## 5. 監視・ログ・メトリクス設計

### 5.1 ログ設計
```csharp
public class LoggingConfiguration
{
    public LogLevel[] LogLevels = new[]
    {
        LogLevel.Security,    // セキュリティ関連（認証失敗、不正アクセス試行）
        LogLevel.Business,    // ビジネス処理（通知送信、レポート作成）
        LogLevel.Performance, // パフォーマンス（API応答時間、データベースクエリ時間）
        LogLevel.Error,       // エラー（例外、システムエラー）
        LogLevel.Debug        // デバッグ情報（開発・テスト時のみ）
    };
    
    public Dictionary<string, LogPolicy> Policies = new()
    {
        ["Authentication"] = new LogPolicy
        {
            Level = LogLevel.Security,
            RetentionDays = 90,
            AlertThreshold = 5 // 5回連続失敗で警告
        },
        
        ["DataAccess"] = new LogPolicy
        {
            Level = LogLevel.Performance,
            RetentionDays = 30,
            AlertThreshold = 2000 // 2秒以上で警告
        }
    };
}
```

### 5.2 メトリクス監視
```csharp
public class MetricsConfiguration
{
    public BusinessMetric[] BusinessMetrics = new[]
    {
        new BusinessMetric
        {
            Name = "DailyActiveUsers",
            Description = "日次アクティブユーザー数",
            Target = 70, // 70%の保護者が毎日利用
            AlertThreshold = 50
        },
        
        new BusinessMetric
        {
            Name = "NotificationDeliveryRate",
            Description = "通知配信成功率",
            Target = 95,
            AlertThreshold = 90
        },
        
        new BusinessMetric
        {
            Name = "PhotoUploadSuccess",
            Description = "写真アップロード成功率",
            Target = 98,
            AlertThreshold = 95
        }
    };
    
    public TechnicalMetric[] TechnicalMetrics = new[]
    {
        new TechnicalMetric
        {
            Name = "ApiResponseTime",
            Description = "API平均応答時間",
            Target = 500, // 500ms以下
            AlertThreshold = 1000 // 1秒以上で警告
        },
        
        new TechnicalMetric
        {
            Name = "DatabaseConnectionPool",
            Description = "データベース接続プール使用率",
            Target = 70,
            AlertThreshold = 90
        }
    };
}
```

## 6. スケーラビリティ設計

### 6.1 水平スケーリング戦略
```csharp
public class ScalingStrategy
{
    public AutoScalingConfiguration AutoScaling = new()
    {
        // APIサーバーのスケーリング
        ApiServers = new ScalingPolicy
        {
            MinInstances = 2,
            MaxInstances = 10,
            ScaleUpThreshold = 70,    // CPU使用率70%で増加
            ScaleDownThreshold = 30,  // CPU使用率30%で減少
            CooldownPeriod = TimeSpan.FromMinutes(5)
        },
        
        // データベースのスケーリング
        Database = new ScalingPolicy
        {
            ReadReplicas = 2,         // 読み取り専用レプリカ
            ConnectionPoolSize = 100,
            QueryTimeoutSeconds = 30
        },
        
        // ファイルストレージのスケーリング
        FileStorage = new ScalingPolicy
        {
            CDNRegions = new[] { "Asia-Pacific", "US-West", "Europe" },
            CompressionEnabled = true,
            ThumbnailGeneration = true,
            PhotoStorageOptimization = new PhotoStorageConfig
            {
                OriginalQuality = 85,          // JPEG品質85%
                ThumbnailSizes = new[] { 150, 300, 600 }, // サムネイルサイズ
                MaxFileSize = 10 * 1024 * 1024, // 10MB上限
                AllowedFormats = new[] { "jpeg", "jpg", "png", "webp" }
            }
        }
    };
}
```

### 6.2 キャパシティプランニング
```csharp
public class CapacityPlanning
{
    public ProjectedLoad[] LoadProjections = new[]
    {
        new ProjectedLoad
        {
            Timeframe = "Year 1",
            ExpectedUsers = 1000,      // 1000家庭
            DailyActiveUsers = 700,    // 70%がアクティブ
            PeakConcurrentUsers = 200, // 朝の連絡時間帯
            DailyApiCalls = 50000,
            StorageRequiredGB = 500    // 写真・レポートデータ（公開日管理込み）
        },
        
        new ProjectedLoad
        {
            Timeframe = "Year 3",
            ExpectedUsers = 5000,
            DailyActiveUsers = 3500,
            PeakConcurrentUsers = 1000,
            DailyApiCalls = 250000,
            StorageRequiredGB = 5000
        },
        
        new ProjectedLoad
        {
            Timeframe = "Year 5",
            ExpectedUsers = 10000,
            DailyActiveUsers = 7000,
            PeakConcurrentUsers = 2000,
            DailyApiCalls = 500000,
            StorageRequiredGB = 15000
        }
    };
}
```

このシステム設計書は、保育園保護者向けモバイルアプリの技術的な基盤を提供し、スケーラブルで保守性の高いシステムの構築を可能にします。各コンポーネントは疎結合で設計されており、将来的な機能拡張や技術変更に柔軟に対応できます。