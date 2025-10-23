# SMS認証システム技術仕様書

## 1. アーキテクチャ概要

### 1.1 システム構成
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │───▶│  ASP.NET Core   │───▶│   SQL Server    │
│   (Frontend)    │    │   (Backend)     │    │   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                               │
                               ▼
                       ┌─────────────────┐
                       │   Media4U SMS   │
                       │      API        │
                       └─────────────────┘
```

### 1.2 認証フローシーケンス
```
Client          Backend         Database        SMS API
  │               │               │               │
  │ 1.電話番号入力  │               │               │
  ├──────────────▶│               │               │
  │               │ 2.ユーザー存在確認│               │
  │               ├──────────────▶│               │
  │               │ 3.結果返却      │               │
  │               │◀──────────────┤               │
  │               │ 4.SMS送信要求   │               │
  │               ├─────────────────────────────▶│
  │               │ 5.送信完了      │               │
  │               │◀─────────────────────────────┤
  │ 6.認証コード入力│               │               │
  ├──────────────▶│               │               │
  │               │ 7.コード検証    │               │
  │               ├──────────────▶│               │
  │               │ 8.JWT生成      │               │
  │               │◀──────────────┤               │
  │ 9.ポータル誘導  │               │               │
  │◀──────────────┤               │               │
```

## 2. データベース設計

### 2.1 既存テーブル拡張

#### Parents テーブル
```sql
ALTER TABLE Parents
ADD LastLoginAt DATETIME2 NULL;

CREATE INDEX IX_Parents_PhoneNumber_Active
ON Parents (PhoneNumber, IsActive);
```

#### Staff テーブル
```sql
-- 既存のStaffテーブルは複合主キー (NurseryId, StaffId) を使用
-- LastLoginAtは既に存在

CREATE INDEX IX_Staff_PhoneNumber_Active
ON Staff (PhoneNumber, IsActive);

CREATE INDEX IX_Staff_NurseryId_StaffId
ON Staff (NurseryId, StaffId);
```

#### StaffClassAssignments テーブル (既存)
```sql
-- 複数クラス担当のためのジャンクションテーブル
-- このテーブルは既に作成済み
CREATE TABLE StaffClassAssignments (
    NurseryId INT NOT NULL,
    StaffId INT NOT NULL,
    ClassId NVARCHAR(50) NOT NULL,
    AssignmentRole NVARCHAR(20) NOT NULL DEFAULT 'MainTeacher',
    AssignedAt DATETIME2 DEFAULT GETUTCDATE(),

    CONSTRAINT PK_StaffClassAssignments PRIMARY KEY (NurseryId, StaffId, ClassId),
    CONSTRAINT FK_StaffClassAssignments_Staff FOREIGN KEY (NurseryId, StaffId)
        REFERENCES Staff (NurseryId, StaffId),
    CONSTRAINT FK_StaffClassAssignments_Class FOREIGN KEY (NurseryId, ClassId)
        REFERENCES Classes (NurseryId, ClassId),
    CONSTRAINT CK_AssignmentRole CHECK (AssignmentRole IN ('MainTeacher', 'AssistantTeacher'))
);

CREATE INDEX IX_StaffClassAssignments_Staff
ON StaffClassAssignments (NurseryId, StaffId);

CREATE INDEX IX_StaffClassAssignments_Class
ON StaffClassAssignments (NurseryId, ClassId);
```

### 2.2 新規テーブル

#### UserSessions テーブル
```sql
CREATE TABLE UserSessions (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    UserType NVARCHAR(20) NOT NULL CHECK (UserType IN ('Parent', 'Staff')),
    SessionToken NVARCHAR(500) NOT NULL,
    DeviceId NVARCHAR(100) NULL,
    IpAddress NVARCHAR(45) NOT NULL,
    UserAgent NVARCHAR(500) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    LastAccessAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    ExpiresAt DATETIME2 NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CONSTRAINT IX_UserSessions_Token UNIQUE (SessionToken)
);

CREATE INDEX IX_UserSessions_User ON UserSessions (UserId, UserType, IsActive);
CREATE INDEX IX_UserSessions_Expiry ON UserSessions (ExpiresAt, IsActive);
```

### 2.3 ビュー作成

#### ユーザー統合ビュー
```sql
CREATE VIEW vw_UserLookup AS
SELECT
    'Parent' as UserType,
    p.Id as UserId,
    p.PhoneNumber,
    p.Name,
    p.Email,
    p.IsActive,
    p.LastLoginAt,
    COUNT(pr.ChildId) as ChildCount
