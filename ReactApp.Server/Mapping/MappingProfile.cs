using AutoMapper;
using ReactApp.Server.DTOs;
using ReactApp.Server.Models;

namespace ReactApp.Server.Mapping
{
    /// <summary>
    /// AutoMapper マッピングプロファイル設定クラス
    /// エンティティモデルとDTOクラス間のマッピング規則を定義
    /// オブジェクト変換の自動化とプロパティマッピング制御を提供
    /// </summary>
    public class MappingProfile : Profile
    {
        /// <summary>
        /// MappingProfileコンストラクタ
        /// 全エンティティとDTOのマッピング規則を設定
        /// </summary>
        public MappingProfile()
        {
            // 認証関連DTOのマッピング
            CreateMap<Parent, LoginResponseDto>();                      // ログイン応答用マッピング
            CreateMap<RegisterRequestDto, Parent>();                    // 登録リクエスト用マッピング

            // 保護者DTOのマッピング
            CreateMap<Parent, ParentDto>()                              // 保護者→DTO変換
                .ForMember(dest => dest.Children, opt => opt.MapFrom(src => src.ParentRelationships.Select(pr => pr.Child)));

            // 園児DTOのマッピング
            CreateMap<Child, ChildDto>()                                // 園児→DTO変換
                .ForMember(dest => dest.Parents, opt => opt.MapFrom(src => src.ParentRelationships.Select(pr => pr.Parent)));

            // 欠席・遅刻通知DTOのマッピング
            CreateMap<AbsenceNotification, AbsenceNotificationDto>();   // エンティティ→DTO変換
            CreateMap<AbsenceNotificationDto, AbsenceNotification>();   // DTO→エンティティ変換

            // イベントDTOのマッピング
            CreateMap<Event, EventDto>();                               // エンティティ→DTO変換
            CreateMap<EventDto, Event>();                               // DTO→エンティティ変換

            // Staff DTOs
            CreateMap<Staff, StaffDto>();
            CreateMap<CreateStaffDto, Staff>();

            // Daily Report DTOs
            CreateMap<DailyReport, DailyReportDto>()
                .ForMember(dest => dest.ChildName, opt => opt.MapFrom(src => src.Child.Name))
                .ForMember(dest => dest.StaffName, opt => opt.MapFrom(src => src.Staff.Name))
                .ForMember(dest => dest.Photos, opt => opt.MapFrom(src => ParsePhotos(src.Photos)));

            CreateMap<CreateDailyReportDto, DailyReport>()
                .ForMember(dest => dest.Photos, opt => opt.MapFrom(src => string.Join(",", src.Photos)));

            // Daily Report Response DTOs
            CreateMap<DailyReportResponse, DailyReportResponseDto>()
                .ForMember(dest => dest.ParentName, opt => opt.MapFrom(src => src.Parent != null ? src.Parent.Name : null));

            CreateMap<CreateDailyReportResponseDto, DailyReportResponse>();

            // Notification Settings DTOs
            CreateMap<NotificationSettings, NotificationSettingsDto>();
            CreateMap<UpdateNotificationSettingsDto, NotificationSettings>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // Notification Log DTOs
            CreateMap<NotificationLog, NotificationLogDto>()
                .ForMember(dest => dest.ParentName, opt => opt.MapFrom(src => src.Parent.Name));

            // Family Member DTOs
            CreateMap<FamilyMember, FamilyMemberDto>()
                .ForMember(dest => dest.ChildName, opt => opt.MapFrom(src => src.Child.Name))
                .ForMember(dest => dest.ParentName, opt => opt.MapFrom(src => src.Parent.Name))
                .ForMember(dest => dest.ParentPhoneNumber, opt => opt.MapFrom(src => src.Parent.PhoneNumber));

            CreateMap<UpdateFamilyMemberDto, FamilyMember>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // Photo DTOs
            CreateMap<Photo, PhotoDto>()
                .ForMember(dest => dest.UploadedByStaffName, opt => opt.MapFrom(src => src.UploadedByStaff.Name))
                .ForMember(dest => dest.Children, opt => opt.Ignore());

            CreateMap<PhotoUploadDto, Photo>()
                .ForMember(dest => dest.OriginalFileName, opt => opt.MapFrom(src => src.PhotoFile.FileName));

            CreateMap<UpdatePhotoDto, Photo>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // Photo Access DTOs
            CreateMap<PhotoAccess, PhotoAccessDto>()
                .ForMember(dest => dest.PhotoFileName, opt => opt.MapFrom(src => src.Photo.FileName))
                .ForMember(dest => dest.ParentName, opt => opt.MapFrom(src => src.Parent.Name));

            // Photo Consent DTOs
            CreateMap<PhotoConsent, PhotoConsentDto>()
                .ForMember(dest => dest.PhotoFileName, opt => opt.MapFrom(src => src.Photo.FileName))
                .ForMember(dest => dest.ChildName, opt => opt.MapFrom(src => src.Child.Name))
                .ForMember(dest => dest.ParentName, opt => opt.MapFrom(src => src.Parent.Name));

            CreateMap<UpdatePhotoConsentDto, PhotoConsent>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // Azure Notification Hub関連DTOのマッピング
            CreateMap<DeviceRegistration, DeviceRegistrationDto>();         // デバイス登録→DTO変換

            CreateMap<NotificationTemplate, NotificationTemplateDto>();     // 通知テンプレート→DTO変換
            CreateMap<AzureNotificationLog, AzureNotificationLogDto>();     // Azure通知ログ→DTO変換

            // Basic Notification Settings DTOs
            CreateMap<NotificationSettings, NotificationSettingsDto>();     // 通知設定→DTO変換
            CreateMap<UpdateNotificationSettingsDto, NotificationSettings>() // DTO→通知設定変換
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));
        }

        private static List<string> ParseTags(string? tags)
        {
            if (string.IsNullOrEmpty(tags))
                return new List<string>();

            return tags.Split(new char[] { ',' }, StringSplitOptions.RemoveEmptyEntries).ToList();
        }

        private static List<string> ParsePhotos(string? photos)
        {
            if (string.IsNullOrEmpty(photos))
                return new List<string>();

            return photos.Split(new char[] { ',' }, StringSplitOptions.RemoveEmptyEntries).ToList();
        }
    }
}