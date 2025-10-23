namespace ReactApp.Server.DTOs;

/// <summary>
/// イベントDTO
/// 保育園イベント情報をクライアントとサーバー間で伝送するためのデータ転送オブジェクト
/// </summary>
public class EventDto
{
    /// <summary>
    /// イベントID
    /// システム内のイベント一意識別子
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// イベントタイトル
    /// イベントの名称・表題
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// イベント説明（任意）
    /// イベントの詳細説明文
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// イベントカテゴリ
    /// イベントの分類（行事・レクリエーション・教育など）
    /// </summary>
    public string Category { get; set; } = string.Empty;

    /// <summary>
    /// 開始日時
    /// イベントの開始日時
    /// </summary>
    public DateTime StartDateTime { get; set; }

    /// <summary>
    /// 終了日時
    /// イベントの終了日時
    /// </summary>
    public DateTime EndDateTime { get; set; }

    /// <summary>
    /// 終日イベントフラグ
    /// 一日中のイベントかどうか
    /// </summary>
    public bool IsAllDay { get; set; }

    /// <summary>
    /// 繰り返しパターン
    /// イベントの繰り返し設定（毎日・毎週・毎月など）
    /// </summary>
    public string RecurrencePattern { get; set; } = string.Empty;

    /// <summary>
    /// 対象者
    /// イベントの対象となる人たち（全員・特定クラス・個人など）
    /// </summary>
    public string TargetAudience { get; set; } = string.Empty;

    /// <summary>
    /// 準備必要フラグ
    /// イベントに事前準備が必要かどうか
    /// </summary>
    public bool RequiresPreparation { get; set; }

    /// <summary>
    /// 準備指示事項（任意）
    /// イベントの事前準備に関する指示・注意事項
    /// </summary>
    public string? PreparationInstructions { get; set; }

    /// <summary>
    /// 作成者
    /// イベントを作成したスタッフ名
    /// </summary>
    public string CreatedBy { get; set; } = string.Empty;

    /// <summary>
    /// 作成日時
    /// イベント情報が作成された日時
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 最終更新日時
    /// イベント情報が最後に更新された日時
    /// </summary>
    public DateTime LastModified { get; set; }

    /// <summary>
    /// アクティブ状態
    /// イベントが有効かどうか
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// 保育園ID
    /// イベントを主催する保育園の識別子
    /// </summary>
    public int NurseryId { get; set; }

    /// <summary>
    /// 対象クラスID（任意）
    /// イベントの対象クラス識別子（特定クラス対象の場合）
    /// </summary>
    public string? TargetClassId { get; set; }

    /// <summary>
    /// 対象園児ID（任意）
    /// イベントの対象園児識別子（個人対象の場合）
    /// </summary>
    public int? TargetChildId { get; set; }
}

public class EventResponseDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = string.Empty;
    public DateTime StartDateTime { get; set; }
    public DateTime EndDateTime { get; set; }
    public bool IsAllDay { get; set; }
    public string RecurrencePattern { get; set; } = string.Empty;
    public string TargetAudience { get; set; } = string.Empty;
    public bool RequiresPreparation { get; set; }
    public string? PreparationInstructions { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime LastModified { get; set; }
    public string? TargetClassId { get; set; }
    public int? TargetChildId { get; set; }
}

public class CalendarEventDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = string.Empty;
    public DateTime StartDateTime { get; set; }
    public DateTime EndDateTime { get; set; }
    public bool IsAllDay { get; set; }
    public bool RequiresPreparation { get; set; }
    public string? Location { get; set; }
    public string CategoryDisplayName { get; set; } = string.Empty;
    public string CategoryColor { get; set; } = string.Empty;
}

public class EventsQueryDto
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? Category { get; set; }
    public string? TargetAudience { get; set; }
    public int Page { get; set; } = 1;
    public int Limit { get; set; } = 50;
}