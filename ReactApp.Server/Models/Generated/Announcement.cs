using System;
using System.Collections.Generic;

namespace ReactApp.Server.Models.Generated;

public partial class Announcement
{
    public int Id { get; set; }

    public int NurseryId { get; set; }

    public int StaffId { get; set; }

    public string Title { get; set; } = null!;

    public string Content { get; set; } = null!;

    public string Category { get; set; } = null!;

    public string TargetScope { get; set; } = null!;

    public string? TargetClassIds { get; set; }

    public string? TargetChildIds { get; set; }

    public string? Attachments { get; set; }

    public string Status { get; set; } = null!;

    public string Priority { get; set; } = null!;

    public bool AllowComments { get; set; }

    public DateTime? PublishedAt { get; set; }

    public DateTime? ScheduledAt { get; set; }

    public int ReadCount { get; set; }

    public int CommentCount { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public bool IsActive { get; set; }
}
