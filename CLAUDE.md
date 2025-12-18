# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## System Overview

This is a **kindergarten management system** (保育園管理システム) with separate mobile applications for parents and staff. The system handles daily reports, photo sharing, attendance notifications, calendar events, and family management.

**Architecture**: React 19.1 (TypeScript + Vite) frontend + ASP.NET Core 8 Web API backend with Azure SQL Database.

## Development Commands

### Quick Start
```bash
# Root: Start both frontend and backend concurrently
npm run dev

# Or start separately:
npm run dev:client        # Start React dev server (https://localhost:5173)
npm run dev:server        # Start .NET server (https://localhost:7154)
```

### Frontend (reactapp.client/)
```bash
npm run dev              # Start Vite dev server
npm run build            # TypeScript compile + Vite build
npm run lint             # Run ESLint
npm run preview          # Preview production build
```

### Backend (ReactApp.Server/)
```bash
dotnet run               # Start ASP.NET Core server
dotnet build             # Build project
dotnet ef migrations add <Name>  # Create database migration
dotnet ef database update        # Apply migrations
```

### Testing
```bash
npm run test:all         # Run all tests (frontend + backend + E2E)
npm run test:e2e         # Run Playwright E2E tests
npm run test:accessibility  # Run accessibility tests
npm run test:device      # Run device-specific tests (iOS, Android, tablet)
npm run test:performance # Run Lighthouse + load tests
```

### Database Operations
```bash
# Migration management
cd ReactApp.Server
dotnet ef migrations add <MigrationName>
dotnet ef database update

# Reset database (caution: drops all data)
npm run db:reset
```

## Architecture Overview

### High-Level Structure

```
┌─────────────────────────────────────────────────┐
│  External Services (SMS Gateway, Azure Blob,    │
│  Azure Notification Hub, Azure Translator)      │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  Frontend: React PWA (Parent & Staff Apps)      │
│  - React 19.1 + TypeScript + Vite               │
│  - Tailwind CSS for styling                     │
│  - React Router for navigation                  │
│  - Context API + useReducer for state           │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  Backend: ASP.NET Core 8 Web API                │
│  - JWT Authentication (SMS OTP)                 │
│  - SignalR for real-time notifications          │
│  - Rate Limiting & Security Middleware          │
│  - Serilog for structured logging               │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  Data Layer: Azure SQL Database                 │
│  - Entity Framework Core                        │
│  - Optimized indexes for performance            │
│  - No navigation properties (manual joins)      │
└─────────────────────────────────────────────────┘
```

### Backend Layer Architecture

**Program.cs** configures:
- JWT authentication with SMS verification
- Rate limiting (auth: 10/min, SMS: 3/hour, verify: 5/5min)
- Response compression (Brotli/Gzip)
- Memory & distributed caching
- Health checks (database, external services)
- SignalR hub for real-time notifications
- Middleware: Exception handling, security headers, IP logging

