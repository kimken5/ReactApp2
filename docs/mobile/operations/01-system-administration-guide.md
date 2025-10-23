# System Administration Guide
## Nursery Management System

### Table of Contents
1. [System Overview](#system-overview)
2. [Server Setup and Configuration](#server-setup-and-configuration)
3. [Database Administration](#database-administration)
4. [Security Configuration](#security-configuration)
5. [Performance Monitoring](#performance-monitoring)
6. [Backup and Recovery](#backup-and-recovery)
7. [Log Management](#log-management)
8. [Health Checks](#health-checks)

---

## System Overview

### Architecture Components
- **Backend**: ASP.NET Core 8.0 Web API
- **Frontend**: React 19.1 with TypeScript and Vite
- **Database**: Azure SQL Database
- **Caching**: In-Memory with Distributed Memory Cache
- **Logging**: Serilog with file and console outputs
- **Authentication**: JWT Bearer tokens with refresh token support
- **SMS Integration**: Media4U SMS service
- **Notifications**: Azure Notification Hub + SignalR

### System Requirements
- **Production Server**: Windows Server 2019+ or Linux (Ubuntu 20.04+)
- **Runtime**: .NET 8.0 Runtime
- **Memory**: Minimum 4GB RAM (8GB recommended)
- **Storage**: 100GB available space (500GB for media storage)
- **Network**: HTTPS with valid SSL certificates

---

## Server Setup and Configuration

### Initial Server Setup

#### 1. Install .NET 8.0 Runtime
```bash
# Download and install .NET 8.0 Runtime
curl -fsSL https://dot.net/v1/dotnet-install.sh | bash /dev/stdin --channel 8.0 --runtime aspnetcore
```

#### 2. Configure IIS (Windows) or Nginx (Linux)

**Windows IIS Configuration:**
```xml
<!-- web.config -->
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="aspNetCore" path="*" verb="*" modules="AspNetCoreModuleV2" resourceType="Unspecified" />
    </handlers>
    <aspNetCore processPath="dotnet"
                arguments=".\ReactApp.Server.dll"
                stdoutLogEnabled="false"
                stdoutLogFile=".\logs\stdout"
                hostingModel="inprocess" />
  </system.webServer>
</configuration>
```

**Linux Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection keep-alive;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 3. Environment Variables Configuration

Create `.env` file for production:
```bash
# Production Environment Variables
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=https://localhost:5001;http://localhost:5000

# Database Configuration
DefaultConnection="Server=tcp:your-server.database.windows.net,1433;Initial Catalog=your-database;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;User ID=your-user;Password=your-password;"

# JWT Configuration
Jwt__SecretKey="YourProductionSecretKeyThatIsAtLeast256BitsLong!@#$%^&*()"
Jwt__Issuer="KindergartenApp"
Jwt__Audience="KindergartenApp"
Jwt__AccessTokenExpirationMinutes=1440
Jwt__RefreshTokenExpirationDays=7

# SMS Configuration
Media4U__BasicAuthUser="your-media4u-username"
Media4U__BasicAuthPassword="your-media4u-password"
Media4U__ApiEndpoint="https://www.sms-ope.com/sms/api/"

# Azure Notification Hub
Azure__NotificationHub__ConnectionString="your-notification-hub-connection-string"
Azure__NotificationHub__HubName="your-hub-name"

# Application Insights
Azure__ApplicationInsights__ConnectionString="your-application-insights-connection-string"
```

### Service Configuration

#### 1. Create systemd service (Linux)
```ini
# /etc/systemd/system/kindergarten-app.service
[Unit]
Description=Kindergarten Management System
After=network.target

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/var/www/kindergarten-app
ExecStart=/usr/bin/dotnet ReactApp.Server.dll
Restart=always
RestartSec=10
SyslogIdentifier=kindergarten-app
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=DOTNET_ROOT=/usr/share/dotnet

[Install]
WantedBy=multi-user.target
```

#### 2. Enable and start service
```bash
sudo systemctl daemon-reload
sudo systemctl enable kindergarten-app
sudo systemctl start kindergarten-app
sudo systemctl status kindergarten-app
```

---

## Database Administration

### Azure SQL Database Setup

#### 1. Database Server Configuration
```sql
-- Configure Azure SQL Database settings
ALTER DATABASE [your-database-name] SET COMPATIBILITY_LEVEL = 150;
ALTER DATABASE [your-database-name] SET AUTO_UPDATE_STATISTICS ON;
ALTER DATABASE [your-database-name] SET AUTO_CREATE_STATISTICS ON;
ALTER DATABASE [your-database-name] SET QUERY_STORE = ON;
```

#### 2. Database Maintenance Scripts

**Index Maintenance:**
```sql
-- Rebuild fragmented indexes (Run weekly)
DECLARE @sql NVARCHAR(MAX) = '';
SELECT @sql = @sql + 'ALTER INDEX [' + i.name + '] ON [' + s.name + '].[' + t.name + '] REBUILD;' + CHAR(13)
FROM sys.indexes i
INNER JOIN sys.tables t ON i.object_id = t.object_id
INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
INNER JOIN sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'LIMITED') ips
    ON i.object_id = ips.object_id AND i.index_id = ips.index_id
WHERE ips.avg_fragmentation_in_percent > 30
    AND i.type_desc != 'HEAP'
    AND i.is_disabled = 0;

EXEC sp_executesql @sql;
```

**Statistics Update:**
```sql
-- Update statistics (Run daily)
EXEC sp_updatestats;
```

#### 3. Performance Monitoring Queries

**Check Database Performance:**
```sql
-- Query performance analysis
SELECT
    qs.sql_handle,
    qs.execution_count,
    qs.total_elapsed_time / qs.execution_count as avg_elapsed_time,
    qs.total_cpu_time / qs.execution_count as avg_cpu_time,
    SUBSTRING(qt.text, qs.statement_start_offset/2,
        (CASE WHEN qs.statement_end_offset = -1
         THEN LEN(CONVERT(nvarchar(max), qt.text)) * 2
         ELSE qs.statement_end_offset END - qs.statement_start_offset)/2) as query_text
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) qt
WHERE qs.execution_count > 100
ORDER BY avg_elapsed_time DESC;
```

**Check Index Usage:**
```sql
-- Index usage statistics
SELECT
    OBJECT_NAME(ius.object_id) AS table_name,
    i.name AS index_name,
    ius.user_seeks,
    ius.user_scans,
    ius.user_lookups,
    ius.user_updates
FROM sys.dm_db_index_usage_stats ius
INNER JOIN sys.indexes i ON ius.object_id = i.object_id AND ius.index_id = i.index_id
WHERE ius.database_id = DB_ID()
ORDER BY ius.user_seeks + ius.user_scans + ius.user_lookups DESC;
```

### Connection Pool Configuration

#### 1. Connection String Optimization
```csharp
// Optimized connection string for production
"Server=tcp:your-server.database.windows.net,1433;Initial Catalog=your-database;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;Command Timeout=60;Max Pool Size=200;Min Pool Size=5;Pooling=true;MultipleActiveResultSets=True;User ID=your-user;Password=your-password;"
```

#### 2. Entity Framework Configuration
```csharp
// DbContext configuration for production
services.AddDbContext<KindergartenDbContext>(options =>
{
    options.UseSqlServer(connectionString, sqlOptions =>
    {
        sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(30),
            errorNumbersToAdd: null);
        sqlOptions.CommandTimeout(60);
        sqlOptions.MigrationsAssembly("ReactApp.Server");
    });

    // Production optimizations
    options.EnableDetailedErrors(false);
    options.EnableSensitiveDataLogging(false);
    options.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);
});
```

---

## Security Configuration

### SSL/TLS Configuration

#### 1. Certificate Installation
```bash
# Install Let's Encrypt certificate (Linux)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

#### 2. Security Headers Configuration
```csharp
// Security headers middleware configuration
app.Use(async (context, next) =>
{
    context.Response.Headers.Add("X-Frame-Options", "DENY");
    context.Response.Headers.Add("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Add("X-XSS-Protection", "1; mode=block");
    context.Response.Headers.Add("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    context.Response.Headers.Add("Content-Security-Policy",
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");
    context.Response.Headers.Add("Referrer-Policy", "strict-origin-when-cross-origin");

    await next();
});
```

### Authentication Security

#### 1. JWT Token Configuration
```json
{
  "Jwt": {
    "SecretKey": "Use-A-Strong-256-Bit-Key-Here-For-Production",
    "Issuer": "KindergartenApp",
    "Audience": "KindergartenApp",
    "AccessTokenExpirationMinutes": 60,
    "RefreshTokenExpirationDays": 7,
    "ClockSkew": "00:00:00"
  }
}
```

#### 2. Rate Limiting Configuration
```json
{
  "RateLimit": {
    "AuthPolicy": {
      "PermitLimit": 5,
      "WindowMinutes": 1
    },
    "SmsPolicy": {
      "PermitLimit": 3,
      "WindowMinutes": 60
    },
    "VerifyPolicy": {
      "PermitLimit": 5,
      "WindowMinutes": 5
    }
  }
}
```

### Firewall Configuration

#### 1. Windows Firewall Rules
```powershell
# Allow HTTP and HTTPS traffic
New-NetFirewallRule -DisplayName "Allow HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
New-NetFirewallRule -DisplayName "Allow HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow

# Block direct access to application port
New-NetFirewallRule -DisplayName "Block App Port" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Block
```

#### 2. Linux iptables Rules
```bash
# Allow HTTP and HTTPS
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Block direct application access
sudo iptables -A INPUT -p tcp --dport 5000 -j DROP

# Save rules
sudo iptables-save > /etc/iptables/rules.v4
```

---

## Performance Monitoring

### Application Performance Monitoring

#### 1. Configure Application Insights
```csharp
// Application Insights configuration
services.AddApplicationInsightsTelemetry(options =>
{
    options.ConnectionString = Configuration["Azure:ApplicationInsights:ConnectionString"];
    options.EnableDependencyTrackingTelemetryModule = true;
    options.EnablePerformanceCounterCollectionModule = true;
    options.EnableQuickPulseMetricStream = true;
    options.EnableAdaptiveSampling = true;
    options.EnableHeartbeat = true;
});
```

#### 2. Custom Performance Counters
```csharp
// Custom telemetry tracking
public class PerformanceMiddleware
{
    private readonly RequestDelegate _next;
    private readonly TelemetryClient _telemetryClient;

    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();

        try
        {
            await _next(context);
        }
        finally
        {
            stopwatch.Stop();

            _telemetryClient.TrackMetric("RequestDuration",
                stopwatch.ElapsedMilliseconds,
                new Dictionary<string, string>
                {
                    { "Method", context.Request.Method },
                    { "Path", context.Request.Path },
                    { "StatusCode", context.Response.StatusCode.ToString() }
                });
        }
    }
}
```

### System Resource Monitoring

#### 1. Performance Counter Script (Windows)
```powershell
# System performance monitoring script
$counters = @(
    "\Processor(_Total)\% Processor Time",
    "\Memory\Available MBytes",
    "\PhysicalDisk(_Total)\Disk Reads/sec",
    "\PhysicalDisk(_Total)\Disk Writes/sec",
    "\.NET CLR Memory(_Global_)\% Time in GC"
)

Get-Counter -Counter $counters -SampleInterval 30 -MaxSamples 120 |
    Export-Counter -Path "C:\logs\performance-$(Get-Date -Format 'yyyyMMdd-HHmm').csv" -FileFormat CSV
```

#### 2. Resource Monitoring Script (Linux)
```bash
#!/bin/bash
# System monitoring script
DATE=$(date +%Y%m%d-%H%M)
LOG_FILE="/var/log/kindergarten-app/performance-$DATE.log"

# Create log directory if not exists
mkdir -p /var/log/kindergarten-app

# Monitor system resources
{
    echo "Timestamp,CPU%,Memory%,DiskIO,NetworkRX,NetworkTX"

    for i in {1..720}; do  # Monitor for 6 hours (30-second intervals)
        TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
        CPU=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')
        MEMORY=$(free | grep Mem | awk '{printf "%.1f", ($3/$2) * 100.0}')
        DISK_IO=$(iostat -d 1 1 | tail -n +4 | head -n 1 | awk '{print $4+$5}')
        NET_RX=$(cat /proc/net/dev | grep eth0 | awk '{print $2}')
        NET_TX=$(cat /proc/net/dev | grep eth0 | awk '{print $10}')

        echo "$TIMESTAMP,$CPU,$MEMORY,$DISK_IO,$NET_RX,$NET_TX"
        sleep 30
    done
} > "$LOG_FILE"
```

---

## Backup and Recovery

### Database Backup Strategy

#### 1. Automated Backup Script
```sql
-- Azure SQL Database backup (automated)
-- Point-in-time restore available for 7-35 days depending on service tier
-- Long-term retention backup script

DECLARE @BackupName NVARCHAR(128) = 'kindergarten_backup_' + FORMAT(GETDATE(), 'yyyyMMdd_HHmm')
DECLARE @BackupPath NVARCHAR(256) = 'https://yourstorageaccount.blob.core.windows.net/backups/' + @BackupName + '.bacpac'

-- Export database to Azure Storage
-- This would typically be done through Azure Portal or PowerShell
```

#### 2. PowerShell Backup Script
```powershell
# Azure SQL Database backup using PowerShell
$subscriptionId = "your-subscription-id"
$resourceGroupName = "your-resource-group"
$serverName = "your-server-name"
$databaseName = "your-database-name"
$storageAccountName = "your-storage-account"
$containerName = "backups"
$backupName = "kindergarten_backup_$(Get-Date -Format 'yyyyMMdd_HHmm').bacpac"

# Connect to Azure
Connect-AzAccount

# Export database
$exportRequest = New-AzSqlDatabaseExport -ResourceGroupName $resourceGroupName `
    -ServerName $serverName `
    -DatabaseName $databaseName `
    -StorageKeyType "StorageAccessKey" `
    -StorageKey $storageKey `
    -StorageUri "https://$storageAccountName.blob.core.windows.net/$containerName/$backupName" `
    -AdministratorLogin $adminLogin `
    -AdministratorLoginPassword $adminPassword

Write-Output "Backup initiated. Request ID: $($exportRequest.OperationStatusLink)"
```

### File System Backup

#### 1. Application Files Backup Script
```bash
#!/bin/bash
# Application backup script

BACKUP_DIR="/backup/kindergarten-app"
APP_DIR="/var/www/kindergarten-app"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="kindergarten_app_backup_$DATE.tar.gz"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup application files (excluding logs and temp files)
tar -czf "$BACKUP_DIR/$BACKUP_FILE" \
    --exclude="$APP_DIR/logs/*" \
    --exclude="$APP_DIR/uploads/temp/*" \
    --exclude="$APP_DIR/bin/Debug/*" \
    --exclude="$APP_DIR/obj/*" \
    "$APP_DIR"

# Backup uploaded files separately
tar -czf "$BACKUP_DIR/uploads_backup_$DATE.tar.gz" "$APP_DIR/uploads"

# Remove backups older than 30 days
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE"
```

#### 2. Configuration Backup
```bash
#!/bin/bash
# Configuration files backup

CONFIG_BACKUP_DIR="/backup/config"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$CONFIG_BACKUP_DIR"

# Backup configuration files
tar -czf "$CONFIG_BACKUP_DIR/config_backup_$DATE.tar.gz" \
    /var/www/kindergarten-app/appsettings.json \
    /var/www/kindergarten-app/appsettings.Production.json \
    /etc/nginx/sites-available/kindergarten-app \
    /etc/systemd/system/kindergarten-app.service

echo "Configuration backup completed"
```

### Recovery Procedures

#### 1. Database Recovery
```powershell
# Database restore procedure
$resourceGroupName = "your-resource-group"
$serverName = "your-server-name"
$newDatabaseName = "kindergarten_restored"
$backupStorageUri = "https://yourstorageaccount.blob.core.windows.net/backups/backup.bacpac"

# Import database from backup
$importRequest = New-AzSqlDatabaseImport -ResourceGroupName $resourceGroupName `
    -ServerName $serverName `
    -DatabaseName $newDatabaseName `
    -Edition "Standard" `
    -ServiceObjectiveName "S2" `
    -StorageKeyType "StorageAccessKey" `
    -StorageKey $storageKey `
    -StorageUri $backupStorageUri `
    -AdministratorLogin $adminLogin `
    -AdministratorLoginPassword $adminPassword

Write-Output "Database restore initiated. Request ID: $($importRequest.OperationStatusLink)"
```

#### 2. Application Recovery
```bash
#!/bin/bash
# Application recovery script

BACKUP_FILE="/backup/kindergarten-app/kindergarten_app_backup_20241201_143000.tar.gz"
RECOVERY_DIR="/var/www/kindergarten-app-recovery"
CURRENT_DIR="/var/www/kindergarten-app"

# Stop the application
sudo systemctl stop kindergarten-app

# Create recovery directory
mkdir -p "$RECOVERY_DIR"

# Extract backup
tar -xzf "$BACKUP_FILE" -C "$RECOVERY_DIR" --strip-components=3

# Verify backup integrity
if [ -f "$RECOVERY_DIR/ReactApp.Server.dll" ]; then
    echo "Backup verification successful"

    # Backup current version
    mv "$CURRENT_DIR" "/var/www/kindergarten-app-backup-$(date +%Y%m%d_%H%M%S)"

    # Restore from backup
    mv "$RECOVERY_DIR" "$CURRENT_DIR"

    # Set permissions
    chown -R www-data:www-data "$CURRENT_DIR"
    chmod -R 755 "$CURRENT_DIR"

    # Start application
    sudo systemctl start kindergarten-app
    sudo systemctl status kindergarten-app

    echo "Application recovery completed successfully"
else
    echo "Backup verification failed"
    exit 1
fi
```

---

## Log Management

### Serilog Configuration

#### 1. Production Logging Configuration
```json
{
  "Serilog": {
    "MinimumLevel": {
      "Default": "Information",
      "Override": {
        "Microsoft": "Warning",
        "Microsoft.Hosting.Lifetime": "Information",
        "System": "Warning"
      }
    },
    "WriteTo": [
      {
        "Name": "Console",
        "Args": {
          "outputTemplate": "[{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz}] [{Level:u3}] {Message:lj}{NewLine}{Exception}"
        }
      },
      {
        "Name": "File",
        "Args": {
          "path": "logs/kindergarten-.txt",
          "rollingInterval": "Day",
          "retainedFileCountLimit": 30,
          "fileSizeLimitBytes": 10485760,
          "rollOnFileSizeLimit": true,
          "outputTemplate": "[{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz}] [{Level:u3}] [{SourceContext}] {Message:lj} {Properties:j}{NewLine}{Exception}"
        }
      },
      {
        "Name": "File",
        "Args": {
          "path": "logs/errors/error-.txt",
          "rollingInterval": "Day",
          "restrictedToMinimumLevel": "Error",
          "retainedFileCountLimit": 90,
          "outputTemplate": "[{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz}] [{Level:u3}] [{SourceContext}] {Message:lj} {Properties:j}{NewLine}{Exception}"
        }
      }
    ],
    "Enrich": [
      "FromLogContext",
      "WithThreadId",
      "WithMachineName"
    ]
  }
}
```

#### 2. Log Rotation Script
```bash
#!/bin/bash
# Log rotation script for kindergarten application

LOG_DIR="/var/www/kindergarten-app/logs"
ARCHIVE_DIR="/var/log/kindergarten-app/archive"
RETENTION_DAYS=90

# Create archive directory
mkdir -p "$ARCHIVE_DIR"

# Compress logs older than 7 days
find "$LOG_DIR" -name "*.txt" -mtime +7 -exec gzip {} \;

# Move compressed logs to archive
find "$LOG_DIR" -name "*.gz" -exec mv {} "$ARCHIVE_DIR" \;

# Delete archived logs older than retention period
find "$ARCHIVE_DIR" -name "*.gz" -mtime +$RETENTION_DAYS -delete

# Log rotation summary
echo "$(date): Log rotation completed. Archived $(find "$ARCHIVE_DIR" -name "*.gz" | wc -l) files." >> /var/log/kindergarten-app/log-rotation.log
```

### Log Monitoring and Alerting

#### 1. Error Detection Script
```bash
#!/bin/bash
# Error monitoring script

LOG_FILE="/var/www/kindergarten-app/logs/kindergarten-$(date +%Y%m%d).txt"
ERROR_LOG="/var/log/kindergarten-app/error-alerts.log"
ALERT_EMAIL="admin@kindergarten.com"

# Check for errors in the last 5 minutes
ERROR_COUNT=$(grep -c "ERROR\|FATAL" "$LOG_FILE" | tail -n 100)

if [ "$ERROR_COUNT" -gt 5 ]; then
    echo "$(date): High error count detected: $ERROR_COUNT errors" >> "$ERROR_LOG"

    # Send alert email
    {
        echo "Subject: Kindergarten App Alert - High Error Count"
        echo "To: $ALERT_EMAIL"
        echo ""
        echo "High error count detected: $ERROR_COUNT errors in the last 5 minutes"
        echo ""
        echo "Recent errors:"
        grep "ERROR\|FATAL" "$LOG_FILE" | tail -n 10
    } | sendmail "$ALERT_EMAIL"
fi
```

#### 2. Log Analysis Script
```bash
#!/bin/bash
# Daily log analysis script

LOG_FILE="/var/www/kindergarten-app/logs/kindergarten-$(date +%Y%m%d).txt"
REPORT_FILE="/var/log/kindergarten-app/daily-report-$(date +%Y%m%d).txt"

{
    echo "Daily Log Analysis Report - $(date)"
    echo "=================================="
    echo ""

    echo "Error Summary:"
    echo "-------------"
    grep -c "ERROR" "$LOG_FILE" && echo " ERROR messages"
    grep -c "WARN" "$LOG_FILE" && echo " WARNING messages"
    grep -c "FATAL" "$LOG_FILE" && echo " FATAL messages"
    echo ""

    echo "Top Error Messages:"
    echo "-------------------"
    grep "ERROR" "$LOG_FILE" | cut -d']' -f3- | sort | uniq -c | sort -nr | head -10
    echo ""

    echo "Request Volume:"
    echo "---------------"
    grep "HTTP" "$LOG_FILE" | wc -l && echo " total HTTP requests"
    grep "POST" "$LOG_FILE" | wc -l && echo " POST requests"
    grep "GET" "$LOG_FILE" | wc -l && echo " GET requests"
    echo ""

    echo "Performance Issues:"
    echo "-------------------"
    grep -E "timeout|slow|performance" "$LOG_FILE" | wc -l && echo " performance-related messages"

} > "$REPORT_FILE"

echo "Daily log analysis completed: $REPORT_FILE"
```

---

## Health Checks

### Application Health Monitoring

#### 1. Health Check Endpoints
The application includes built-in health check endpoints:
- `/health` - Overall application health
- `/health/database` - Database connectivity
- `/health/external-services` - External service dependencies

#### 2. Health Check Monitoring Script
```bash
#!/bin/bash
# Health check monitoring script

APP_URL="https://your-domain.com"
HEALTH_ENDPOINT="$APP_URL/health"
LOG_FILE="/var/log/kindergarten-app/health-check.log"
ALERT_EMAIL="admin@kindergarten.com"

# Perform health check
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_ENDPOINT")
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

if [ "$RESPONSE" = "200" ]; then
    echo "$TIMESTAMP: Health check passed (HTTP $RESPONSE)" >> "$LOG_FILE"
else
    echo "$TIMESTAMP: Health check failed (HTTP $RESPONSE)" >> "$LOG_FILE"

    # Send alert
    {
        echo "Subject: Kindergarten App Health Check Failed"
        echo "To: $ALERT_EMAIL"
        echo ""
        echo "Health check failed at $TIMESTAMP"
        echo "HTTP Response Code: $RESPONSE"
        echo "URL: $HEALTH_ENDPOINT"
    } | sendmail "$ALERT_EMAIL"
fi
```

#### 3. Comprehensive Health Monitoring
```powershell
# PowerShell health monitoring script
$appUrl = "https://your-domain.com"
$healthEndpoint = "$appUrl/health"
$logFile = "C:\logs\kindergarten-app\health-check.log"

function Test-ApplicationHealth {
    try {
        $response = Invoke-RestMethod -Uri $healthEndpoint -Method Get -TimeoutSec 30
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

        if ($response.status -eq "Healthy") {
            Add-Content -Path $logFile -Value "$timestamp: Health check passed - All systems healthy"
            return $true
        } else {
            Add-Content -Path $logFile -Value "$timestamp: Health check warning - $($response.status)"
            return $false
        }
    }
    catch {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Add-Content -Path $logFile -Value "$timestamp: Health check failed - $($_.Exception.Message)"
        return $false
    }
}

# Run health check
$isHealthy = Test-ApplicationHealth

if (-not $isHealthy) {
    # Send alert email
    Send-MailMessage -To "admin@kindergarten.com" `
        -From "monitoring@kindergarten.com" `
        -Subject "Kindergarten App Health Check Failed" `
        -Body "Health check failed at $(Get-Date). Please investigate immediately." `
        -SmtpServer "your-smtp-server"
}
```

### Database Health Monitoring

#### 1. Database Connection Test
```sql
-- Database health check query
SELECT
    'Database Health Check' as check_name,
    CASE
        WHEN @@CONNECTIONS > 0 THEN 'Healthy'
        ELSE 'Unhealthy'
    END as status,
    @@CONNECTIONS as active_connections,
    (SELECT COUNT(*) FROM sys.dm_exec_sessions WHERE is_user_process = 1) as user_sessions,
    GETDATE() as check_time;

-- Check database size and space
SELECT
    DB_NAME() as database_name,
    SUM(CAST(FILEPROPERTY(name, 'SpaceUsed') AS bigint) * 8192.) / (1024 * 1024) as used_space_mb,
    SUM(CAST(size AS bigint) * 8192.) / (1024 * 1024) as allocated_space_mb,
    (SUM(CAST(size AS bigint) * 8192.) / (1024 * 1024)) -
    (SUM(CAST(FILEPROPERTY(name, 'SpaceUsed') AS bigint) * 8192.) / (1024 * 1024)) as free_space_mb
FROM sys.database_files;
```

#### 2. Performance Health Check
```sql
-- Performance health indicators
SELECT
    'Performance Health' as check_name,
    CASE
        WHEN AVG(total_elapsed_time / execution_count) < 1000 THEN 'Healthy'
        WHEN AVG(total_elapsed_time / execution_count) < 5000 THEN 'Warning'
        ELSE 'Critical'
    END as status,
    AVG(total_elapsed_time / execution_count) as avg_execution_time_ms,
    COUNT(*) as total_queries
FROM sys.dm_exec_query_stats
WHERE last_execution_time > DATEADD(hour, -1, GETDATE());
```

This comprehensive system administration guide provides the foundation for managing the nursery management system in production. The next documents will cover deployment procedures, monitoring setup, user support, and maintenance operations.