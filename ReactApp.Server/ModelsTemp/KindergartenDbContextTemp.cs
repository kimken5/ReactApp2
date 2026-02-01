using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace ReactApp.Server.ModelsTemp;

public partial class KindergartenDbContextTemp : DbContext
{
    public KindergartenDbContextTemp(DbContextOptions<KindergartenDbContextTemp> options)
        : base(options)
    {
    }

    public virtual DbSet<InfantMood> InfantMoods { get; set; }

    public virtual DbSet<InfantToileting> InfantToiletings { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<InfantMood>(entity =>
        {
            entity.HasKey(e => new { e.NurseryId, e.ChildId, e.RecordDate, e.RecordTime });

            entity.ToTable(tb => tb.HasComment("乳児機嫌記録"));

            entity.HasIndex(e => new { e.NurseryId, e.ChildId, e.RecordDate }, "IX_InfantMoods_Child_Date").IsDescending(false, false, true);

            entity.Property(e => e.NurseryId).HasComment("保育園ID");
            entity.Property(e => e.ChildId).HasComment("園児ID");
            entity.Property(e => e.RecordDate).HasComment("記録日");
            entity.Property(e => e.RecordTime).HasComment("記録時刻");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("([dbo].[GetJstDateTime]())")
                .HasComment("作成日時");
            entity.Property(e => e.CreatedBy).HasComment("作成者ID");
            entity.Property(e => e.MoodState)
                .HasMaxLength(20)
                .HasComment("機嫌状態（Good:良い/Normal:普通/Bad:不機嫌/Crying:泣いている）");
            entity.Property(e => e.Notes)
                .HasMaxLength(500)
                .HasComment("様子・特記事項");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("([dbo].[GetJstDateTime]())")
                .HasComment("更新日時");
            entity.Property(e => e.UpdatedBy).HasComment("更新者ID");
        });

        modelBuilder.Entity<InfantToileting>(entity =>
        {
            entity.HasKey(e => new { e.NurseryId, e.ChildId, e.RecordDate, e.ToiletingTime });

            entity.ToTable("InfantToileting", tb => tb.HasComment("乳児排泄記録"));

            entity.HasIndex(e => new { e.NurseryId, e.ChildId, e.RecordDate }, "IX_InfantToileting_Child_Date").IsDescending(false, false, true);

            entity.Property(e => e.NurseryId).HasComment("保育園ID");
            entity.Property(e => e.ChildId).HasComment("園児ID");
            entity.Property(e => e.RecordDate).HasComment("記録日");
            entity.Property(e => e.ToiletingTime).HasComment("排泄時刻");
            entity.Property(e => e.BowelAmount)
                .HasMaxLength(20)
                .HasComment("うんち量（Little:少量/Normal:普通/Lot:多量）");
            entity.Property(e => e.BowelCondition)
                .HasMaxLength(20)
                .HasComment("うんちの種類（Normal:正常/Soft:軟便/Diarrhea:下痢/Hard:硬い/Bloody:血便）");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("([dbo].[GetJstDateTime]())")
                .HasComment("作成日時");
            entity.Property(e => e.CreatedBy).HasComment("作成者ID");
            entity.Property(e => e.HasStool).HasComment("うんちありフラグ");
            entity.Property(e => e.HasUrine).HasComment("おしっこありフラグ");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("([dbo].[GetJstDateTime]())")
                .HasComment("更新日時");
            entity.Property(e => e.UpdatedBy).HasComment("更新者ID");
            entity.Property(e => e.UrineAmount)
                .HasMaxLength(20)
                .HasComment("おしっこ量（Little:少量/Normal:普通/Lot:多量）");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
