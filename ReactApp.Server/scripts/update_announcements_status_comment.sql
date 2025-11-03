-- Announcementsテーブルのステータスコメントを修正

EXEC sp_dropextendedproperty
  @name = N'MS_Description',
  @level0type = N'SCHEMA', @level0name = N'dbo',
  @level1type = N'TABLE', @level1name = N'Announcements',
  @level2type = N'COLUMN', @level2name = N'Status';

EXEC sp_addextendedproperty
  @name = N'MS_Description',
  @value = N'ステータス（draft:下書き/scheduled:予約配信/published:公開済み）',
  @level0type = N'SCHEMA', @level0name = N'dbo',
  @level1type = N'TABLE', @level1name = N'Announcements',
  @level2type = N'COLUMN', @level2name = N'Status';
