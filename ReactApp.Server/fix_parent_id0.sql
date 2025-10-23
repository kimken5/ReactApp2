-- ParentId=0のレコードを削除
DELETE FROM FamilyMembers WHERE ParentId = 0;
DELETE FROM Parents WHERE Id = 0;