FROM Parents p
INNER JOIN ParentRelationships pr ON p.Id = pr.ParentId
WHERE p.IsActive = 1
GROUP BY p.Id, p.PhoneNumber, p.Name, p.Email, p.IsActive, p.LastLoginAt

UNION ALL

SELECT
    'Staff' as UserType,
    CAST(s.StaffId AS NVARCHAR(20)) as UserId,
    s.PhoneNumber,
    s.FirstName + ' ' + s.LastName as Name,
    s.Email,
    s.IsActive,
    s.LastLoginAt,
    (SELECT COUNT(*) FROM StaffClassAssignments sca
     WHERE sca.NurseryId = s.NurseryId AND sca.StaffId = s.StaffId) as ChildCount
FROM Staff s
WHERE s.IsActive = 1;
```

## 3. API設計

### 3.1 新しいエンドポイント

#### POST /api/auth/check-user
電話番号の事前チェック

**Request:**
```json
{
  "phoneNumber": "09012345678"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userTypes": ["Parent", "Staff"],
    "parentInfo": {
      "id": 1,
      "name": "田中花子",
      "childCount": 2
    },
    "staffInfo": {
      "id": "5",
      "nurseryId": 1,
      "staffId": 5,
      "name": "田中花子",
      "role": "Teacher",
      "classCount": 2
    }
  }
}
```

#### POST /api/auth/select-role
認証後の役割選択

**Request:**
```json
{
  "phoneNumber": "09012345678",
  "selectedRole": "Parent",
  "rememberChoice": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "redirectUrl": "/dashboard/parent",
    "accessToken": "eyJ...",
    "refreshToken": "abc123..."
  }
}
```

### 3.2 既存エンドポイント修正

#### POST /api/auth/send-sms
事前チェック結果に基づくSMS送信

#### POST /api/auth/verify-sms
複数役割対応の認証検証

## 4. バックエンド実装

### 4.1 新しいサービスクラス

#### IUserLookupService
```csharp
public interface IUserLookupService
{
    Task<UserLookupResult> CheckUserByPhoneNumberAsync(string phoneNumber);
    Task<bool> IsParentAsync(string phoneNumber);
    Task<bool> IsStaffAsync(string phoneNumber);
    Task<UserTypeFlags> GetUserTypesAsync(string phoneNumber);
}

[Flags]
public enum UserTypeFlags
{
    None = 0,
    Parent = 1,
    Staff = 2,
    Both = Parent | Staff
}

public class UserLookupResult
{
    public UserTypeFlags UserTypes { get; set; }
    public ParentInfo? ParentInfo { get; set; }
    public StaffInfo? StaffInfo { get; set; }
    public bool RequiresRoleSelection => UserTypes == UserTypeFlags.Both;
}
```

#### IRoleSelectionService
```csharp
public interface IRoleSelectionService
{
    Task<AuthResponse> SelectRoleAsync(RoleSelectionRequest request);
    Task SaveRolePreferenceAsync(string phoneNumber, UserType preferredRole);
    Task<UserType?> GetSavedRolePreferenceAsync(string phoneNumber);
}
```

### 4.2 修正されるサービス

#### AuthenticationService.cs
```csharp
public async Task<ApiResponse<object>> SendSmsCodeAsync(SendSmsRequest request, string ipAddress, string userAgent)
{
    // 1. 電話番号の事前チェック
    var userLookup = await _userLookupService.CheckUserByPhoneNumberAsync(request.PhoneNumber);

    if (userLookup.UserTypes == UserTypeFlags.None)
    {
        return new ApiResponse<object>
        {
            Success = false,
            Message = "この電話番号は登録されていません。園にお問い合わせください。",
            Errors = { "USER_NOT_FOUND" }
        };
    }

    // 2. SMS送信処理（既存ロジック）
    // ...
}

