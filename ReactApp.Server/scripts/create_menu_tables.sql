-- ============================================
-- 献立管理機能テーブル作成スクリプト
-- ============================================

-- 1. AllergenMaster（アレルゲンマスター）テーブル
create table [dbo].[AllergenMaster] (
  [Id] int identity not null
  , [AllergenName] nvarchar(50) not null
  , [SortOrder] int not null
  , [CreatedAt] datetime2 default [dbo].[GetJstDateTime]() not null
)
/

-- インデックスの作成
create index IX_AllergenMaster_SortOrder on [dbo].[AllergenMaster]([SortOrder])
/

-- 主キーの作成
alter table [dbo].[AllergenMaster] add constraint [PK__AllergenMaster] primary key ([Id])
/

-- コメントの作成
EXECUTE sp_addextendedproperty N'MS_Description', N'アレルゲンマスター', N'SCHEMA', N'dbo', N'TABLE', N'AllergenMaster', NULL, NULL
/

EXECUTE sp_addextendedproperty N'MS_Description', N'アレルゲンID', N'SCHEMA', N'dbo', N'TABLE', N'AllergenMaster', N'COLUMN', N'Id'
/

EXECUTE sp_addextendedproperty N'MS_Description', N'アレルゲン名（例：卵、牛乳・乳製品、小麦）', N'SCHEMA', N'dbo', N'TABLE', N'AllergenMaster', N'COLUMN', N'AllergenName'
/

EXECUTE sp_addextendedproperty N'MS_Description', N'表示順', N'SCHEMA', N'dbo', N'TABLE', N'AllergenMaster', N'COLUMN', N'SortOrder'
/

EXECUTE sp_addextendedproperty N'MS_Description', N'作成日時', N'SCHEMA', N'dbo', N'TABLE', N'AllergenMaster', N'COLUMN', N'CreatedAt'
/


-- 2. MenuMaster（献立マスター）テーブル
create table [dbo].[MenuMaster] (
  [Id] int identity not null
  , [NurseryId] int not null
  , [MenuName] nvarchar(200) not null
  , [IngredientName] nvarchar(200)
  , [Allergens] nvarchar(200)
  , [Description] nvarchar(500)
  , [CreatedAt] datetime2 default [dbo].[GetJstDateTime]() not null
  , [UpdatedAt] datetime2 default [dbo].[GetJstDateTime]() not null
)
/

-- インデックスの作成
create index IX_MenuMaster_NurseryId on [dbo].[MenuMaster]([NurseryId])
/

create index IX_MenuMaster_MenuName on [dbo].[MenuMaster]([MenuName])
/

-- 主キーの作成
alter table [dbo].[MenuMaster] add constraint [PK__MenuMaster] primary key ([Id])
/

-- コメントの作成
EXECUTE sp_addextendedproperty N'MS_Description', N'献立マスター', N'SCHEMA', N'dbo', N'TABLE', N'MenuMaster', NULL, NULL
/

EXECUTE sp_addextendedproperty N'MS_Description', N'献立ID', N'SCHEMA', N'dbo', N'TABLE', N'MenuMaster', N'COLUMN', N'Id'
/

EXECUTE sp_addextendedproperty N'MS_Description', N'保育園ID', N'SCHEMA', N'dbo', N'TABLE', N'MenuMaster', N'COLUMN', N'NurseryId'
/

EXECUTE sp_addextendedproperty N'MS_Description', N'献立名（例：カレーライス、白身魚のフライ、みかん）', N'SCHEMA', N'dbo', N'TABLE', N'MenuMaster', N'COLUMN', N'MenuName'
/

EXECUTE sp_addextendedproperty N'MS_Description', N'食材名（例：豚肉、じゃがいも、カレールウ）', N'SCHEMA', N'dbo', N'TABLE', N'MenuMaster', N'COLUMN', N'IngredientName'
/

EXECUTE sp_addextendedproperty N'MS_Description', N'アレルゲン（カンマ区切りID：例：3,28）', N'SCHEMA', N'dbo', N'TABLE', N'MenuMaster', N'COLUMN', N'Allergens'
/

EXECUTE sp_addextendedproperty N'MS_Description', N'説明・備考', N'SCHEMA', N'dbo', N'TABLE', N'MenuMaster', N'COLUMN', N'Description'
/

EXECUTE sp_addextendedproperty N'MS_Description', N'作成日時', N'SCHEMA', N'dbo', N'TABLE', N'MenuMaster', N'COLUMN', N'CreatedAt'
/

EXECUTE sp_addextendedproperty N'MS_Description', N'更新日時', N'SCHEMA', N'dbo', N'TABLE', N'MenuMaster', N'COLUMN', N'UpdatedAt'
/


