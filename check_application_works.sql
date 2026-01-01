-- ApplicationWorksテーブルのRelationshipToChildを確認
SELECT TOP 10
    Id,
    ApplicantName,
    ChildName,
    RelationshipToChild,
    ApplicationStatus,
    CreatedAt
FROM ApplicationWorks
ORDER BY CreatedAt DESC;

-- RelationshipToChildの値の種類を確認
SELECT DISTINCT RelationshipToChild
FROM ApplicationWorks
WHERE RelationshipToChild IS NOT NULL;
