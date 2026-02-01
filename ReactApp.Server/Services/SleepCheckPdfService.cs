using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using ReactApp.Server.DTOs.InfantRecords;

namespace ReactApp.Server.Services;

/// <summary>
/// 午睡チェックPDF生成サービス
/// </summary>
public interface ISleepCheckPdfService
{
    /// <summary>
    /// 午睡チェック表のPDFを生成
    /// </summary>
    byte[] GenerateSleepCheckPdf(SleepCheckGridDto gridData);
}

public class SleepCheckPdfService : ISleepCheckPdfService
{
    public byte[] GenerateSleepCheckPdf(SleepCheckGridDto gridData)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                // A3横向き
                page.Size(PageSizes.A3.Landscape());
                page.Margin(20);

                // ヘッダー
                page.Header().Element(ComposeHeader);

                // コンテンツ
                page.Content().Element(container => ComposeContent(container, gridData));

                // フッター
                page.Footer().AlignCenter().Text(text =>
                {
                    text.Span("ページ ");
                    text.CurrentPageNumber();
                    text.Span(" / ");
                    text.TotalPages();
                });
            });
        });

        return document.GeneratePdf();
    }

    private void ComposeHeader(IContainer container)
    {
        container.Column(column =>
        {
            column.Item().Text("午睡チェック表").FontSize(20).Bold();
            column.Item().PaddingTop(5).Text($"生成日時: {DateTime.Now:yyyy年MM月dd日 HH:mm}").FontSize(10);
        });
    }

    private void ComposeContent(IContainer container, SleepCheckGridDto gridData)
    {
        container.Column(column =>
        {
            // クラス名と日付
            column.Item().PaddingBottom(10).Row(row =>
            {
                row.RelativeItem().Text($"クラス: {gridData.ClassName}").FontSize(12).Bold();
                row.RelativeItem().Text($"記録日: {gridData.RecordDate:yyyy/MM/dd}").FontSize(12).Bold();
            });

            // 環境情報
            if (gridData.RoomTemperature.HasValue || gridData.Humidity.HasValue)
            {
                column.Item().PaddingBottom(10).Row(row =>
                {
                    if (gridData.RoomTemperature.HasValue)
                    {
                        row.AutoItem().Text($"室温: {gridData.RoomTemperature}℃  ").FontSize(10);
                    }
                    if (gridData.Humidity.HasValue)
                    {
                        row.AutoItem().Text($"湿度: {gridData.Humidity}%").FontSize(10);
                    }
                });
            }

            // セッションごとにグループ化して表示
            var sessions = GroupBySequenceAndTime(gridData);

            foreach (var session in sessions)
            {
                column.Item().PaddingTop(10).Element(container => ComposeSessionTable(container, session, gridData));
            }

            // 凡例
            column.Item().PaddingTop(15).Element(ComposeLegend);
        });
    }

    private List<SessionGroup> GroupBySequenceAndTime(SleepCheckGridDto gridData)
    {
        var allChecks = gridData.Children.SelectMany(c => c.Checks).ToList();
        var sequences = allChecks.Select(c => c.SleepSequence).Distinct().OrderBy(s => s).ToList();

        var result = new List<SessionGroup>();

        foreach (var seq in sequences)
        {
            var childrenInSeq = gridData.Children
                .Select(child => new ChildSleepCheckDto
                {
                    ChildId = child.ChildId,
                    ChildName = child.ChildName,
                    AgeInMonths = child.AgeInMonths,
                    SleepStartTime = child.SleepStartTime,
                    SleepEndTime = child.SleepEndTime,
                    Checks = child.Checks.Where(check => check.SleepSequence == seq).ToList()
                })
                .Where(child => child.Checks.Any())
                .ToList();

            // 時間帯でさらにグループ化
            var childrenWithTimeRanges = childrenInSeq.Select(child =>
            {
                var times = child.Checks.Select(c =>
                {
                    var parts = c.CheckTime.Split(':');
                    return int.Parse(parts[0]) * 60 + int.Parse(parts[1]);
                }).ToList();

                return new
                {
                    Child = child,
                    Start = times.Min(),
                    End = times.Max()
                };
            }).ToList();

            var timeGroups = new List<List<(ChildSleepCheckDto Child, int Start, int End)>>();

            foreach (var item in childrenWithTimeRanges)
            {
                var foundGroup = timeGroups.FirstOrDefault(group =>
                {
                    var groupStart = group.Min(g => g.Start);
                    var groupEnd = group.Max(g => g.End);
                    return HasTimeOverlap(item.Start, item.End, groupStart, groupEnd);
                });

                if (foundGroup != null)
                {
                    foundGroup.Add((item.Child, item.Start, item.End));
                }
                else
                {
                    timeGroups.Add(new List<(ChildSleepCheckDto, int, int)> { (item.Child, item.Start, item.End) });
                }
            }

            foreach (var group in timeGroups)
            {
                result.Add(new SessionGroup
                {
                    Sequence = seq,
                    Children = group.Select(g => g.Child).ToList()
                });
            }
        }

        return result;
    }

    private bool HasTimeOverlap(int start1, int end1, int start2, int end2, int gapThresholdMinutes = 30)
    {
        return !(end1 + gapThresholdMinutes < start2 || end2 + gapThresholdMinutes < start1);
    }

    private void ComposeSessionTable(IContainer container, SessionGroup session, SleepCheckGridDto gridData)
    {
        var sessionChecks = session.Children.SelectMany(c => c.Checks).ToList();
        var timeSlots = GenerateTimeSlots(sessionChecks);

        // 各時刻スロットごとの最大チェック数を計算し、列幅を決定
        var timeSlotWidths = new Dictionary<string, int>();
        foreach (var time in timeSlots)
        {
            var maxChecks = session.Children.Max(child => GetChecksForTime(child, time).Count());
            timeSlotWidths[time] = maxChecks > 1 ? 100 : 50;
        }

        // A3横向きページ幅制限を考慮
        // 利用可能幅: 約1075pt - 固定列幅(園児名67pt + 入眠50pt + 起床50pt) = 908pt
        const int availableWidthForTimeSlots = 908;

        // 実際に使用する時刻スロットを幅制限内で選択
        var displayTimeSlots = new List<string>();
        var currentWidth = 0;
        foreach (var time in timeSlots)
        {
            var slotWidth = timeSlotWidths[time];
            if (currentWidth + slotWidth <= availableWidthForTimeSlots)
            {
                displayTimeSlots.Add(time);
                currentWidth += slotWidth;
            }
            else
            {
                break;
            }
        }

        container.Table(table =>
            {
            // 列定義: 園児名 + 入眠時刻 + 各時刻 + 起床時刻
            table.ColumnsDefinition(columns =>
            {
                columns.ConstantColumn(67); // 園児名（100ptの2/3 ≈ 67pt）
                columns.ConstantColumn(50);  // 入眠時刻
                foreach (var time in displayTimeSlots)
                {
                    columns.ConstantColumn(timeSlotWidths[time]); // 各時刻（個別の動的幅）
                }
                columns.ConstantColumn(50);  // 起床時刻
            });

            // ヘッダー行
            table.Header(header =>
            {
                header.Cell().Element(HeaderCellStyle).Text("園児名").FontSize(9);
                header.Cell().Element(HeaderCellStyle).Text("入眠時刻").FontSize(8);

                foreach (var time in displayTimeSlots)
                {
                    header.Cell().Element(HeaderCellStyle).Text(time).FontSize(9);
                }

                header.Cell().Element(HeaderCellStyle).Text("起床時刻").FontSize(8);
            });

                // データ行
                foreach (var child in session.Children)
                {
                    var checkTimes = child.Checks.Select(c => c.CheckTime).OrderBy(t => t).ToList();
                    var sessionStartTime = checkTimes.Any() ? checkTimes.First() : "-";
                    var sessionEndTime = checkTimes.Any() ? checkTimes.Last() : "-";

                    // 園児名セル
                    table.Cell().Element(DataCellStyle).Column(col =>
                    {
                        col.Item().Text(child.ChildName).FontSize(9);
                        col.Item().Text($"{child.AgeInMonths / 12}歳{child.AgeInMonths % 12}ヶ月").FontSize(7);
                        col.Item().Text($"{session.Sequence}回目").FontSize(7).FontColor(Colors.Blue.Medium);
                    });

                    // 入眠時刻
                    table.Cell().Element(DataCellStyle).Text(sessionStartTime).FontSize(8);

                    // 各時刻のチェック記録
                    foreach (var time in displayTimeSlots)
                    {
                        var checks = GetChecksForTime(child, time);
                        table.Cell().Element(DataCellStyle).Row(row =>
                        {
                            foreach (var check in checks)
                            {
                                var minute = check.CheckTime.Split(':')[1];
                                row.AutoItem().PaddingRight(checks.Count() > 1 ? 5 : 0).Column(col =>
                                {
                                    col.Item().Text($"{minute}分").FontSize(7).FontColor(Colors.Blue.Medium);
                                    col.Item().Text($"呼:{GetBreathingText(check.BreathingStatus)}").FontSize(7);
                                    col.Item().Text($"勢:{GetBodyPositionText(check.BodyPosition)}").FontSize(7);
                                    col.Item().Text($"頭:{GetHeadDirectionText(check.HeadDirection)}").FontSize(7);
                                    col.Item().Text($"温:{GetBodyTempText(check.BodyTemperature)}").FontSize(7);
                                    col.Item().Text($"顔:{GetFaceColorText(check.FaceColor)}").FontSize(7);
                                });
                            }
                        });
                    }

                // 起床時刻
                table.Cell().Element(DataCellStyle).Text(sessionEndTime).FontSize(8);
            }
        });
    }

    private List<string> GenerateTimeSlots(List<InfantSleepCheckDto> checks)
    {
        if (!checks.Any()) return new List<string>();

        // 実際にチェック記録が存在する時刻のみをスロットとして生成（5分単位に丸める）
        var slots = checks
            .Select(c =>
            {
                var parts = c.CheckTime.Split(':');
                var totalMinutes = int.Parse(parts[0]) * 60 + int.Parse(parts[1]);
                var rounded = (int)Math.Floor(totalMinutes / 5.0) * 5;
                var hours = rounded / 60;
                var minutes = rounded % 60;
                return $"{hours:D2}:{minutes:D2}";
            })
            .Distinct()
            .OrderBy(t => t)
            .ToList();

        return slots;
    }

    private IEnumerable<InfantSleepCheckDto> GetChecksForTime(ChildSleepCheckDto child, string time)
    {
        var parts = time.Split(':');
        var headerTotalMinutes = int.Parse(parts[0]) * 60 + int.Parse(parts[1]);

        return child.Checks.Where(c =>
        {
            var checkParts = c.CheckTime.Split(':');
            var checkTotalMinutes = int.Parse(checkParts[0]) * 60 + int.Parse(checkParts[1]);
            return checkTotalMinutes >= headerTotalMinutes && checkTotalMinutes < headerTotalMinutes + 5;
        });
    }

    private IContainer HeaderCellStyle(IContainer container)
    {
        return container
            .Border(0.5f)
            .Background(Colors.Grey.Lighten3)
            .Padding(5)
            .AlignCenter()
            .AlignMiddle();
    }

    private IContainer DataCellStyle(IContainer container)
    {
        return container
            .Border(0.5f)
            .Padding(3)
            .AlignCenter()
            .AlignMiddle();
    }

    private void ComposeLegend(IContainer container)
    {
        container.Border(1).Padding(10).Column(column =>
        {
            column.Item().Text("記号凡例").FontSize(10).Bold();

            column.Item().PaddingTop(5).Row(row =>
            {
                row.AutoItem().PaddingRight(20).Text("呼吸: 正=正常 / 異=異常").FontSize(8);
                row.AutoItem().PaddingRight(20).Text("体勢: 仰=仰向け / 横=横向き / う=うつ伏せ").FontSize(8);
                row.AutoItem().Text("頭向き: 左=左 / 右=右 / 上=上").FontSize(8);
            });

            column.Item().PaddingTop(2).Row(row =>
            {
                row.AutoItem().PaddingRight(20).Text("体温: 正=正常 / 温=やや温かい / 熱=熱あり / 冷=冷たい").FontSize(8);
                row.AutoItem().Text("顔色: 正=正常 / 蒼=蒼白 / 紫=紫色 / 紅=紅潮").FontSize(8);
            });
        });
    }

    private string GetBreathingText(string status) => status == "Normal" ? "正" : "異";

    private string GetHeadDirectionText(string direction) => direction switch
    {
        "Left" => "左",
        "Right" => "右",
        "FaceUp" => "上",
        _ => ""
    };

    private string GetBodyTempText(string temp) => temp switch
    {
        "Normal" => "正",
        "SlightlyWarm" => "温",
        "Hot" => "熱",
        "Cold" => "冷",
        _ => ""
    };

    private string GetFaceColorText(string color) => color switch
    {
        "Normal" => "正",
        "Pale" => "蒼",
        "Purple" => "紫",
        "Flushed" => "紅",
        _ => ""
    };

    private string GetBodyPositionText(string position) => position switch
    {
        "OnBack" => "仰",
        "OnSide" => "横",
        "FaceDown" => "う",
        _ => ""
    };

    private class SessionGroup
    {
        public int Sequence { get; set; }
        public List<ChildSleepCheckDto> Children { get; set; } = new();
    }
}