public async Task<ApiResponse<AuthResponse>> VerifyAndLoginAsync(VerifySmsRequest request, string ipAddress, string userAgent)
{
    // 1. SMS認証検証（既存ロジック）
    // ...

    // 2. ユーザー種別確認
    var userLookup = await _userLookupService.CheckUserByPhoneNumberAsync(request.PhoneNumber);

    if (userLookup.RequiresRoleSelection)
    {
        // 役割選択が必要
        return new ApiResponse<AuthResponse>
        {
            Success = true,
            Message = "複数の役割があります。役割を選択してください。",
            Data = new AuthResponse
            {
                RequiresRoleSelection = true,
                AvailableRoles = userLookup.UserTypes,
                ParentInfo = userLookup.ParentInfo,
                StaffInfo = userLookup.StaffInfo
            }
        };
    }

    // 3. 単一役割の場合は直接ログイン
    // ...
}
```

## 5. フロントエンド実装

### 5.1 新しいコンポーネント

#### RoleSelectionPage.tsx
```tsx
interface RoleSelectionPageProps {
  parentInfo?: ParentInfo;
  staffInfo?: StaffInfo;
  onRoleSelect: (role: UserType) => void;
}

export function RoleSelectionPage({ parentInfo, staffInfo, onRoleSelect }: RoleSelectionPageProps) {
  return (
    <div className="role-selection-container">
      <h1>利用する役割を選択してください</h1>

      {parentInfo && (
        <RoleCard
          role="Parent"
          title="保護者として利用"
          description={`${parentInfo.childCount}名の園児の保護者`}
          icon={<HiUser />}
          onClick={() => onRoleSelect('Parent')}
        />
      )}

      {staffInfo && (
        <RoleCard
          role="Staff"
          title="スタッフとして利用"
          description={`${staffInfo.classCount}クラス担当`}
          icon={<HiBuildingOffice2 />}
          onClick={() => onRoleSelect('Staff')}
        />
      )}
    </div>
  );
}
```

### 5.2 認証フロー修正

#### useAuth.ts
```typescript
export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    step: 'phone-input',
    userTypes: null,
    requiresRoleSelection: false,
    // ...
  });

  const checkUser = async (phoneNumber: string) => {
    const response = await authService.checkUser(phoneNumber);
    if (response.success) {
      setAuthState(prev => ({
        ...prev,
        userTypes: response.data.userTypes,
        parentInfo: response.data.parentInfo,
        staffInfo: response.data.staffInfo
      }));
    }
    return response;
  };

  const selectRole = async (role: UserType) => {
    const response = await authService.selectRole({
      phoneNumber: authState.phoneNumber,
      selectedRole: role,
      rememberChoice: true
    });

    if (response.success) {
      // ダッシュボードにリダイレクト
      navigate(response.data.redirectUrl);
    }

    return response;
  };

  return {
    // ...existing methods
    checkUser,
    selectRole
  };
}
```

## 6. セキュリティ実装

### 6.1 JWT拡張（スタッフクラス情報含む）
```csharp
public class JwtService : IJwtService
{
    public string GenerateAccessToken(object user, UserType userType)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.MobilePhone, phoneNumber),
            new("UserType", userType.ToString()),
            new("Scope", GetScopeForUserType(userType))
        };

        // スタッフの場合、クラス割り当て情報を含める
        if (userType == UserType.Staff && user is StaffUser staffUser)
        {
            claims.Add(new Claim("NurseryId", staffUser.NurseryId.ToString()));
            claims.Add(new Claim("StaffId", staffUser.StaffId.ToString()));

            // 担当クラスをJSON配列としてクレームに追加
            var classAssignments = JsonSerializer.Serialize(staffUser.ClassAssignments);
            claims.Add(new Claim("ClassAssignments", classAssignments));
        }

        // JWT生成処理
    }

    private string GetScopeForUserType(UserType userType)
    {
        return userType switch
        {
            UserType.Parent => "parent:read parent:write",
            UserType.Staff => "staff:read staff:write admin:read",
            _ => throw new ArgumentException("Invalid user type")
        };
    }
}
```

### 6.2 認可ポリシー
```csharp
public class Startup
{
    public void ConfigureServices(IServiceCollection services)
    {
        services.AddAuthorization(options =>
        {
            options.AddPolicy("ParentOnly", policy =>
                policy.RequireClaim("UserType", "Parent"));

            options.AddPolicy("StaffOnly", policy =>
                policy.RequireClaim("UserType", "Staff"));

            options.AddPolicy("ParentOrStaff", policy =>
                policy.RequireClaim("UserType", "Parent", "Staff"));
        });

        // スタッフクラスアクセス検証サービス
        services.AddScoped<IStaffClassAccessValidator, StaffClassAccessValidator>();
    }
}
```

### 6.3 スタッフクラスアクセス検証
```csharp
public interface IStaffClassAccessValidator
{
    Task<bool> ValidateAccessAsync(int nurseryId, int staffId, string classId);
    Task<List<ClassAssignmentDto>> GetStaffClassAssignmentsAsync(int nurseryId, int staffId);
}