-- 3. DailyMenus（日別献立）テーブル
create table [dbo].[DailyMenus] (
  [Id] int identity not null
  , [NurseryId] int not null
  , [MenuDate] date not null
  , [MenuType] nvarchar(50) not null
  , [MenuMasterId] int not null
  , [SortOrder] int not null default 0
  , [Notes] nvarchar(500)
  , [CreatedAt] datetime2 default [dbo].[GetJstDateTime]() not null
  , [UpdatedAt] datetime2 default [dbo].[GetJstDateTime]() not null
  , constraint FK_DailyMenus_MenuMaster foreign key ([MenuMasterId]) references [dbo].[MenuMaster]([Id])
)
/

-- インデックスの作成
create index IX_DailyMenus_NurseryId on [dbo].[DailyMenus]([NurseryId])
/

create index IX_DailyMenus_MenuDate on [dbo].[DailyMenus]([MenuDate])
/

create index IX_DailyMenus_MenuType on [dbo].[DailyMenus]([MenuType])
/

create index IX_DailyMenus_NurseryDate on [dbo].[DailyMenus]([NurseryId], [MenuDate])
/

create index IX_DailyMenus_MenuMasterId on [dbo].[DailyMenus]([MenuMasterId])
/

create index IX_DailyMenus_SortOrder on [dbo].[DailyMenus]([SortOrder])
/

-- 主キーの作成
alter table [dbo].[DailyMenus] add constraint [PK__DailyMenus] primary key ([Id])
/

-- ユニーク制約: 同じ日・同じタイプで同じ献立マスターは重複不可
alter table [dbo].[DailyMenus] add constraint UQ_DailyMenus_Date_Type_Master unique ([NurseryId], [MenuDate], [MenuType], [MenuMasterId])
/

-- コメントの作成
EXECUTE sp_addextendedproperty N'MS_Description', N'日別献立', N'SCHEMA', N'dbo', N'TABLE', N'DailyMenus', NULL, NULL
/

EXECUTE sp_addextendedproperty N'MS_Description', N'日別献立ID', N'SCHEMA', N'dbo', N'TABLE', N'DailyMenus', N'COLUMN', N'Id'
/

EXECUTE sp_addextendedproperty N'MS_Description', N'保育園ID', N'SCHEMA', N'dbo', N'TABLE', N'DailyMenus', N'COLUMN', N'NurseryId'
/

EXECUTE sp_addextendedproperty N'MS_Description', N'提供日', N'SCHEMA', N'dbo', N'TABLE', N'DailyMenus', N'COLUMN', N'MenuDate'
/

EXECUTE sp_addextendedproperty N'MS_Description', N'種類（Lunch/MorningSnack/AfternoonSnack）', N'SCHEMA', N'dbo', N'TABLE', N'DailyMenus', N'COLUMN', N'MenuType'
/

EXECUTE sp_addextendedproperty N'MS_Description', N'献立マスターID', N'SCHEMA', N'dbo', N'TABLE', N'DailyMenus', N'COLUMN', N'MenuMasterId'
/

EXECUTE sp_addextendedproperty N'MS_Description', N'表示順（同じ日・種類内での並び順）', N'SCHEMA', N'dbo', N'TABLE', N'DailyMenus', N'COLUMN', N'SortOrder'
/

EXECUTE sp_addextendedproperty N'MS_Description', N'当日の特記事項', N'SCHEMA', N'dbo', N'TABLE', N'DailyMenus', N'COLUMN', N'Notes'
/

EXECUTE sp_addextendedproperty N'MS_Description', N'作成日時', N'SCHEMA', N'dbo', N'TABLE', N'DailyMenus', N'COLUMN', N'CreatedAt'
/

EXECUTE sp_addextendedproperty N'MS_Description', N'更新日時', N'SCHEMA', N'dbo', N'TABLE', N'DailyMenus', N'COLUMN', N'UpdatedAt'
/


-- ============================================
-- アレルゲンマスター初期データ投入
-- ============================================
insert into [dbo].[AllergenMaster] ([AllergenName], [SortOrder]) values
(N'卵', 1),
(N'牛乳・乳製品', 2),
(N'小麦', 3),
(N'そば', 4),
(N'落花生（ピーナッツ）', 5),
(N'えび', 6),
(N'かに', 7),
(N'アーモンド', 8),
(N'あわび', 9),
(N'いか', 10),
(N'いくら', 11),
(N'オレンジ', 12),
(N'カシューナッツ', 13),
(N'キウイフルーツ', 14),
(N'牛肉', 15),
(N'くるみ', 16),
(N'ごま', 17),
(N'さけ', 18),
(N'さば', 19),
(N'大豆', 20),
(N'鶏肉', 21),
(N'バナナ', 22),
(N'豚肉', 23),
(N'まつたけ', 24),
(N'もも', 25),
(N'やまいも', 26),
(N'りんご', 27),
(N'ゼラチン', 28)
/

-- ============================================
-- スクリプト実行完了
-- ============================================