**Service Layer** (`ReactApp.Server/Services/`):
- `IAuthenticationService`: SMS OTP authentication, JWT token management
- `IDailyReportService`: Report CRUD, draft/publish workflow, staff filtering
- `IPhotoService`: Photo upload to Azure Blob, thumbnail generation, child tagging
- `INotificationService`: Push notifications via Azure Notification Hub
- `IFamilyService`: Family member invitations and permissions
- `ICalendarService`: Permission-filtered events (parent: by child's class/grade, staff: by assigned classes)
- `IStaffService`: Staff-specific features (contact notifications, report management)
- `ITranslationService`: Azure Translator integration for multilingual support
- `ICacheService`: Two-level caching (Memory + Distributed)
- `IAcademicYearService`: Academic year management, year slide execution with preview

**Data Access** (`ReactApp.Server/Data/`):
- `KindergartenDbContext`: All navigation properties are **ignored** to prevent EF Core from creating foreign keys
- Manual joins required when loading related entities
- Optimized indexes for common queries (phone numbers, child reports, photo searches)

### Frontend Architecture

**State Management**: Context API + useReducer (no Redux)
- User authentication state
- Children, reports, photos, events
- Staff-specific state (report filters, contact notifications)

**Key Components**:
- **Parent App**: Dashboard, contact forms (absence/late/pickup), photo gallery, daily reports, calendar, family management
- **Staff App**: Dashboard, contact notification handling, report creation/editing/deletion (draft/publish workflow), photo uploads, class announcements

**Routing Pattern**: React Router with role-based routes
```typescript
/staff/dashboard         // Staff dashboard
/staff/reports           // Report list (filterable by status)
/staff/reports/create    // New report
/staff/reports/edit/:id  // Edit existing report
```

## Important Implementation Details

### Multi-Role Authentication System
- Users can have both **Parent** and **Staff** roles
- `UserRolePreference` table stores user's active role selection
- Single phone number can authenticate as either parent or staff
- Implemented in `AuthenticationService` and `UserLookupService`

### Report Management (Staff Feature)
- **Draft/Publish Workflow**: Reports can be saved as drafts or published
- **Business Rules**:
  - Published reports **cannot be deleted** (BR-RM-001)
  - Only the creator can delete their own reports (BR-RM-002)
  - Draft → Published is **one-way** (cannot unpublish)
- **Routing**: Same component (`ReportCreate`) handles both create and edit modes
- **Permissions**: Staff can only edit/delete their own reports

### Photo Management
- Photos stored in **Azure Blob Storage**
- Automatic thumbnail generation
- Multi-child tagging via `PhotoChildren` junction table
- Privacy controls: `PrivacySetting` enum (Public, FamilyOnly, Private)
- Staff permission check: Can only manage photos for assigned classes

### Calendar System
- **Permission-based filtering**:
  - **Parents**: See events for their children's classes/grades + general events
  - **Staff**: See events for assigned classes/grades + general events
- **Same frontend component** for both roles, different API endpoints
- **Event categories**: GeneralAnnouncement, GeneralEvent, NurseryHoliday, ClassActivity, GradeActivity
- **All-day events** displayed in separate row in week/month views

### Academic Year Management (年度管理)
- **Year Slide Function**: Automated transition between academic years
  - Preview before execution (affected children/staff counts, class summaries, warnings)
  - One-way operation (cannot be undone)
  - Updates current year flag, maintains historical data
- **Business Rules**:
  - One current year per nursery
  - Multiple future years allowed for planning
  - Year slide copies class assignments to new year
  - Graduated children excluded from slide
- **Frontend Routes**:
  ```
  /desktop/academic-years           # Year list view
  /desktop/academic-years/create    # Create new year form
  /desktop/year-slide               # Year slide wizard (3-step)
  ```
- **Demo Mode**: Add `?demo=true` to URL for mock data (no API calls)
- **Implementation**: Phase 1 (Backend), Phase 2 (Frontend), Phase 3 (Demo Mode) completed
- **Documentation**: See `docs/academic-year-phase*.md` for details

### Database Schema Notes
- **No EF Core navigation properties**: All navigation properties are explicitly ignored in `OnModelCreating`
- Use manual `.Include()` or join queries when loading related data
- Parent.Id is **IDENTITY** column (auto-increment)
- Phone numbers normalized (no hyphens/spaces)

### Security & Performance
- **Rate Limiting**: Configured per endpoint (auth, SMS, verify, general API)
- **JWT Tokens**: Access tokens (1 hour) + Refresh tokens (7 days)
- **Caching Strategy**:
  - L1: Memory Cache (5-30 min) for high-frequency data
  - L2: Distributed Cache (Redis simulation via DistributedMemoryCache)
- **Static File Caching**: 30-day cache headers for production assets
- **Response Compression**: Brotli + Gzip enabled

### Configuration Management
- `appsettings.json` / `appsettings.Development.json`: Use **placeholders** for secrets
- Real credentials should go in `appsettings.Development.local.json` (gitignored)
- Environment variables in production (Azure App Service)

### Database Migrations
- Startup migration scripts in `Program.cs` execute SQL files from `scripts/` directory
- Order matters: multi-role auth → notification logs → comments → phone normalization → photo children → family tables

## Common Development Workflows

### Adding a New API Endpoint
1. Create DTO in `ReactApp.Server/DTOs/`
2. Add service interface in `ReactApp.Server/Services/I*.cs`
3. Implement service in `ReactApp.Server/Services/*.cs`
4. Create controller (controllers are not in separate folder; look for existing patterns)
5. Add validator if needed in `ReactApp.Server/Validators/`
6. Update Swagger documentation

### Adding a New Database Entity
1. Create model in `ReactApp.Server/Models/`
2. Add DbSet to `KindergartenDbContext.cs`
3. **Ignore all navigation properties** in `OnModelCreating`
4. Create migration: `dotnet ef migrations add <Name>`
5. Apply migration: `dotnet ef database update`

### Debugging Authentication Issues
- Check `logs/kindergarten-*.txt` for detailed JWT validation logs
- JWT events log authentication failures, token validation, and claims
- Verify phone number normalization (no hyphens/spaces)
- Check `UserRolePreference` for active role selection

### Testing Photo Upload
- Local: Uses Azure Blob Storage (connection string required)
- Test: Can use Azurite emulator
- Max file size: 50MB (configured in Kestrel)
- Allowed formats: JPEG, PNG, WebP

## Technology Stack

**Frontend**:
- React 19.1 with TypeScript
- Vite for bundling
- Tailwind CSS for styling
- React Icons (Material Design) for icons
- React Router for navigation
- Axios for HTTP requests
- i18next for internationalization

**Backend**:
- ASP.NET Core 8 Web API
- Entity Framework Core 8
- Serilog for logging
- FluentValidation for request validation
- AutoMapper for DTO mapping
- SignalR for real-time communication

**Infrastructure**:
- Azure SQL Database
- Azure Blob Storage (photos/attachments)
- Azure Translator (multilingual support)
- Azure Notification Hub (push notifications)
- Redis (distributed cache - simulated locally)

**Testing**:
- Playwright for E2E testing
- Axe for accessibility testing
- Lighthouse for performance testing

### Monitoring
- Serilog logs: `logs/kindergarten-YYYY-MM-DD.txt`
- Application Insights (production)
- Prometheus metrics endpoint (if configured)
- Grafana dashboards (production)


・回答は全て日本語で回答すること
・バックエンドのコードを修正する場合はサーバーを落としてから修正し、再度サーバを立ち上げるようにすること
・Azure SQL Databaseのテーブル構造を変更する際は、その内容を提案し、実際にテーブルを変更しないこと