public class StaffClassAccessValidator : IStaffClassAccessValidator
{
    private readonly KindergartenDbContext _context;

    public async Task<bool> ValidateAccessAsync(int nurseryId, int staffId, string classId)
    {
        return await _context.StaffClassAssignments
            .AnyAsync(sca =>
                sca.NurseryId == nurseryId &&
                sca.StaffId == staffId &&
                sca.ClassId == classId);
    }

    public async Task<List<ClassAssignmentDto>> GetStaffClassAssignmentsAsync(int nurseryId, int staffId)
    {
        return await _context.StaffClassAssignments
            .Where(sca => sca.NurseryId == nurseryId && sca.StaffId == staffId)
            .Join(_context.Classes,
                sca => new { sca.NurseryId, sca.ClassId },
                c => new { c.NurseryId, c.ClassId },
                (sca, c) => new ClassAssignmentDto
                {
                    ClassId = sca.ClassId,
                    ClassName = c.Name,
                    AssignmentRole = sca.AssignmentRole
                })
            .ToListAsync();
    }
}
```

## 7. エラーハンドリング

### 7.1 カスタム例外
```csharp
public class UserNotFoundException : Exception
{
    public UserNotFoundException(string phoneNumber)
        : base($"User not found for phone number: {phoneNumber}") { }
}

public class MultipleRolesException : Exception
{
    public UserTypeFlags AvailableRoles { get; }

    public MultipleRolesException(UserTypeFlags availableRoles)
        : base("Multiple roles available, role selection required")
    {
        AvailableRoles = availableRoles;
    }
}
```

## 8. パフォーマンス最適化

### 8.1 キャッシュ戦略
```csharp
[MemoryCache(Duration = 300)] // 5分間キャッシュ
public async Task<UserLookupResult> CheckUserByPhoneNumberAsync(string phoneNumber)
{
    // 実装
}
```

### 8.2 データベースインデックス
```sql
-- パフォーマンス向上のための複合インデックス
CREATE INDEX IX_Parents_Phone_Active_WithChildren
ON Parents (PhoneNumber, IsActive)
INCLUDE (Id, Name, Email, LastLoginAt);

CREATE INDEX IX_Staff_Phone_Active_WithDetails
ON Staff (PhoneNumber, IsActive)
INCLUDE (Id, FirstName, LastName, Position, Email, LastLoginAt);
```

## 9. 監視・ログ

### 9.1 認証メトリクス
```csharp
public class AuthenticationMetrics
{
    private readonly ILogger<AuthenticationMetrics> _logger;

    public void RecordAuthenticationAttempt(string phoneNumber, UserType? userType, bool success)
    {
        _logger.LogInformation("Authentication attempt: {PhoneNumber}, Type: {UserType}, Success: {Success}",
            phoneNumber, userType, success);
    }

    public void RecordRoleSelection(string phoneNumber, UserType selectedRole)
    {
        _logger.LogInformation("Role selected: {PhoneNumber}, Role: {Role}",
            phoneNumber, selectedRole);
    }
}
```

## 10. 実装スケジュール

### Phase 1: バックエンド実装 (3日)
- [ ] UserLookupService実装
- [ ] AuthenticationService修正
- [ ] 新しいAPIエンドポイント
- [ ] データベーススキーマ更新

### Phase 2: フロントエンド実装 (2日)
- [ ] RoleSelectionPage実装
- [ ] useAuth修正
- [ ] 認証フロー修正

### Phase 3: テスト・統合 (2日)
- [ ] 単体テスト
- [ ] 統合テスト
- [ ] E2Eテスト
- [ ] パフォーマンステスト

### Phase 4: デプロイ・監視 (1日)
- [ ] 本番環境デプロイ
- [ ] 監視設定
- [ ] ログ分析設定