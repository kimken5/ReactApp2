using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ReactApp.Server.Data;
using ReactApp.Server.DTOs;
using ReactApp.Server.Models;
using ReactApp.Server.Exceptions;
using ReactApp.Server.Helpers;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// 家族管理サービス実装クラス
    /// メンバー管理・アクセス権限制御の業務ロジックを提供
    /// 保護者間の安全な情報共有基盤を実現
    /// </summary>
    public class FamilyService : IFamilyService
    {
        // 依存サービス
        private readonly KindergartenDbContext _context;     // データベースコンテキスト
        private readonly IMapper _mapper;                    // オブジェクトマッピングサービス
        private readonly ILogger<FamilyService> _logger;     // ログ出力サービス

        /// <summary>
        /// FamilyServiceコンストラクタ
        /// 必要な依存サービスを注入により受け取り初期化
        /// </summary>
        /// <param name="context">データベースコンテキスト</param>
        /// <param name="mapper">オブジェクトマッピングサービス</param>
        /// <param name="logger">ログ出力サービス</param>
        public FamilyService(
            KindergartenDbContext context,
            IMapper mapper,
            ILogger<FamilyService> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<FamilyMemberDto> CreateFamilyMemberAsync(int inviterParentId, CreateFamilyMemberDto dto)
        {
            // 登録者の存在確認
            var inviter = await _context.Parents.FindAsync(inviterParentId);
            if (inviter == null)
            {
                throw new BusinessException("登録者が見つかりません。");
            }

            // 園児へのアクセス権限確認
            var relationship = await _context.ParentChildRelationships
                .FirstOrDefaultAsync(pcr => pcr.ParentId == inviterParentId && pcr.ChildId == dto.ChildId && pcr.IsActive);

            if (relationship == null)
            {
                throw new UnauthorizedException("この園児への登録権限がありません。");
            }

            // 新しい保護者アカウントを作成または取得
            var existingParent = await _context.Parents
                .FirstOrDefaultAsync(p => p.PhoneNumber == dto.PhoneNumber);

            Parent newParent;
            if (existingParent != null)
            {
                // 既存のParentが削除済み(IsActive=false)の場合は再アクティブ化
                if (!existingParent.IsActive)
                {
                    existingParent.IsActive = true;
                    existingParent.Name = dto.Name;
                    existingParent.UpdatedAt = DateTimeHelper.GetJstNow();
                }
                newParent = existingParent;
                await _context.SaveChangesAsync();
            }
            else
            {
                // 新規保護者作成
                newParent = new Parent
                {
                    Name = dto.Name,
                    PhoneNumber = dto.PhoneNumber,
                    IsActive = true,
                    CreatedAt = DateTimeHelper.GetJstNow()
                };
                _context.Parents.Add(newParent);
                await _context.SaveChangesAsync();
            }

            // 既存のFamilyMemberレコードをチェック
            var existingMember = await _context.FamilyMembers
                .FirstOrDefaultAsync(fm => fm.ParentId == newParent.Id &&
                                          fm.NurseryId == relationship.NurseryId &&
                                          fm.ChildId == dto.ChildId);

            FamilyMember familyMember;

            if (existingMember != null)
            {
                // 既存レコードがアクティブな場合はエラー
                if (existingMember.IsActive)
                {
                    throw new BusinessException("この家族メンバーは既に登録されています。");
                }

                // 削除済み（IsActive=false）の場合は再アクティブ化
                existingMember.IsActive = true;
                existingMember.DisplayName = dto.Name;
                existingMember.RelationshipType = dto.RelationshipType;
                existingMember.UpdatedAt = DateTimeHelper.GetJstNow();
                existingMember.JoinedAt = DateTimeHelper.GetJstNow();

                // Parentも再アクティブ化
                if (newParent != null && !newParent.IsActive)
                {
                    newParent.IsActive = true;
                    newParent.UpdatedAt = DateTimeHelper.GetJstNow();
                }

                // ParentChildRelationshipも再アクティブ化
                var existingRelationship = await _context.ParentChildRelationships
                    .FirstOrDefaultAsync(pcr => pcr.ParentId == newParent.Id && pcr.ChildId == dto.ChildId);
                if (existingRelationship != null && !existingRelationship.IsActive)
                {
                    existingRelationship.IsActive = true;
                    existingRelationship.UpdatedAt = DateTimeHelper.GetJstNow();
                }

                familyMember = existingMember;
            }
            else
            {
                // FamilyMemberレコード作成
                familyMember = new FamilyMember
            {
                ParentId = newParent.Id,
                NurseryId = relationship.NurseryId,
                ChildId = dto.ChildId,
                RelationshipType = dto.RelationshipType,
                DisplayName = dto.Name,
                IsPrimaryContact = false,
                CanReceiveNotifications = true,
                CanViewReports = true,
                CanViewPhotos = true,
                HasPickupPermission = false,
                JoinedAt = DateTimeHelper.GetJstNow(),
                CreatedAt = DateTimeHelper.GetJstNow(),
                InvitedByParentId = inviterParentId,
                IsActive = true
            };
                _context.FamilyMembers.Add(familyMember);
            }

            await _context.SaveChangesAsync();

            // DTOに変換して返す
            var child = await _context.Children
                .FirstOrDefaultAsync(c => c.NurseryId == relationship.NurseryId && c.ChildId == dto.ChildId);

            return new FamilyMemberDto
            {
                Id = familyMember.Id,
                ParentId = newParent.Id,
                ParentName = newParent.Name,
                ParentPhoneNumber = newParent.PhoneNumber,
                ChildId = dto.ChildId,
                ChildName = child?.Name ?? "",
                RelationshipType = familyMember.RelationshipType,
                DisplayName = familyMember.DisplayName,
                IsPrimaryContact = familyMember.IsPrimaryContact,
                CanReceiveNotifications = familyMember.CanReceiveNotifications,
                CanViewReports = familyMember.CanViewReports,
                CanViewPhotos = familyMember.CanViewPhotos,
                HasPickupPermission = familyMember.HasPickupPermission,
                JoinedAt = familyMember.JoinedAt,
                CreatedAt = familyMember.CreatedAt,
                IsActive = familyMember.IsActive,
                InvitedByParentId = inviterParentId,
                InvitedByParentName = inviter.Name
            };
        }

        public async Task<IEnumerable<FamilyMemberDto>> GetFamilyMembersByChildAsync(int childId)
        {
            var members = await (from fm in _context.FamilyMembers
                                 join p in _context.Parents on fm.ParentId equals p.Id
                                 join c in _context.Children on new { fm.NurseryId, fm.ChildId } equals new { c.NurseryId, c.ChildId }
                                 where fm.ChildId == childId && fm.IsActive
                                 orderby fm.JoinedAt
                                 select new FamilyMemberDto
                                 {
                                     Id = fm.Id,
                                     ParentId = fm.ParentId,
                                     ParentName = p.Name,
                                     ParentPhoneNumber = p.PhoneNumber,
                                     ChildId = fm.ChildId,
                                     ChildName = c.Name,
                                     RelationshipType = fm.RelationshipType,
                                     DisplayName = fm.DisplayName,
                                     IsPrimaryContact = fm.IsPrimaryContact,
                                     CanReceiveNotifications = fm.CanReceiveNotifications,
                                     CanViewReports = fm.CanViewReports,
                                     CanViewPhotos = fm.CanViewPhotos,
                                     HasPickupPermission = fm.HasPickupPermission,
                                     JoinedAt = fm.JoinedAt,
                                     CreatedAt = fm.CreatedAt,
                                     IsActive = fm.IsActive,
                                     InvitedByParentId = fm.InvitedByParentId,
                                     LastLoginAt = p.LastLoginAt
                                 }).ToListAsync();

            return members;
        }

        public async Task<IEnumerable<FamilyMemberDto>> GetFamilyMembersByParentAsync(int parentId)
        {
            var members = await (from fm in _context.FamilyMembers
                                 join p in _context.Parents on fm.ParentId equals p.Id
                                 join c in _context.Children on new { fm.NurseryId, fm.ChildId } equals new { c.NurseryId, c.ChildId }
                                 where fm.ParentId == parentId && fm.IsActive
                                 orderby fm.JoinedAt
                                 select new FamilyMemberDto
                                 {
                                     Id = fm.Id,
                                     ParentId = fm.ParentId,
                                     ParentName = p.Name,
                                     ParentPhoneNumber = p.PhoneNumber,
                                     ChildId = fm.ChildId,
                                     ChildName = c.Name,
                                     RelationshipType = fm.RelationshipType,
                                     DisplayName = fm.DisplayName,
                                     IsPrimaryContact = fm.IsPrimaryContact,
                                     CanReceiveNotifications = fm.CanReceiveNotifications,
                                     CanViewReports = fm.CanViewReports,
                                     CanViewPhotos = fm.CanViewPhotos,
                                     HasPickupPermission = fm.HasPickupPermission,
                                     JoinedAt = fm.JoinedAt,
                                     CreatedAt = fm.CreatedAt,
                                     IsActive = fm.IsActive,
                                     InvitedByParentId = fm.InvitedByParentId,
                                     LastLoginAt = p.LastLoginAt
                                 }).ToListAsync();

            return members;
        }

        public async Task<FamilyMemberDto?> GetFamilyMemberAsync(int memberId)
        {
            var member = await _context.FamilyMembers
                .FirstOrDefaultAsync(fm => fm.Id == memberId);

            return member != null ? _mapper.Map<FamilyMemberDto>(member) : null;
        }

        public async Task<bool> UpdateFamilyMemberAsync(int memberId, int requestingParentId, UpdateFamilyMemberDto dto)
        {
            var member = await _context.FamilyMembers.FindAsync(memberId);
            if (member == null || !member.IsActive)
            {
                return false;
            }

            // Check if requesting parent has permission
            var hasPermission = await CanParentAccessChildAsync(requestingParentId, member.ChildId);
            if (!hasPermission && member.ParentId != requestingParentId)
            {
                throw new UnauthorizedException("この家族メンバーを更新する権限がありません。");
            }

            if (dto.DisplayName != null)
                member.DisplayName = dto.DisplayName;
            if (dto.IsPrimaryContact.HasValue)
                member.IsPrimaryContact = dto.IsPrimaryContact.Value;
            if (dto.CanReceiveNotifications.HasValue)
                member.CanReceiveNotifications = dto.CanReceiveNotifications.Value;
            if (dto.CanViewReports.HasValue)
                member.CanViewReports = dto.CanViewReports.Value;
            if (dto.CanViewPhotos.HasValue)
                member.CanViewPhotos = dto.CanViewPhotos.Value;
            if (dto.HasPickupPermission.HasValue)
                member.HasPickupPermission = dto.HasPickupPermission.Value;
            if (dto.IsActive.HasValue)
                member.IsActive = dto.IsActive.Value;

            member.UpdatedAt = DateTimeHelper.GetJstNow();

            await _context.SaveChangesAsync();

            _logger.LogInformation("Family member updated: {MemberId} by parent {ParentId}", memberId, requestingParentId);
            return true;
        }

        public async Task<bool> RemoveFamilyMemberAsync(int memberId, int requestingParentId)
        {
            var member = await _context.FamilyMembers.FindAsync(memberId);
            if (member == null || !member.IsActive)
            {
                return false;
            }

            // Check if requesting parent has permission
            var hasPermission = await CanParentAccessChildAsync(requestingParentId, member.ChildId);
            if (!hasPermission && member.ParentId != requestingParentId)
            {
                throw new UnauthorizedException("この家族メンバーを削除する権限がありません。");
            }

            // Prevent removing the primary contact
            if (member.IsPrimaryContact)
            {
                throw new BusinessException("主連絡担当者は削除できません。");
            }

            member.IsActive = false;
            member.UpdatedAt = DateTimeHelper.GetJstNow();

            // Also deactivate the parent
            var parent = await _context.Parents.FindAsync(member.ParentId);
            if (parent != null)
            {
                parent.IsActive = false;
                parent.UpdatedAt = DateTimeHelper.GetJstNow();
            }

            // Also deactivate the parent-child relationship
            var relationship = await _context.ParentChildRelationships
                .FirstOrDefaultAsync(pcr => pcr.ParentId == member.ParentId && pcr.ChildId == member.ChildId);

            if (relationship != null)
            {
                relationship.IsActive = false;
                relationship.UpdatedAt = DateTimeHelper.GetJstNow();
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Family member removed: {MemberId} by parent {ParentId}", memberId, requestingParentId);
            return true;
        }

        public async Task<bool> CanParentAccessChildAsync(int parentId, int childId)
        {
            return await _context.ParentChildRelationships
                .AnyAsync(pcr => pcr.ParentId == parentId && pcr.ChildId == childId && pcr.IsActive);
        }

        public async Task<IEnumerable<int>> GetAccessibleChildrenAsync(int parentId)
        {
            return await _context.ParentChildRelationships
                .Where(pcr => pcr.ParentId == parentId && pcr.IsActive)
                .Select(pcr => pcr.ChildId)
                .ToListAsync();
        }
    }
}
