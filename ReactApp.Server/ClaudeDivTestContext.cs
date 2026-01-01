using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace ReactApp.Server;

public partial class ClaudeDivTestContext : DbContext
{
    public ClaudeDivTestContext()
    {
    }

    public ClaudeDivTestContext(DbContextOptions<ClaudeDivTestContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Nurseries> Nurseries { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        => optionsBuilder.UseSqlServer("Name=ConnectionStrings:DefaultConnection");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Nurseries>(entity =>
        {
            entity.ToTable(tb => tb.HasComment("保育園マスタ"));

            entity.HasIndex(e => e.CurrentAcademicYear, "IX_Nurseries_CurrentAcademicYear");

            entity.HasIndex(e => e.LoginId, "IX_Nurseries_LoginID");

            entity.HasIndex(e => e.Name, "IX_Nurseries_Name");

            entity.HasIndex(e => e.Email, "UK_Nurseries_Email").IsUnique();

            entity.HasIndex(e => e.PhoneNumber, "UK_Nurseries_PhoneNumber").IsUnique();

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasComment("保育園ID");
            entity.Property(e => e.Address)
                .HasMaxLength(500)
                .HasComment("住所");
            entity.Property(e => e.ApplicationKey)
                .HasMaxLength(50)
                .HasComment("入園申込キー");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasComment("作成日時");
            entity.Property(e => e.CurrentAcademicYear)
                .HasDefaultValueSql("(datepart(year,getdate()))")
                .HasComment("現在の年度");
            entity.Property(e => e.Email)
                .HasMaxLength(255)
                .HasComment("メールアドレス");
            entity.Property(e => e.EstablishedDate).HasComment("設立日");
            entity.Property(e => e.IsLocked).HasComment("アカウントロック状態");
            entity.Property(e => e.LastLoginAt).HasComment("最終ログイン日時");
            entity.Property(e => e.LockedUntil).HasComment("ロック解除日時");
            entity.Property(e => e.LoginAttempts).HasComment("ログイン試行回数");
            entity.Property(e => e.LoginId)
                .HasMaxLength(10)
                .HasComment("ログインID")
                .HasColumnName("LoginID");
            entity.Property(e => e.LogoUrl)
                .HasMaxLength(500)
                .HasComment("ロゴURL");
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .HasComment("保育園名");
            entity.Property(e => e.Password)
                .HasMaxLength(255)
                .HasComment("パスワード");
            entity.Property(e => e.PhoneNumber)
                .HasMaxLength(20)
                .HasComment("電話番号");
            entity.Property(e => e.PrincipalName)
                .HasMaxLength(100)
                .HasComment("園長名");
            entity.Property(e => e.UpdatedAt).HasComment("更新日時");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
