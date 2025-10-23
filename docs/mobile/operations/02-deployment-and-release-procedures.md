# Deployment and Release Procedures
## Nursery Management System

### Table of Contents
1. [Deployment Overview](#deployment-overview)
2. [Environment Management](#environment-management)
3. [Pre-Deployment Checklist](#pre-deployment-checklist)
4. [Deployment Procedures](#deployment-procedures)
5. [Post-Deployment Validation](#post-deployment-validation)
6. [Rollback Procedures](#rollback-procedures)
7. [Database Migration Management](#database-migration-management)
8. [Configuration Management](#configuration-management)

---

## Deployment Overview

### Deployment Architecture
- **Development**: Local development environment
- **Staging**: Pre-production testing environment
- **Production**: Live production environment

### Release Strategy
- **Blue-Green Deployment**: Zero-downtime deployments
- **Feature Flags**: Gradual feature rollout
- **Database Migrations**: Forward-compatible schema changes
- **Automated Testing**: Comprehensive validation at each stage

### Deployment Timeline
- **Development to Staging**: Daily (automated)
- **Staging to Production**: Weekly (controlled releases)
- **Hotfixes**: As needed (expedited process)

---

## Environment Management

### Environment Configuration

#### 1. Development Environment
```json
{
  "Environment": "Development",
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=KindergartenDev;Trusted_Connection=true;MultipleActiveResultSets=true;"
  },
  "Jwt": {
    "SecretKey": "DevelopmentSecretKeyForLocalTesting123456789",
    "Issuer": "KindergartenApp-Dev",
    "Audience": "KindergartenApp-Dev",
    "AccessTokenExpirationMinutes": 1440,
    "RefreshTokenExpirationDays": 7
  },
  "Development": {
    "DisableSms": true,
    "UseInMemoryDatabase": false,
    "EnableDetailedErrors": true
  },
  "Media4U": {
    "ApiEndpoint": "https://sandbox.sms-ope.com/sms/api/"
  }
}
```

#### 2. Staging Environment
```json
{
  "Environment": "Staging",
  "ConnectionStrings": {
    "DefaultConnection": "Server=tcp:kindergarten-staging.database.windows.net,1433;Initial Catalog=kindergarten-staging;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;User ID=staging-user;Password=${STAGING_DB_PASSWORD};"
  },
  "Jwt": {
    "SecretKey": "${STAGING_JWT_SECRET}",
    "Issuer": "KindergartenApp-Staging",
    "Audience": "KindergartenApp-Staging",
    "AccessTokenExpirationMinutes": 60,
    "RefreshTokenExpirationDays": 3
  },
  "Development": {
    "DisableSms": false,
    "UseInMemoryDatabase": false,
    "EnableDetailedErrors": true
  },
  "Azure": {
    "ApplicationInsights": {
      "ConnectionString": "${STAGING_APP_INSIGHTS_CONNECTION}"
    }
  }
}
```

#### 3. Production Environment
```json
{
  "Environment": "Production",
  "ConnectionStrings": {
    "DefaultConnection": "Server=tcp:kindergarten-prod.database.windows.net,1433;Initial Catalog=kindergarten-production;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;User ID=prod-user;Password=${PRODUCTION_DB_PASSWORD};"
  },
  "Jwt": {
    "SecretKey": "${PRODUCTION_JWT_SECRET}",
    "Issuer": "KindergartenApp",
    "Audience": "KindergartenApp",
    "AccessTokenExpirationMinutes": 60,
    "RefreshTokenExpirationDays": 7
  },
  "Development": {
    "DisableSms": false,
    "UseInMemoryDatabase": false,
    "EnableDetailedErrors": false
  },
  "Azure": {
    "ApplicationInsights": {
      "ConnectionString": "${PRODUCTION_APP_INSIGHTS_CONNECTION}"
    }
  }
}
```

### Environment Variables Management

#### 1. Azure Key Vault Integration
```csharp
// Program.cs - Key Vault configuration
if (builder.Environment.IsProduction() || builder.Environment.IsStaging())
{
    var keyVaultName = builder.Configuration["Azure:KeyVault:Name"];
    var keyVaultUri = new Uri($"https://{keyVaultName}.vault.azure.net/");

    builder.Configuration.AddAzureKeyVault(
        keyVaultUri,
        new DefaultAzureCredential());
}
```

#### 2. Environment-Specific Secrets
```bash
# Azure Key Vault secrets setup
az keyvault secret set --vault-name "kindergarten-keyvault" --name "production-db-password" --value "your-secure-password"
az keyvault secret set --vault-name "kindergarten-keyvault" --name "production-jwt-secret" --value "your-256-bit-secret"
az keyvault secret set --vault-name "kindergarten-keyvault" --name "media4u-api-key" --value "your-api-key"
az keyvault secret set --vault-name "kindergarten-keyvault" --name "azure-notification-hub-connection" --value "your-connection-string"
```

---

## Pre-Deployment Checklist

### Code Quality Checks

#### 1. Automated Testing Validation
```bash
#!/bin/bash
# Pre-deployment test validation script

echo "Starting pre-deployment validation..."

# 1. Run unit tests
echo "Running unit tests..."
dotnet test ReactApp.Tests/ReactApp.Tests.csproj --logger "trx;LogFileName=unit-tests.trx" --collect:"XPlat Code Coverage"

if [ $? -ne 0 ]; then
    echo "❌ Unit tests failed"
    exit 1
fi

# 2. Run integration tests
echo "Running integration tests..."
dotnet test ReactApp.Server.Tests/ReactApp.Server.Tests.csproj --logger "trx;LogFileName=integration-tests.trx"

if [ $? -ne 0 ]; then
    echo "❌ Integration tests failed"
    exit 1
fi

# 3. Frontend tests
echo "Running frontend tests..."
cd reactapp.client
npm test -- --coverage --watchAll=false

if [ $? -ne 0 ]; then
    echo "❌ Frontend tests failed"
    exit 1
fi

# 4. E2E tests
echo "Running E2E tests..."
npm run test:e2e

if [ $? -ne 0 ]; then
    echo "❌ E2E tests failed"
    exit 1
fi

echo "✅ All tests passed"
```

#### 2. Code Quality Analysis
```bash
#!/bin/bash
# Code quality analysis script

echo "Running code quality analysis..."

# 1. Backend code analysis
dotnet build ReactApp.Server/ReactApp.Server.csproj --configuration Release --verbosity minimal

if [ $? -ne 0 ]; then
    echo "❌ Backend build failed"
    exit 1
fi

# 2. Frontend code analysis
cd reactapp.client
npm run lint

if [ $? -ne 0 ]; then
    echo "❌ Frontend linting failed"
    exit 1
fi

npm run type-check

if [ $? -ne 0 ]; then
    echo "❌ TypeScript type checking failed"
    exit 1
fi

# 3. Security scan
npm audit --audit-level high

if [ $? -ne 0 ]; then
    echo "⚠️ Security vulnerabilities found"
    npm audit fix
fi

echo "✅ Code quality checks passed"
```

### Database Migration Validation

#### 1. Migration Safety Check
```csharp
// Migration validation script
public class MigrationValidator
{
    public static async Task<bool> ValidateMigrations(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<KindergartenDbContext>();

        try
        {
            // Check for pending migrations
            var pendingMigrations = await context.Database.GetPendingMigrationsAsync();

            if (pendingMigrations.Any())
            {
                Console.WriteLine($"Found {pendingMigrations.Count()} pending migrations:");
                foreach (var migration in pendingMigrations)
                {
                    Console.WriteLine($"  - {migration}");
                }

                // Validate migration safety
                foreach (var migration in pendingMigrations)
                {
                    if (!IsMigrationSafe(migration))
                    {
                        Console.WriteLine($"❌ Migration {migration} is not safe for production");
                        return false;
                    }
                }
            }

            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Migration validation failed: {ex.Message}");
            return false;
        }
    }

    private static bool IsMigrationSafe(string migrationName)
    {
        // Check for unsafe operations
        var unsafePatterns = new[]
        {
            "DROP COLUMN",
            "DROP TABLE",
            "ALTER COLUMN",
            "DROP INDEX"
        };

        // This would require reading the migration file content
        // For production, implement proper migration analysis
        return true;
    }
}
```

### Security Validation

#### 1. Security Configuration Check
```bash
#!/bin/bash
# Security validation script

echo "Running security validation..."

# 1. Check for hardcoded secrets
echo "Checking for hardcoded secrets..."
if grep -r "password\|secret\|key" --include="*.cs" --include="*.json" --exclude="*test*" . | grep -v "Configuration\|IConfiguration"; then
    echo "❌ Potential hardcoded secrets found"
    exit 1
fi

# 2. Validate SSL configuration
echo "Checking SSL configuration..."
if [ "$ENVIRONMENT" = "Production" ]; then
    if ! grep -q "UseHttpsRedirection" Program.cs; then
        echo "❌ HTTPS redirection not configured"
        exit 1
    fi
fi

# 3. Check rate limiting configuration
echo "Checking rate limiting..."
if ! grep -q "AddRateLimiter" Program.cs; then
    echo "❌ Rate limiting not configured"
    exit 1
fi

echo "✅ Security validation passed"
```

---

## Deployment Procedures

### Automated Deployment Pipeline

#### 1. Azure DevOps Pipeline
```yaml
# azure-pipelines.yml
trigger:
  branches:
    include:
    - main
    - develop

variables:
  buildConfiguration: 'Release'
  azureSubscription: 'KindergartenApp-ServiceConnection'

stages:
- stage: Build
  displayName: 'Build and Test'
  jobs:
  - job: Build
    displayName: 'Build Job'
    pool:
      vmImage: 'ubuntu-latest'

    steps:
    - task: UseDotNet@2
      displayName: 'Use .NET 8.0'
      inputs:
        packageType: 'sdk'
        version: '8.0.x'

    - task: DotNetCoreCLI@2
      displayName: 'Restore packages'
      inputs:
        command: 'restore'
        projects: '**/*.csproj'

    - task: DotNetCoreCLI@2
      displayName: 'Build application'
      inputs:
        command: 'build'
        projects: '**/*.csproj'
        arguments: '--configuration $(buildConfiguration) --no-restore'

    - task: DotNetCoreCLI@2
      displayName: 'Run unit tests'
      inputs:
        command: 'test'
        projects: '**/*Tests.csproj'
        arguments: '--configuration $(buildConfiguration) --collect:"XPlat Code Coverage" --logger trx --results-directory $(Agent.TempDirectory)'

    - task: NodeTool@0
      displayName: 'Use Node.js'
      inputs:
        versionSpec: '18.x'

    - script: |
        cd reactapp.client
        npm ci
        npm run build
        npm run test -- --coverage --watchAll=false
      displayName: 'Frontend build and test'

    - task: PublishTestResults@2
      displayName: 'Publish test results'
      inputs:
        testResultsFormat: 'VSTest'
        testResultsFiles: '$(Agent.TempDirectory)/**/*.trx'

    - task: PublishCodeCoverageResults@1
      displayName: 'Publish code coverage'
      inputs:
        codeCoverageTool: 'Cobertura'
        summaryFileLocation: '$(Agent.TempDirectory)/**/coverage.cobertura.xml'

    - task: DotNetCoreCLI@2
      displayName: 'Publish application'
      inputs:
        command: 'publish'
        projects: 'ReactApp.Server/ReactApp.Server.csproj'
        arguments: '--configuration $(buildConfiguration) --output $(Build.ArtifactStagingDirectory)'
        publishWebProjects: false

    - task: PublishBuildArtifacts@1
      displayName: 'Publish artifacts'
      inputs:
        PathtoPublish: '$(Build.ArtifactStagingDirectory)'
        ArtifactName: 'drop'

- stage: DeployStaging
  displayName: 'Deploy to Staging'
  dependsOn: Build
  condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/develop'))
  jobs:
  - deployment: DeployStaging
    displayName: 'Deploy to Staging Environment'
    environment: 'Staging'
    pool:
      vmImage: 'ubuntu-latest'
    strategy:
      runOnce:
        deploy:
          steps:
          - task: AzureWebApp@1
            displayName: 'Deploy to Azure Web App (Staging)'
            inputs:
              azureSubscription: '$(azureSubscription)'
              appType: 'webApp'
              appName: 'kindergarten-app-staging'
              package: '$(Pipeline.Workspace)/drop/**/*.zip'

          - task: AzureCLI@2
            displayName: 'Run database migrations'
            inputs:
              azureSubscription: '$(azureSubscription)'
              scriptType: 'bash'
              scriptLocation: 'inlineScript'
              inlineScript: |
                # Download migration tool
                dotnet tool install --global dotnet-ef

                # Run migrations
                dotnet ef database update --connection "$(STAGING_CONNECTION_STRING)"

- stage: DeployProduction
  displayName: 'Deploy to Production'
  dependsOn: DeployStaging
  condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
  jobs:
  - deployment: DeployProduction
    displayName: 'Deploy to Production Environment'
    environment: 'Production'
    pool:
      vmImage: 'ubuntu-latest'
    strategy:
      runOnce:
        deploy:
          steps:
          - task: AzureWebApp@1
            displayName: 'Deploy to Azure Web App (Production)'
            inputs:
              azureSubscription: '$(azureSubscription)'
              appType: 'webApp'
              appName: 'kindergarten-app-production'
              package: '$(Pipeline.Workspace)/drop/**/*.zip'
              deploymentMethod: 'zipDeploy'

          - task: AzureCLI@2
            displayName: 'Run database migrations'
            inputs:
              azureSubscription: '$(azureSubscription)'
              scriptType: 'bash'
              scriptLocation: 'inlineScript'
              inlineScript: |
                # Backup database before migration
                az sql db export \
                  --resource-group "kindergarten-rg" \
                  --server "kindergarten-prod" \
                  --name "kindergarten-production" \
                  --storage-key-type "StorageAccessKey" \
                  --storage-key "$(STORAGE_KEY)" \
                  --storage-uri "https://kindergartenbackups.blob.core.windows.net/backups/pre-migration-$(date +%Y%m%d%H%M%S).bacpac" \
                  --admin-user "$(DB_ADMIN_USER)" \
                  --admin-password "$(DB_ADMIN_PASSWORD)"

                # Run migrations
                dotnet tool install --global dotnet-ef
                dotnet ef database update --connection "$(PRODUCTION_CONNECTION_STRING)"
```

#### 2. Manual Deployment Script
```bash
#!/bin/bash
# Manual deployment script for emergency releases

set -e

ENVIRONMENT=${1:-"staging"}
BRANCH=${2:-"main"}
BACKUP_ENABLED=${3:-"true"}

echo "Starting deployment to $ENVIRONMENT from branch $BRANCH"

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    echo "❌ Invalid environment. Use 'staging' or 'production'"
    exit 1
fi

# Set environment-specific variables
if [ "$ENVIRONMENT" = "production" ]; then
    APP_NAME="kindergarten-app-production"
    DB_CONNECTION="$PRODUCTION_DB_CONNECTION"
    RESOURCE_GROUP="kindergarten-production-rg"
else
    APP_NAME="kindergarten-app-staging"
    DB_CONNECTION="$STAGING_DB_CONNECTION"
    RESOURCE_GROUP="kindergarten-staging-rg"
fi

# 1. Pre-deployment backup
if [ "$BACKUP_ENABLED" = "true" ] && [ "$ENVIRONMENT" = "production" ]; then
    echo "Creating pre-deployment backup..."
    BACKUP_NAME="pre-deployment-$(date +%Y%m%d%H%M%S)"

    az sql db export \
        --resource-group "$RESOURCE_GROUP" \
        --server "kindergarten-$ENVIRONMENT" \
        --name "kindergarten-$ENVIRONMENT" \
        --storage-key-type "StorageAccessKey" \
        --storage-key "$STORAGE_KEY" \
        --storage-uri "https://kindergartenbackups.blob.core.windows.net/backups/$BACKUP_NAME.bacpac" \
        --admin-user "$DB_ADMIN_USER" \
        --admin-password "$DB_ADMIN_PASSWORD"

    echo "✅ Backup created: $BACKUP_NAME.bacpac"
fi

# 2. Build application
echo "Building application..."
git checkout "$BRANCH"
git pull origin "$BRANCH"

# Backend build
dotnet restore ReactApp.Server/ReactApp.Server.csproj
dotnet build ReactApp.Server/ReactApp.Server.csproj --configuration Release
dotnet publish ReactApp.Server/ReactApp.Server.csproj --configuration Release --output ./publish

# Frontend build
cd reactapp.client
npm ci --production
npm run build
cd ..

# 3. Run tests
echo "Running tests..."
dotnet test ReactApp.Tests/ --configuration Release
dotnet test ReactApp.Server.Tests/ --configuration Release

# 4. Deploy application
echo "Deploying to Azure Web App..."
az webapp deployment source config-zip \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_NAME" \
    --src "./publish.zip"

# 5. Run database migrations
echo "Running database migrations..."
dotnet ef database update --connection "$DB_CONNECTION" --project ReactApp.Server

# 6. Warm-up application
echo "Warming up application..."
sleep 30
HEALTH_URL="https://$APP_NAME.azurewebsites.net/health"
curl -f "$HEALTH_URL" || {
    echo "❌ Health check failed after deployment"
    exit 1
}

echo "✅ Deployment to $ENVIRONMENT completed successfully"
```

### Blue-Green Deployment

#### 1. Blue-Green Deployment Script
```bash
#!/bin/bash
# Blue-Green deployment script

RESOURCE_GROUP="kindergarten-production-rg"
APP_SERVICE_PLAN="kindergarten-prod-plan"
CURRENT_SLOT=$(az webapp deployment slot list --resource-group "$RESOURCE_GROUP" --name "kindergarten-app-production" --query "[?slotSwapStatus.destinationSlotName=='production'].name" -o tsv)

if [ "$CURRENT_SLOT" = "blue" ]; then
    TARGET_SLOT="green"
else
    TARGET_SLOT="blue"
fi

echo "Current active slot: $CURRENT_SLOT"
echo "Deploying to slot: $TARGET_SLOT"

# 1. Create or update target slot
echo "Preparing $TARGET_SLOT slot..."
az webapp deployment slot create \
    --resource-group "$RESOURCE_GROUP" \
    --name "kindergarten-app-production" \
    --slot "$TARGET_SLOT" \
    --configuration-source "kindergarten-app-production"

# 2. Deploy to target slot
echo "Deploying to $TARGET_SLOT slot..."
az webapp deployment source config-zip \
    --resource-group "$RESOURCE_GROUP" \
    --name "kindergarten-app-production" \
    --slot "$TARGET_SLOT" \
    --src "./publish.zip"

# 3. Warm up target slot
echo "Warming up $TARGET_SLOT slot..."
TARGET_URL="https://kindergarten-app-production-$TARGET_SLOT.azurewebsites.net/health"
for i in {1..5}; do
    curl -f "$TARGET_URL" && break
    sleep 10
done

# 4. Validate target slot
echo "Validating $TARGET_SLOT slot..."
curl -f "$TARGET_URL" || {
    echo "❌ Health check failed on $TARGET_SLOT slot"
    exit 1
}

# 5. Swap slots
echo "Swapping slots..."
az webapp deployment slot swap \
    --resource-group "$RESOURCE_GROUP" \
    --name "kindergarten-app-production" \
    --slot "$TARGET_SLOT" \
    --target-slot "production"

# 6. Verify production
echo "Verifying production..."
sleep 30
curl -f "https://kindergarten-app-production.azurewebsites.net/health" || {
    echo "❌ Production health check failed after swap"

    # Rollback
    echo "Rolling back..."
    az webapp deployment slot swap \
        --resource-group "$RESOURCE_GROUP" \
        --name "kindergarten-app-production" \
        --slot "production" \
        --target-slot "$TARGET_SLOT"

    exit 1
}

echo "✅ Blue-Green deployment completed successfully"
echo "Active slot is now: production (formerly $TARGET_SLOT)"
```

---

## Post-Deployment Validation

### Automated Validation Suite

#### 1. Health Check Validation
```bash
#!/bin/bash
# Post-deployment validation script

APP_URL=${1:-"https://kindergarten-app-production.azurewebsites.net"}
MAX_RETRIES=10
RETRY_DELAY=30

echo "Starting post-deployment validation for $APP_URL"

# 1. Basic health check
echo "Performing basic health check..."
for i in $(seq 1 $MAX_RETRIES); do
    if curl -f "$APP_URL/health" > /dev/null 2>&1; then
        echo "✅ Basic health check passed"
        break
    else
        echo "⏳ Health check attempt $i/$MAX_RETRIES failed, retrying in ${RETRY_DELAY}s..."
        sleep $RETRY_DELAY
    fi

    if [ $i -eq $MAX_RETRIES ]; then
        echo "❌ Basic health check failed after $MAX_RETRIES attempts"
        exit 1
    fi
done

# 2. Database connectivity check
echo "Checking database connectivity..."
DB_HEALTH=$(curl -s "$APP_URL/health" | jq -r '.checks[] | select(.name=="database") | .status')
if [ "$DB_HEALTH" = "Healthy" ]; then
    echo "✅ Database connectivity check passed"
else
    echo "❌ Database connectivity check failed: $DB_HEALTH"
    exit 1
fi

# 3. API endpoint validation
echo "Validating critical API endpoints..."
ENDPOINTS=(
    "/api/auth/send-sms"
    "/api/family/children"
    "/api/daily-reports"
    "/api/photos"
    "/api/notifications"
)

for endpoint in "${ENDPOINTS[@]}"; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL$endpoint")
    if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "200" ]; then
        echo "✅ Endpoint $endpoint is responding (HTTP $HTTP_CODE)"
    else
        echo "❌ Endpoint $endpoint failed (HTTP $HTTP_CODE)"
        exit 1
    fi
done

# 4. Frontend validation
echo "Validating frontend..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Frontend is accessible"
else
    echo "❌ Frontend validation failed (HTTP $HTTP_CODE)"
    exit 1
fi

# 5. Performance validation
echo "Performing performance validation..."
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" "$APP_URL/health")
if (( $(echo "$RESPONSE_TIME < 2.0" | bc -l) )); then
    echo "✅ Performance validation passed (${RESPONSE_TIME}s)"
else
    echo "⚠️ Performance validation warning: response time ${RESPONSE_TIME}s exceeds 2s threshold"
fi

echo "✅ Post-deployment validation completed successfully"
```

#### 2. Functional Test Validation
```bash
#!/bin/bash
# Functional test validation script

echo "Running functional tests against deployed application..."

# 1. SMS authentication flow test
echo "Testing SMS authentication flow..."
PHONE_NUMBER="+81900000000"  # Test phone number

# Send SMS
SMS_RESPONSE=$(curl -s -X POST "$APP_URL/api/auth/send-sms" \
    -H "Content-Type: application/json" \
    -d "{\"phoneNumber\":\"$PHONE_NUMBER\"}")

if echo "$SMS_RESPONSE" | grep -q "success"; then
    echo "✅ SMS sending test passed"
else
    echo "❌ SMS sending test failed"
    exit 1
fi

# 2. Health metrics test
echo "Testing health metrics..."
METRICS_RESPONSE=$(curl -s "$APP_URL/metrics")
if echo "$METRICS_RESPONSE" | grep -q "requestCount"; then
    echo "✅ Health metrics test passed"
else
    echo "❌ Health metrics test failed"
    exit 1
fi

# 3. Static file serving test
echo "Testing static file serving..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/favicon.ico")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Static file serving test passed"
else
    echo "❌ Static file serving test failed (HTTP $HTTP_CODE)"
    exit 1
fi

echo "✅ Functional test validation completed"
```

### Database Validation

#### 1. Database Schema Validation
```sql
-- Post-deployment database validation queries

-- 1. Verify all tables exist
SELECT
    'Table Validation' as check_type,
    COUNT(*) as table_count,
    CASE
        WHEN COUNT(*) >= 20 THEN 'PASS'
        ELSE 'FAIL'
    END as status
FROM information_schema.tables
WHERE table_type = 'BASE TABLE'
    AND table_schema = 'dbo';

-- 2. Verify indexes are present
SELECT
    'Index Validation' as check_type,
    COUNT(*) as index_count,
    CASE
        WHEN COUNT(*) >= 50 THEN 'PASS'
        ELSE 'FAIL'
    END as status
FROM sys.indexes
WHERE is_disabled = 0
    AND type > 0;

-- 3. Check for any missing foreign keys
SELECT
    'Foreign Key Validation' as check_type,
    COUNT(*) as fk_count,
    CASE
        WHEN COUNT(*) >= 15 THEN 'PASS'
        ELSE 'FAIL'
    END as status
FROM sys.foreign_keys
WHERE is_disabled = 0;

-- 4. Verify data integrity
SELECT
    'Data Integrity Check' as check_type,
    COUNT(*) as orphaned_records,
    CASE
        WHEN COUNT(*) = 0 THEN 'PASS'
        ELSE 'FAIL'
    END as status
FROM ParentChildRelationships pcr
LEFT JOIN Parents p ON pcr.ParentId = p.Id
LEFT JOIN Children c ON pcr.ChildId = c.Id
WHERE p.Id IS NULL OR c.Id IS NULL;
```

#### 2. Migration Verification
```sql
-- Verify database migrations were applied correctly

-- Check migration history
SELECT
    MigrationId,
    ProductVersion,
    Applied = CASE WHEN MigrationId IN (
        SELECT MigrationId FROM __EFMigrationsHistory
    ) THEN 'YES' ELSE 'NO' END
FROM (
    VALUES
    ('20240101000000_InitialCreate'),
    ('20240115000000_AddPhotoManagement'),
    ('20240201000000_AddNotificationSystem'),
    ('20240215000000_AddAzureNotificationHub'),
    ('20240301000000_AddPerformanceOptimizations')
) AS ExpectedMigrations(MigrationId);

-- Verify latest migration
SELECT TOP 1
    MigrationId,
    ProductVersion
FROM __EFMigrationsHistory
ORDER BY MigrationId DESC;
```

---

## Rollback Procedures

### Automated Rollback

#### 1. Application Rollback Script
```bash
#!/bin/bash
# Automated rollback script

ENVIRONMENT=${1:-"production"}
ROLLBACK_VERSION=${2}

if [ -z "$ROLLBACK_VERSION" ]; then
    echo "❌ Rollback version not specified"
    echo "Usage: $0 <environment> <rollback-version>"
    exit 1
fi

echo "Starting rollback to version $ROLLBACK_VERSION in $ENVIRONMENT environment"

# Set environment-specific variables
if [ "$ENVIRONMENT" = "production" ]; then
    APP_NAME="kindergarten-app-production"
    RESOURCE_GROUP="kindergarten-production-rg"
    DB_CONNECTION="$PRODUCTION_DB_CONNECTION"
else
    APP_NAME="kindergarten-app-staging"
    RESOURCE_GROUP="kindergarten-staging-rg"
    DB_CONNECTION="$STAGING_DB_CONNECTION"
fi

# 1. Create emergency backup
echo "Creating emergency backup before rollback..."
BACKUP_NAME="emergency-backup-$(date +%Y%m%d%H%M%S)"
az sql db export \
    --resource-group "$RESOURCE_GROUP" \
    --server "kindergarten-$ENVIRONMENT" \
    --name "kindergarten-$ENVIRONMENT" \
    --storage-key-type "StorageAccessKey" \
    --storage-key "$STORAGE_KEY" \
    --storage-uri "https://kindergartenbackups.blob.core.windows.net/backups/$BACKUP_NAME.bacpac" \
    --admin-user "$DB_ADMIN_USER" \
    --admin-password "$DB_ADMIN_PASSWORD"

# 2. Stop application
echo "Stopping application..."
az webapp stop --resource-group "$RESOURCE_GROUP" --name "$APP_NAME"

# 3. Rollback application code
echo "Rolling back application to version $ROLLBACK_VERSION..."
ROLLBACK_PACKAGE="https://kindergartenreleases.blob.core.windows.net/releases/kindergarten-app-$ROLLBACK_VERSION.zip"

az webapp deployment source config-zip \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_NAME" \
    --src "$ROLLBACK_PACKAGE"

# 4. Rollback database if needed
if [ "$ROLLBACK_DATABASE" = "true" ]; then
    echo "Rolling back database..."
    # This would require a more sophisticated approach
    # For now, we'll skip automatic database rollback
    echo "⚠️ Database rollback not automated. Manual intervention required."
fi

# 5. Start application
echo "Starting application..."
az webapp start --resource-group "$RESOURCE_GROUP" --name "$APP_NAME"

# 6. Validate rollback
echo "Validating rollback..."
sleep 30

HEALTH_URL="https://$APP_NAME.azurewebsites.net/health"
if curl -f "$HEALTH_URL" > /dev/null 2>&1; then
    echo "✅ Rollback completed successfully"

    # Send notification
    curl -X POST "$SLACK_WEBHOOK_URL" \
        -H 'Content-type: application/json' \
        --data "{\"text\":\"🔄 Rollback completed for $ENVIRONMENT to version $ROLLBACK_VERSION\"}"
else
    echo "❌ Rollback validation failed"
    exit 1
fi
```

#### 2. Database Rollback Procedures
```sql
-- Database rollback procedures

-- 1. Create rollback point before migrations
DECLARE @BackupName NVARCHAR(128) = 'RollbackPoint_' + FORMAT(GETDATE(), 'yyyyMMdd_HHmm')

-- For Azure SQL Database, use export instead of backup
-- This would be handled by the deployment script

-- 2. Rollback specific migration
-- Use this only for emergency situations
-- NEVER use in production without thorough testing

-- Example: Rolling back the last migration
-- This is dangerous and should only be used in extreme cases
/*
-- Get the last migration
DECLARE @LastMigration NVARCHAR(150)
SELECT TOP 1 @LastMigration = MigrationId
FROM __EFMigrationsHistory
ORDER BY MigrationId DESC

-- Remove migration record (DANGEROUS!)
-- DELETE FROM __EFMigrationsHistory WHERE MigrationId = @LastMigration

-- Manual reversal of schema changes would be required here
-- This should be planned and tested beforehand
*/

-- 3. Validation queries after rollback
SELECT
    'Rollback Validation' as check_type,
    COUNT(*) as table_count
FROM information_schema.tables
WHERE table_type = 'BASE TABLE';

-- Check for any orphaned data
SELECT
    'Data Consistency' as check_type,
    COUNT(*) as inconsistent_records
FROM Parents p
LEFT JOIN ParentChildRelationships pcr ON p.Id = pcr.ParentId
WHERE p.IsActive = 1 AND pcr.ParentId IS NULL;
```

### Manual Rollback Procedures

#### 1. Emergency Rollback Checklist
```markdown
# Emergency Rollback Checklist

## Pre-Rollback Assessment
- [ ] Confirm the issue severity requires rollback
- [ ] Identify the last known good version
- [ ] Notify stakeholders about the rollback
- [ ] Document the current issue for post-mortem

## Rollback Execution
- [ ] Create emergency database backup
- [ ] Stop application traffic (if needed)
- [ ] Deploy previous application version
- [ ] Verify database compatibility
- [ ] Rollback database migrations (if required)
- [ ] Restart application services
- [ ] Validate core functionality

## Post-Rollback Validation
- [ ] Health checks pass
- [ ] Critical user journeys work
- [ ] Monitor error rates and performance
- [ ] Verify data integrity
- [ ] Update monitoring dashboards

## Communication
- [ ] Notify users about service restoration
- [ ] Update incident tracking
- [ ] Schedule post-mortem meeting
- [ ] Document lessons learned
```

#### 2. Blue-Green Rollback
```bash
#!/bin/bash
# Blue-Green rollback script

RESOURCE_GROUP="kindergarten-production-rg"
APP_NAME="kindergarten-app-production"

echo "Initiating Blue-Green rollback..."

# Get current production slot
CURRENT_SLOT=$(az webapp show --resource-group "$RESOURCE_GROUP" --name "$APP_NAME" --query "slotSwapStatus.sourceSlotName" -o tsv)

if [ "$CURRENT_SLOT" = "blue" ]; then
    ROLLBACK_SLOT="green"
else
    ROLLBACK_SLOT="blue"
fi

echo "Current production slot: $CURRENT_SLOT"
echo "Rolling back to slot: $ROLLBACK_SLOT"

# Verify rollback slot exists and is healthy
ROLLBACK_URL="https://$APP_NAME-$ROLLBACK_SLOT.azurewebsites.net/health"
if curl -f "$ROLLBACK_URL" > /dev/null 2>&1; then
    echo "✅ Rollback slot is healthy"
else
    echo "❌ Rollback slot is not healthy. Cannot proceed with rollback."
    exit 1
fi

# Swap back to previous slot
az webapp deployment slot swap \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_NAME" \
    --slot "$ROLLBACK_SLOT" \
    --target-slot "production"

# Validate rollback
sleep 30
if curl -f "https://$APP_NAME.azurewebsites.net/health" > /dev/null 2>&1; then
    echo "✅ Rollback completed successfully"
else
    echo "❌ Rollback validation failed"
    exit 1
fi
```

---

## Database Migration Management

### Migration Development Guidelines

#### 1. Safe Migration Practices
```csharp
// Safe migration example
public partial class AddUserPreferences : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // ✅ Safe operations
        // Add new nullable columns
        migrationBuilder.AddColumn<string>(
            name: "Theme",
            table: "Parents",
            type: "nvarchar(20)",
            maxLength: 20,
            nullable: true,
            defaultValue: "light");

        // Add new tables
        migrationBuilder.CreateTable(
            name: "UserPreferences",
            columns: table => new
            {
                Id = table.Column<int>(type: "int", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                ParentId = table.Column<int>(type: "int", nullable: false),
                PreferenceName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                PreferenceValue = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_UserPreferences", x => x.Id);
                table.ForeignKey(
                    name: "FK_UserPreferences_Parents_ParentId",
                    column: x => x.ParentId,
                    principalTable: "Parents",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        // Add indexes
        migrationBuilder.CreateIndex(
            name: "IX_UserPreferences_ParentId",
            table: "UserPreferences",
            column: "ParentId");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "UserPreferences");
        migrationBuilder.DropColumn(name: "Theme", table: "Parents");
    }
}
```

#### 2. Migration Validation Script
```bash
#!/bin/bash
# Migration validation script

echo "Validating pending migrations..."

# 1. Check for pending migrations
PENDING_MIGRATIONS=$(dotnet ef migrations list --no-connect | grep -c "Pending")

if [ "$PENDING_MIGRATIONS" -gt 0 ]; then
    echo "Found $PENDING_MIGRATIONS pending migrations:"
    dotnet ef migrations list --no-connect | grep "Pending"
else
    echo "No pending migrations found"
    exit 0
fi

# 2. Generate migration script for review
echo "Generating migration script..."
dotnet ef migrations script --output migration-script.sql

# 3. Check for dangerous operations
echo "Checking for dangerous operations..."
DANGEROUS_OPS=$(grep -i "DROP\|ALTER.*NOT NULL\|ALTER.*DROP" migration-script.sql | wc -l)

if [ "$DANGEROUS_OPS" -gt 0 ]; then
    echo "⚠️ Warning: Found $DANGEROUS_OPS potentially dangerous operations:"
    grep -i "DROP\|ALTER.*NOT NULL\|ALTER.*DROP" migration-script.sql
    echo "Please review carefully before applying to production"
fi

# 4. Estimate migration time
echo "Estimating migration time based on script size..."
SCRIPT_SIZE=$(wc -l < migration-script.sql)
if [ "$SCRIPT_SIZE" -gt 100 ]; then
    echo "⚠️ Large migration detected ($SCRIPT_SIZE lines). Consider maintenance window."
fi

echo "✅ Migration validation completed"
```

### Production Migration Procedures

#### 1. Zero-Downtime Migration Strategy
```csharp
// Zero-downtime migration pattern
public class ZeroDowntimeMigration
{
    // Phase 1: Add new nullable column
    public void Phase1_AddNewColumn()
    {
        // Add nullable column first
        // ALTER TABLE Parents ADD NewColumn NVARCHAR(100) NULL
    }

    // Phase 2: Populate new column (background job)
    public async Task Phase2_PopulateNewColumn()
    {
        // Populate in batches to avoid locking
        var batchSize = 1000;
        var processed = 0;

        while (true)
        {
            var batch = await GetNextBatch(processed, batchSize);
            if (!batch.Any()) break;

            foreach (var item in batch)
            {
                // Update new column based on old column
                item.NewColumn = TransformOldValue(item.OldColumn);
            }

            await SaveChanges();
            processed += batch.Count();

            // Small delay to avoid overwhelming the database
            await Task.Delay(100);
        }
    }

    // Phase 3: Make column non-nullable (requires downtime)
    public void Phase3_MakeColumnRequired()
    {
        // ALTER TABLE Parents ALTER COLUMN NewColumn NVARCHAR(100) NOT NULL
    }

    // Phase 4: Drop old column (after application is updated)
    public void Phase4_DropOldColumn()
    {
        // ALTER TABLE Parents DROP COLUMN OldColumn
    }
}
```

#### 2. Migration Monitoring
```sql
-- Monitor long-running migration operations

-- Check for blocking sessions
SELECT
    s.session_id,
    s.login_name,
    s.host_name,
    s.program_name,
    r.command,
    r.status,
    r.wait_type,
    r.wait_resource,
    r.percent_complete,
    DATEDIFF(MINUTE, r.start_time, GETDATE()) as runtime_minutes
FROM sys.dm_exec_sessions s
INNER JOIN sys.dm_exec_requests r ON s.session_id = r.session_id
WHERE r.command LIKE '%ALTER%'
   OR r.command LIKE '%CREATE%'
   OR r.command LIKE '%DROP%';

-- Monitor index rebuild progress
SELECT
    object_name(object_id) as table_name,
    index_id,
    partition_number,
    percent_complete,
    start_time,
    estimated_completion_time
FROM sys.dm_exec_requests
WHERE command = 'ALTER INDEX';
```

---

## Configuration Management

### Environment-Specific Configuration

#### 1. Configuration Transformation
```xml
<!-- appsettings.Staging.json -->
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "ReactApp.Server": "Debug"
    }
  },
  "ConnectionStrings": {
    "DefaultConnection": "Server=tcp:kindergarten-staging.database.windows.net,1433;Initial Catalog=kindergarten-staging;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
  },
  "RateLimit": {
    "AuthPolicy": {
      "PermitLimit": 20,
      "WindowMinutes": 1
    },
    "SmsPolicy": {
      "PermitLimit": 10,
      "WindowMinutes": 60
    }
  },
  "Development": {
    "DisableSms": false,
    "EnableDetailedErrors": true
  }
}
```

#### 2. Configuration Validation
```csharp
// Configuration validation service
public class ConfigurationValidator : IHostedService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<ConfigurationValidator> _logger;

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        var errors = new List<string>();

        // Validate required settings
        ValidateConnectionString(errors);
        ValidateJwtSettings(errors);
        ValidateExternalServiceSettings(errors);
        ValidateRateLimitingSettings(errors);

        if (errors.Any())
        {
            var errorMessage = string.Join(Environment.NewLine, errors);
            _logger.LogCritical("Configuration validation failed:{NewLine}{Errors}", Environment.NewLine, errorMessage);
            throw new InvalidOperationException($"Configuration validation failed: {errorMessage}");
        }

        _logger.LogInformation("Configuration validation passed");
    }

    private void ValidateConnectionString(List<string> errors)
    {
        var connectionString = _configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrEmpty(connectionString))
        {
            errors.Add("DefaultConnection is not configured");
        }
        else if (!connectionString.Contains("Encrypt=True"))
        {
            errors.Add("DefaultConnection must use encrypted connection");
        }
    }

    private void ValidateJwtSettings(List<string> errors)
    {
        var jwtSection = _configuration.GetSection("Jwt");
        var secretKey = jwtSection["SecretKey"];

        if (string.IsNullOrEmpty(secretKey))
        {
            errors.Add("JWT SecretKey is not configured");
        }
        else if (secretKey.Length < 32)
        {
            errors.Add("JWT SecretKey must be at least 32 characters long");
        }

        if (string.IsNullOrEmpty(jwtSection["Issuer"]))
        {
            errors.Add("JWT Issuer is not configured");
        }

        if (string.IsNullOrEmpty(jwtSection["Audience"]))
        {
            errors.Add("JWT Audience is not configured");
        }
    }

    private void ValidateExternalServiceSettings(List<string> errors)
    {
        var media4uSection = _configuration.GetSection("Media4U");
        if (string.IsNullOrEmpty(media4uSection["ApiEndpoint"]))
        {
            errors.Add("Media4U ApiEndpoint is not configured");
        }

        // Only validate credentials in production
        if (_configuration["Environment"] == "Production")
        {
            if (string.IsNullOrEmpty(media4uSection["BasicAuthUser"]))
            {
                errors.Add("Media4U BasicAuthUser is not configured for production");
            }
        }
    }

    private void ValidateRateLimitingSettings(List<string> errors)
    {
        var rateLimitSection = _configuration.GetSection("RateLimit");

        // Validate that rate limiting is configured
        if (!rateLimitSection.Exists())
        {
            errors.Add("RateLimit section is not configured");
            return;
        }

        // Validate specific policies
        var authPolicy = rateLimitSection.GetSection("AuthPolicy");
        if (authPolicy.GetValue<int>("PermitLimit") <= 0)
        {
            errors.Add("AuthPolicy PermitLimit must be greater than 0");
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
```

This comprehensive deployment and release procedures document provides detailed guidance for managing deployments across different environments, ensuring safe and reliable releases of the nursery management system. The procedures include automated pipelines, manual deployment options, validation steps, and emergency rollback procedures.