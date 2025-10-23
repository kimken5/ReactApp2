# Monitoring and Alerting Procedures
## Nursery Management System

### Table of Contents
1. [Monitoring Overview](#monitoring-overview)
2. [Application Performance Monitoring](#application-performance-monitoring)
3. [Infrastructure Monitoring](#infrastructure-monitoring)
4. [Log Analysis and Monitoring](#log-analysis-and-monitoring)
5. [Alert Configuration](#alert-configuration)
6. [Incident Response Procedures](#incident-response-procedures)
7. [Performance Tuning](#performance-tuning)
8. [Capacity Planning](#capacity-planning)

---

## Monitoring Overview

### Monitoring Strategy
- **Application Layer**: Performance metrics, error rates, business metrics
- **Infrastructure Layer**: Server resources, database performance, network metrics
- **User Experience**: Response times, availability, functionality
- **Security**: Authentication failures, suspicious activities, access patterns

### Key Performance Indicators (KPIs)
- **Availability**: 99.9% uptime target
- **Response Time**: < 500ms for API endpoints, < 2s for page loads
- **Error Rate**: < 0.1% for critical operations
- **Throughput**: Support for 1000+ concurrent users
- **Database Performance**: < 100ms average query time

### Monitoring Tools
- **Application Insights**: Application performance monitoring
- **Azure Monitor**: Infrastructure and resource monitoring
- **Serilog**: Structured logging and analysis
- **Custom Metrics**: Business-specific monitoring
- **Health Checks**: Endpoint monitoring

---

## Application Performance Monitoring

### Application Insights Configuration

#### 1. Application Insights Setup
```csharp
// Program.cs - Application Insights configuration
builder.Services.AddApplicationInsightsTelemetry(options =>
{
    options.ConnectionString = builder.Configuration["Azure:ApplicationInsights:ConnectionString"];
    options.EnableDependencyTrackingTelemetryModule = true;
    options.EnablePerformanceCounterCollectionModule = true;
    options.EnableQuickPulseMetricStream = true;
    options.EnableAdaptiveSampling = true;
    options.EnableHeartbeat = true;
    options.EnableAuthenticationTrackingJavaScript = true;
});

// Custom telemetry initializer
builder.Services.AddSingleton<ITelemetryInitializer, CustomTelemetryInitializer>();
```

#### 2. Custom Telemetry Tracking
```csharp
// Custom telemetry service
public class TelemetryService : ITelemetryService
{
    private readonly TelemetryClient _telemetryClient;
    private readonly ILogger<TelemetryService> _logger;

    public TelemetryService(TelemetryClient telemetryClient, ILogger<TelemetryService> logger)
    {
        _telemetryClient = telemetryClient;
        _logger = logger;
    }

    public void TrackBusinessMetric(string metricName, double value, Dictionary<string, string> properties = null)
    {
        _telemetryClient.TrackMetric(metricName, value, properties);
        _logger.LogInformation("Business metric tracked: {MetricName} = {Value}", metricName, value);
    }

    public void TrackUserAction(string actionName, string userId, Dictionary<string, string> properties = null)
    {
        var customProperties = new Dictionary<string, string>
        {
            { "UserId", userId },
            { "Action", actionName },
            { "Timestamp", DateTimeOffset.UtcNow.ToString("O") }
        };

        if (properties != null)
        {
            foreach (var prop in properties)
            {
                customProperties[prop.Key] = prop.Value;
            }
        }

        _telemetryClient.TrackEvent($"UserAction_{actionName}", customProperties);
    }

    public void TrackApiCall(string endpoint, double duration, bool success, string error = null)
    {
        var properties = new Dictionary<string, string>
        {
            { "Endpoint", endpoint },
            { "Success", success.ToString() },
            { "Duration", duration.ToString() }
        };

        if (!string.IsNullOrEmpty(error))
        {
            properties["Error"] = error;
        }

        _telemetryClient.TrackEvent("ApiCall", properties);
        _telemetryClient.TrackMetric($"ApiCall_{endpoint}_Duration", duration);
        _telemetryClient.TrackMetric($"ApiCall_{endpoint}_Success", success ? 1 : 0);
    }

    public void TrackException(Exception exception, Dictionary<string, string> properties = null)
    {
        _telemetryClient.TrackException(exception, properties);
    }
}
```

#### 3. Performance Monitoring Middleware
```csharp
// Performance monitoring middleware
public class PerformanceMonitoringMiddleware
{
    private readonly RequestDelegate _next;
    private readonly TelemetryClient _telemetryClient;
    private readonly ILogger<PerformanceMonitoringMiddleware> _logger;
    private static readonly ConcurrentDictionary<string, PerformanceStats> _performanceStats = new();

    public PerformanceMonitoringMiddleware(
        RequestDelegate next,
        TelemetryClient telemetryClient,
        ILogger<PerformanceMonitoringMiddleware> logger)
    {
        _next = next;
        _telemetryClient = telemetryClient;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        var requestPath = context.Request.Path.Value;
        var method = context.Request.Method;
        var userAgent = context.Request.Headers["User-Agent"].ToString();

        // Track request start
        var requestId = Guid.NewGuid().ToString();
        context.Items["RequestId"] = requestId;

        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _telemetryClient.TrackException(ex, new Dictionary<string, string>
            {
                { "RequestId", requestId },
                { "Path", requestPath },
                { "Method", method },
                { "UserAgent", userAgent }
            });
            throw;
        }
        finally
        {
            stopwatch.Stop();
            var duration = stopwatch.ElapsedMilliseconds;
            var statusCode = context.Response.StatusCode;

            // Update performance statistics
            var key = $"{method}:{requestPath}";
            _performanceStats.AddOrUpdate(key,
                new PerformanceStats { Count = 1, TotalDuration = duration, AverageDuration = duration },
                (k, existing) =>
                {
                    var newCount = existing.Count + 1;
                    var newTotal = existing.TotalDuration + duration;
                    return new PerformanceStats
                    {
                        Count = newCount,
                        TotalDuration = newTotal,
                        AverageDuration = newTotal / newCount
                    };
                });

            // Track telemetry
            var properties = new Dictionary<string, string>
            {
                { "RequestId", requestId },
                { "Path", requestPath },
                { "Method", method },
                { "StatusCode", statusCode.ToString() },
                { "UserAgent", userAgent },
                { "Duration", duration.ToString() }
            };

            _telemetryClient.TrackRequest(requestPath, DateTimeOffset.UtcNow.AddMilliseconds(-duration),
                TimeSpan.FromMilliseconds(duration), statusCode.ToString(), statusCode < 400);

            _telemetryClient.TrackMetric("RequestDuration", duration, properties);
            _telemetryClient.TrackMetric($"StatusCode_{statusCode}", 1, properties);

            // Log slow requests
            if (duration > 1000)
            {
                _logger.LogWarning("Slow request detected: {Method} {Path} took {Duration}ms",
                    method, requestPath, duration);
            }

            // Log errors
            if (statusCode >= 400)
            {
                _logger.LogWarning("HTTP {StatusCode} for {Method} {Path} (Duration: {Duration}ms)",
                    statusCode, method, requestPath, duration);
            }
        }
    }

    public static Dictionary<string, PerformanceStats> GetStats()
    {
        return _performanceStats.ToDictionary(kvp => kvp.Key, kvp => kvp.Value);
    }
}

public class PerformanceStats
{
    public long Count { get; set; }
    public long TotalDuration { get; set; }
    public double AverageDuration { get; set; }
}
```

### Business Metrics Tracking

#### 1. User Engagement Metrics
```csharp
// User engagement tracking
public class UserEngagementService : IUserEngagementService
{
    private readonly ITelemetryService _telemetryService;
    private readonly ILogger<UserEngagementService> _logger;

    public async Task TrackUserLogin(int parentId, string loginMethod)
    {
        _telemetryService.TrackUserAction("Login", parentId.ToString(), new Dictionary<string, string>
        {
            { "Method", loginMethod },
            { "Timestamp", DateTimeOffset.UtcNow.ToString("O") }
        });

        _telemetryService.TrackBusinessMetric("DailyActiveUsers", 1, new Dictionary<string, string>
        {
            { "Date", DateTime.UtcNow.Date.ToString("yyyy-MM-dd") },
            { "UserId", parentId.ToString() }
        });
    }

    public async Task TrackPhotoView(int parentId, int photoId, string viewType)
    {
        _telemetryService.TrackUserAction("PhotoView", parentId.ToString(), new Dictionary<string, string>
        {
            { "PhotoId", photoId.ToString() },
            { "ViewType", viewType }
        });

        _telemetryService.TrackBusinessMetric("PhotoViews", 1);
    }

    public async Task TrackNotificationInteraction(int parentId, string notificationType, string action)
    {
        _telemetryService.TrackUserAction("NotificationInteraction", parentId.ToString(), new Dictionary<string, string>
        {
            { "NotificationType", notificationType },
            { "Action", action }
        });

        _telemetryService.TrackBusinessMetric("NotificationEngagement", action == "opened" ? 1 : 0);
    }

    public async Task TrackDailyReportRead(int parentId, int reportId)
    {
        _telemetryService.TrackUserAction("DailyReportRead", parentId.ToString(), new Dictionary<string, string>
        {
            { "ReportId", reportId.ToString() }
        });

        _telemetryService.TrackBusinessMetric("DailyReportReads", 1);
    }
}
```

#### 2. System Health Metrics
```csharp
// System health monitoring
public class SystemHealthService : IHostedService
{
    private readonly ITelemetryService _telemetryService;
    private readonly IServiceProvider _serviceProvider;
    private readonly Timer _timer;

    public SystemHealthService(ITelemetryService telemetryService, IServiceProvider serviceProvider)
    {
        _telemetryService = telemetryService;
        _serviceProvider = serviceProvider;
        _timer = new Timer(CollectHealthMetrics, null, TimeSpan.Zero, TimeSpan.FromMinutes(1));
    }

    private async void CollectHealthMetrics(object state)
    {
        try
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<KindergartenDbContext>();

            // Database connection health
            var dbHealthy = await CheckDatabaseHealth(context);
            _telemetryService.TrackBusinessMetric("DatabaseHealth", dbHealthy ? 1 : 0);

            // Active user count
            var activeUsers = await GetActiveUserCount(context);
            _telemetryService.TrackBusinessMetric("ActiveUsers", activeUsers);

            // Memory usage
            var memoryUsage = GC.GetTotalMemory(false) / (1024 * 1024); // MB
            _telemetryService.TrackBusinessMetric("MemoryUsage", memoryUsage);

            // Thread pool metrics
            ThreadPool.GetAvailableThreads(out int workerThreads, out int completionPortThreads);
            _telemetryService.TrackBusinessMetric("AvailableWorkerThreads", workerThreads);
            _telemetryService.TrackBusinessMetric("AvailableCompletionPortThreads", completionPortThreads);
        }
        catch (Exception ex)
        {
            _telemetryService.TrackException(ex);
        }
    }

    private async Task<bool> CheckDatabaseHealth(KindergartenDbContext context)
    {
        try
        {
            await context.Database.ExecuteSqlRawAsync("SELECT 1");
            return true;
        }
        catch
        {
            return false;
        }
    }

    private async Task<int> GetActiveUserCount(KindergartenDbContext context)
    {
        // Count users active in the last 5 minutes
        var fiveMinutesAgo = DateTimeOffset.UtcNow.AddMinutes(-5);
        // This would require tracking last activity timestamp
        return 0; // Placeholder
    }

    public Task StartAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    public Task StopAsync(CancellationToken cancellationToken)
    {
        _timer?.Dispose();
        return Task.CompletedTask;
    }
}
```

---

## Infrastructure Monitoring

### Azure Monitor Configuration

#### 1. Resource Monitoring Setup
```json
{
  "MonitoringConfiguration": {
    "WebApp": {
      "Metrics": [
        "CpuPercentage",
        "MemoryPercentage",
        "HttpResponseTime",
        "Http5xx",
        "Http4xx",
        "RequestsInApplicationQueue",
        "BytesReceived",
        "BytesSent"
      ],
      "Thresholds": {
        "CpuPercentage": 80,
        "MemoryPercentage": 85,
        "HttpResponseTime": 2000,
        "Http5xx": 5,
        "Http4xx": 50
      }
    },
    "Database": {
      "Metrics": [
        "cpu_percent",
        "memory_percent",
        "storage_percent",
        "connection_successful",
        "blocked_by_firewall",
        "deadlock",
        "log_write_percent"
      ],
      "Thresholds": {
        "cpu_percent": 80,
        "memory_percent": 80,
        "storage_percent": 90,
        "connection_successful": 95,
        "deadlock": 1
      }
    }
  }
}
```

#### 2. Custom Metrics Collection
```powershell
# PowerShell script for custom metrics collection
param(
    [string]$ResourceGroupName = "kindergarten-production-rg",
    [string]$WebAppName = "kindergarten-app-production",
    [string]$DatabaseServerName = "kindergarten-prod"
)

# Function to send custom metric to Azure Monitor
function Send-CustomMetric {
    param(
        [string]$MetricName,
        [double]$Value,
        [hashtable]$Dimensions = @{}
    )

    $metricData = @{
        time = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        data = @{
            baseData = @{
                metric = $MetricName
                namespace = "KindergartenApp/Custom"
                dimNames = $Dimensions.Keys
                series = @(@{
                    dimValues = $Dimensions.Values
                    min = $Value
                    max = $Value
                    sum = $Value
                    count = 1
                })
            }
        }
    }

    # Send to Application Insights (requires REST API call)
    # Implementation depends on specific monitoring setup
}

# Collect web app metrics
Write-Host "Collecting web app metrics..."
$webAppMetrics = az monitor metrics list `
    --resource "/subscriptions/$env:AZURE_SUBSCRIPTION_ID/resourceGroups/$ResourceGroupName/providers/Microsoft.Web/sites/$WebAppName" `
    --metric "CpuPercentage,MemoryPercentage,HttpResponseTime" `
    --interval "PT1M" `
    --aggregation "Average" `
    --output json | ConvertFrom-Json

foreach ($metric in $webAppMetrics.value) {
    $latestValue = $metric.timeseries[0].data[-1].average
    Send-CustomMetric -MetricName "WebApp_$($metric.name.value)" -Value $latestValue -Dimensions @{
        "ResourceGroup" = $ResourceGroupName
        "WebApp" = $WebAppName
    }
}

# Collect database metrics
Write-Host "Collecting database metrics..."
$databaseMetrics = az monitor metrics list `
    --resource "/subscriptions/$env:AZURE_SUBSCRIPTION_ID/resourceGroups/$ResourceGroupName/providers/Microsoft.Sql/servers/$DatabaseServerName/databases/kindergarten-production" `
    --metric "cpu_percent,memory_percent,storage_percent" `
    --interval "PT1M" `
    --aggregation "Average" `
    --output json | ConvertFrom-Json

foreach ($metric in $databaseMetrics.value) {
    $latestValue = $metric.timeseries[0].data[-1].average
    Send-CustomMetric -MetricName "Database_$($metric.name.value)" -Value $latestValue -Dimensions @{
        "ResourceGroup" = $ResourceGroupName
        "DatabaseServer" = $DatabaseServerName
    }
}

Write-Host "Metrics collection completed"
```

### Database Performance Monitoring

#### 1. Database Monitoring Queries
```sql
-- Database performance monitoring queries

-- 1. Current database performance overview
SELECT
    'DatabasePerformance' as metric_category,
    GETDATE() as timestamp,
    (SELECT COUNT(*) FROM sys.dm_exec_sessions WHERE is_user_process = 1) as active_sessions,
    (SELECT COUNT(*) FROM sys.dm_exec_requests) as active_requests,
    (SELECT AVG(total_elapsed_time / execution_count) FROM sys.dm_exec_query_stats) as avg_query_time_microseconds,
    (SELECT COUNT(*) FROM sys.dm_exec_query_stats WHERE last_execution_time > DATEADD(minute, -5, GETDATE())) as recent_queries

-- 2. Resource utilization
SELECT
    'ResourceUtilization' as metric_category,
    GETDATE() as timestamp,
    (SELECT cntr_value FROM sys.dm_os_performance_counters WHERE counter_name = 'Page life expectancy') as page_life_expectancy,
    (SELECT cntr_value FROM sys.dm_os_performance_counters WHERE counter_name = 'Buffer cache hit ratio') as buffer_cache_hit_ratio,
    (SELECT cntr_value FROM sys.dm_os_performance_counters WHERE counter_name = 'Lazy writes/sec') as lazy_writes_per_sec

-- 3. Top resource-consuming queries
SELECT TOP 10
    'TopQueries' as metric_category,
    GETDATE() as timestamp,
    qs.sql_handle,
    qs.execution_count,
    qs.total_elapsed_time / qs.execution_count as avg_elapsed_time,
    qs.total_cpu_time / qs.execution_count as avg_cpu_time,
    qs.total_logical_reads / qs.execution_count as avg_logical_reads,
    SUBSTRING(qt.text, qs.statement_start_offset/2,
        (CASE WHEN qs.statement_end_offset = -1
         THEN LEN(CONVERT(nvarchar(max), qt.text)) * 2
         ELSE qs.statement_end_offset END - qs.statement_start_offset)/2) as query_text
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) qt
WHERE qs.last_execution_time > DATEADD(hour, -1, GETDATE())
ORDER BY qs.total_elapsed_time / qs.execution_count DESC

-- 4. Blocking sessions
SELECT
    'BlockingSessions' as metric_category,
    GETDATE() as timestamp,
    blocking.session_id as blocking_session_id,
    blocked.session_id as blocked_session_id,
    blocking.login_name as blocking_user,
    blocked.login_name as blocked_user,
    blocked.wait_type,
    blocked.wait_resource,
    DATEDIFF(SECOND, blocked.last_request_start_time, GETDATE()) as wait_time_seconds
FROM sys.dm_exec_sessions blocking
INNER JOIN sys.dm_exec_sessions blocked ON blocking.session_id = blocked.blocking_session_id
WHERE blocked.blocking_session_id != 0

-- 5. Database storage usage
SELECT
    'StorageUsage' as metric_category,
    GETDATE() as timestamp,
    DB_NAME() as database_name,
    SUM(CAST(FILEPROPERTY(name, 'SpaceUsed') AS bigint) * 8192.) / (1024 * 1024) as used_space_mb,
    SUM(CAST(size AS bigint) * 8192.) / (1024 * 1024) as allocated_space_mb,
    (SUM(CAST(size AS bigint) * 8192.) / (1024 * 1024)) -
    (SUM(CAST(FILEPROPERTY(name, 'SpaceUsed') AS bigint) * 8192.) / (1024 * 1024)) as free_space_mb
FROM sys.database_files
```

#### 2. Automated Database Monitoring Script
```bash
#!/bin/bash
# Database monitoring script

DB_SERVER="kindergarten-prod.database.windows.net"
DB_NAME="kindergarten-production"
DB_USER="monitoring-user"
DB_PASSWORD="$MONITORING_DB_PASSWORD"
LOG_FILE="/var/log/kindergarten-app/db-monitoring.log"

# Function to execute SQL query and log results
execute_monitoring_query() {
    local query_name=$1
    local query_file=$2

    echo "$(date): Executing $query_name" >> "$LOG_FILE"

    sqlcmd -S "$DB_SERVER" -d "$DB_NAME" -U "$DB_USER" -P "$DB_PASSWORD" \
           -i "$query_file" -o "/tmp/${query_name}_result.txt" -W

    if [ $? -eq 0 ]; then
        echo "$(date): $query_name completed successfully" >> "$LOG_FILE"

        # Parse results and send to monitoring system
        # This would integrate with your monitoring solution
        cat "/tmp/${query_name}_result.txt" >> "$LOG_FILE"
    else
        echo "$(date): $query_name failed" >> "$LOG_FILE"
    fi

    rm -f "/tmp/${query_name}_result.txt"
}

# Execute monitoring queries
execute_monitoring_query "performance_overview" "/scripts/db_performance.sql"
execute_monitoring_query "resource_utilization" "/scripts/db_resources.sql"
execute_monitoring_query "blocking_sessions" "/scripts/db_blocking.sql"

# Check for critical thresholds
echo "$(date): Checking critical thresholds" >> "$LOG_FILE"

# Example: Check for high CPU usage
CPU_USAGE=$(sqlcmd -S "$DB_SERVER" -d "$DB_NAME" -U "$DB_USER" -P "$DB_PASSWORD" \
    -Q "SELECT AVG(avg_cpu_percent) FROM sys.dm_db_resource_stats WHERE end_time > DATEADD(minute, -5, GETDATE())" \
    -h -1 -W | tr -d ' ')

if (( $(echo "$CPU_USAGE > 80" | bc -l) )); then
    echo "$(date): ALERT - High database CPU usage: $CPU_USAGE%" >> "$LOG_FILE"

    # Send alert
    curl -X POST "$SLACK_WEBHOOK_URL" \
        -H 'Content-type: application/json' \
        --data "{\"text\":\"🚨 Database CPU Alert: $CPU_USAGE% usage detected\"}"
fi

echo "$(date): Database monitoring completed" >> "$LOG_FILE"
```

---

## Log Analysis and Monitoring

### Structured Logging Configuration

#### 1. Advanced Serilog Configuration
```json
{
  "Serilog": {
    "MinimumLevel": {
      "Default": "Information",
      "Override": {
        "Microsoft": "Warning",
        "Microsoft.Hosting.Lifetime": "Information",
        "Microsoft.EntityFrameworkCore": "Warning",
        "Microsoft.AspNetCore.Authentication": "Information",
        "ReactApp.Server.Controllers": "Information",
        "ReactApp.Server.Services": "Information"
      }
    },
    "WriteTo": [
      {
        "Name": "Console",
        "Args": {
          "outputTemplate": "[{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz}] [{Level:u3}] [{SourceContext}] {Message:lj} {Properties:j}{NewLine}{Exception}",
          "restrictedToMinimumLevel": "Information"
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
          "outputTemplate": "[{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz}] [{Level:u3}] [{SourceContext}] [{RequestId}] [{UserId}] {Message:lj} {Properties:j}{NewLine}{Exception}"
        }
      },
      {
        "Name": "File",
        "Args": {
          "path": "logs/errors/error-.txt",
          "rollingInterval": "Day",
          "restrictedToMinimumLevel": "Error",
          "retainedFileCountLimit": 90,
          "outputTemplate": "[{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz}] [{Level:u3}] [{SourceContext}] [{RequestId}] [{UserId}] {Message:lj} {Properties:j}{NewLine}{Exception}"
        }
      },
      {
        "Name": "File",
        "Args": {
          "path": "logs/performance/performance-.txt",
          "rollingInterval": "Day",
          "restrictedToMinimumLevel": "Information",
          "retainedFileCountLimit": 7,
          "outputTemplate": "[{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz}] {Message:lj} {Properties:j}{NewLine}",
          "filterExpression": "@mt = 'API call completed in {Duration}ms'"
        }
      },
      {
        "Name": "File",
        "Args": {
          "path": "logs/security/security-.txt",
          "rollingInterval": "Day",
          "restrictedToMinimumLevel": "Warning",
          "retainedFileCountLimit": 365,
          "outputTemplate": "[{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz}] [{Level:u3}] [{SourceContext}] [{RequestId}] [{ClientIP}] {Message:lj} {Properties:j}{NewLine}{Exception}",
          "filterExpression": "@SourceContext like '%Auth%' or @SourceContext like '%Security%'"
        }
      }
    ],
    "Enrich": [
      "FromLogContext",
      "WithThreadId",
      "WithMachineName",
      "WithProcessId",
      "WithProcessName"
    ],
    "Properties": {
      "Application": "KindergartenApp",
      "Environment": "Production"
    }
  }
}
```

#### 2. Log Analysis Scripts
```bash
#!/bin/bash
# Log analysis and alerting script

LOG_DIR="/var/www/kindergarten-app/logs"
ALERT_LOG="/var/log/kindergarten-app/alerts.log"
CURRENT_DATE=$(date +%Y%m%d)
LOG_FILE="$LOG_DIR/kindergarten-$CURRENT_DATE.txt"

# Function to send alert
send_alert() {
    local alert_type=$1
    local message=$2
    local severity=${3:-"warning"}

    echo "$(date): [$severity] $alert_type: $message" >> "$ALERT_LOG"

    # Send to Slack
    local color="warning"
    if [ "$severity" = "critical" ]; then
        color="danger"
    elif [ "$severity" = "info" ]; then
        color="good"
    fi

    curl -X POST "$SLACK_WEBHOOK_URL" \
        -H 'Content-type: application/json' \
        --data "{
            \"attachments\": [{
                \"color\": \"$color\",
                \"title\": \"$alert_type\",
                \"text\": \"$message\",
                \"footer\": \"Kindergarten App Monitoring\",
                \"ts\": $(date +%s)
            }]
        }"
}

# 1. Error rate analysis
echo "Analyzing error rates..."
if [ -f "$LOG_FILE" ]; then
    ERROR_COUNT=$(grep -c "\[ERR\]" "$LOG_FILE")
    TOTAL_REQUESTS=$(grep -c "HTTP" "$LOG_FILE")

    if [ "$TOTAL_REQUESTS" -gt 0 ]; then
        ERROR_RATE=$(echo "scale=2; $ERROR_COUNT * 100 / $TOTAL_REQUESTS" | bc)

        if (( $(echo "$ERROR_RATE > 1.0" | bc -l) )); then
            send_alert "High Error Rate" "Error rate is $ERROR_RATE% ($ERROR_COUNT errors out of $TOTAL_REQUESTS requests)" "critical"
        elif (( $(echo "$ERROR_RATE > 0.5" | bc -l) )); then
            send_alert "Elevated Error Rate" "Error rate is $ERROR_RATE% ($ERROR_COUNT errors out of $TOTAL_REQUESTS requests)" "warning"
        fi
    fi
fi

# 2. Performance analysis
echo "Analyzing performance metrics..."
SLOW_REQUESTS=$(grep "took.*ms" "$LOG_FILE" | awk '{
    for(i=1;i<=NF;i++) {
        if($i ~ /took/) {
            duration = $(i+1)
            gsub(/ms/, "", duration)
            if(duration > 2000) count++
        }
    }
} END {print count+0}')

if [ "$SLOW_REQUESTS" -gt 50 ]; then
    send_alert "Performance Degradation" "Found $SLOW_REQUESTS requests taking more than 2 seconds" "warning"
fi

# 3. Authentication failure analysis
echo "Analyzing authentication failures..."
AUTH_FAILURES=$(grep -c "JWT認証失敗\|Authentication failed" "$LOG_FILE")

if [ "$AUTH_FAILURES" -gt 100 ]; then
    send_alert "High Authentication Failure Rate" "Detected $AUTH_FAILURES authentication failures" "warning"
fi

# 4. Database connection issues
echo "Analyzing database connectivity..."
DB_ERRORS=$(grep -c "database\|connection.*failed\|timeout" "$LOG_FILE")

if [ "$DB_ERRORS" -gt 10 ]; then
    send_alert "Database Connectivity Issues" "Detected $DB_ERRORS database-related errors" "critical"
fi

# 5. Memory pressure analysis
echo "Analyzing memory usage..."
MEMORY_WARNINGS=$(grep -c "OutOfMemoryException\|GC pressure" "$LOG_FILE")

if [ "$MEMORY_WARNINGS" -gt 0 ]; then
    send_alert "Memory Pressure" "Detected $MEMORY_WARNINGS memory-related warnings" "critical"
fi

# 6. Security events analysis
echo "Analyzing security events..."
SECURITY_LOG="$LOG_DIR/security/security-$CURRENT_DATE.txt"
if [ -f "$SECURITY_LOG" ]; then
    FAILED_LOGINS=$(grep -c "Login failed\|Invalid credentials" "$SECURITY_LOG")
    SUSPICIOUS_IPS=$(grep "suspicious activity" "$SECURITY_LOG" | awk '{print $NF}' | sort | uniq -c | sort -nr | head -5)

    if [ "$FAILED_LOGINS" -gt 50 ]; then
        send_alert "High Failed Login Rate" "Detected $FAILED_LOGINS failed login attempts" "warning"
    fi

    if [ -n "$SUSPICIOUS_IPS" ]; then
        send_alert "Suspicious Activity" "Top suspicious IP addresses: $SUSPICIOUS_IPS" "warning"
    fi
fi

echo "Log analysis completed"
```

#### 3. Real-time Log Monitoring
```bash
#!/bin/bash
# Real-time log monitoring with immediate alerts

LOG_FILE="/var/www/kindergarten-app/logs/kindergarten-$(date +%Y%m%d).txt"
PROCESSED_FILE="/tmp/log_monitor_position"

# Initialize position file if it doesn't exist
if [ ! -f "$PROCESSED_FILE" ]; then
    echo "0" > "$PROCESSED_FILE"
fi

# Function to process new log entries
process_new_logs() {
    local last_position=$(cat "$PROCESSED_FILE")
    local current_size=$(wc -l < "$LOG_FILE" 2>/dev/null || echo "0")

    if [ "$current_size" -gt "$last_position" ]; then
        # Process new lines
        tail -n +$((last_position + 1)) "$LOG_FILE" | while read -r line; do
            # Check for critical errors
            if echo "$line" | grep -q "\[FTL\]\|\[ERR\].*Critical\|OutOfMemoryException"; then
                send_immediate_alert "Critical Error" "$line" "critical"
            fi

            # Check for authentication issues
            if echo "$line" | grep -q "JWT認証失敗.*suspicious\|Brute force"; then
                send_immediate_alert "Security Alert" "$line" "critical"
            fi

            # Check for database connection failures
            if echo "$line" | grep -q "Cannot connect to database\|Database timeout"; then
                send_immediate_alert "Database Connection Failure" "$line" "critical"
            fi

            # Check for high response times
            if echo "$line" | grep -q "took [5-9][0-9][0-9][0-9]ms\|took [1-9][0-9][0-9][0-9][0-9]ms"; then
                send_immediate_alert "Very Slow Response" "$line" "warning"
            fi
        done

        # Update position
        echo "$current_size" > "$PROCESSED_FILE"
    fi
}

# Function to send immediate alert
send_immediate_alert() {
    local alert_type=$1
    local message=$2
    local severity=$3

    # Truncate long messages
    if [ ${#message} -gt 500 ]; then
        message="${message:0:500}..."
    fi

    # Send immediate Slack notification
    curl -X POST "$SLACK_WEBHOOK_URL" \
        -H 'Content-type: application/json' \
        --data "{
            \"text\": \"🚨 *$alert_type* ($severity)\",
            \"attachments\": [{
                \"color\": \"danger\",
                \"text\": \"\`\`\`$message\`\`\`\",
                \"footer\": \"Real-time Log Monitor\",
                \"ts\": $(date +%s)
            }]
        }"

    # Log the alert
    echo "$(date): IMMEDIATE ALERT [$severity] $alert_type: $message" >> "/var/log/kindergarten-app/immediate-alerts.log"

    # For critical alerts, also send email
    if [ "$severity" = "critical" ]; then
        echo "Subject: CRITICAL ALERT - Kindergarten App
From: monitoring@kindergarten.com
To: admin@kindergarten.com

Critical alert detected at $(date):

$alert_type

Details:
$message

Please investigate immediately." | sendmail admin@kindergarten.com
    fi
}

# Monitor continuously
while true; do
    process_new_logs
    sleep 10
done
```

---

## Alert Configuration

### Alert Rules and Thresholds

#### 1. Application Performance Alerts
```json
{
  "AlertRules": {
    "ApplicationPerformance": [
      {
        "Name": "HighResponseTime",
        "Description": "Alert when average response time exceeds 2 seconds",
        "Metric": "HttpResponseTime",
        "Threshold": 2000,
        "Operator": "GreaterThan",
        "WindowSize": "PT5M",
        "Frequency": "PT1M",
        "Severity": "Warning",
        "Actions": ["EmailAdmin", "SlackNotification"]
      },
      {
        "Name": "HighErrorRate",
        "Description": "Alert when error rate exceeds 1%",
        "Metric": "Http5xx",
        "Threshold": 5,
        "Operator": "GreaterThan",
        "WindowSize": "PT5M",
        "Frequency": "PT1M",
        "Severity": "Critical",
        "Actions": ["EmailAdmin", "SlackNotification", "PagerDuty"]
      },
      {
        "Name": "LowAvailability",
        "Description": "Alert when availability drops below 99%",
        "Metric": "Availability",
        "Threshold": 99,
        "Operator": "LessThan",
        "WindowSize": "PT5M",
        "Frequency": "PT1M",
        "Severity": "Critical",
        "Actions": ["EmailAdmin", "SlackNotification", "PagerDuty", "SMSAlert"]
      }
    ],
    "InfrastructureAlerts": [
      {
        "Name": "HighCPUUsage",
        "Description": "Alert when CPU usage exceeds 80%",
        "Metric": "CpuPercentage",
        "Threshold": 80,
        "Operator": "GreaterThan",
        "WindowSize": "PT10M",
        "Frequency": "PT5M",
        "Severity": "Warning",
        "Actions": ["EmailAdmin", "SlackNotification"]
      },
      {
        "Name": "HighMemoryUsage",
        "Description": "Alert when memory usage exceeds 85%",
        "Metric": "MemoryPercentage",
        "Threshold": 85,
        "Operator": "GreaterThan",
        "WindowSize": "PT10M",
        "Frequency": "PT5M",
        "Severity": "Warning",
        "Actions": ["EmailAdmin", "SlackNotification"]
      },
      {
        "Name": "DatabaseHighCPU",
        "Description": "Alert when database CPU exceeds 80%",
        "Metric": "cpu_percent",
        "Threshold": 80,
        "Operator": "GreaterThan",
        "WindowSize": "PT10M",
        "Frequency": "PT5M",
        "Severity": "Warning",
        "Actions": ["EmailAdmin", "SlackNotification"]
      }
    ],
    "BusinessMetrics": [
      {
        "Name": "LowUserEngagement",
        "Description": "Alert when daily active users drop significantly",
        "Metric": "DailyActiveUsers",
        "Threshold": 100,
        "Operator": "LessThan",
        "WindowSize": "PT1H",
        "Frequency": "PT1H",
        "Severity": "Info",
        "Actions": ["SlackNotification"]
      },
      {
        "Name": "HighSMSFailureRate",
        "Description": "Alert when SMS failure rate exceeds 5%",
        "Metric": "SMSFailureRate",
        "Threshold": 5,
        "Operator": "GreaterThan",
        "WindowSize": "PT15M",
        "Frequency": "PT5M",
        "Severity": "Warning",
        "Actions": ["EmailAdmin", "SlackNotification"]
      }
    ]
  }
}
```

#### 2. Azure Monitor Alert Rules
```bash
#!/bin/bash
# Azure Monitor alert rule creation script

RESOURCE_GROUP="kindergarten-production-rg"
SUBSCRIPTION_ID="your-subscription-id"
ACTION_GROUP_NAME="kindergarten-alerts"

# Create action group for notifications
echo "Creating action group..."
az monitor action-group create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$ACTION_GROUP_NAME" \
    --short-name "KGAlerts" \
    --email-receivers admin admin@kindergarten.com \
    --sms-receivers admin "+81901234567" \
    --webhook-receivers slack "$SLACK_WEBHOOK_URL"

# Web App CPU Alert
echo "Creating web app CPU alert..."
az monitor metrics alert create \
    --name "WebApp-HighCPU" \
    --resource-group "$RESOURCE_GROUP" \
    --description "Alert when web app CPU exceeds 80%" \
    --condition "avg CpuPercentage > 80" \
    --window-size 10m \
    --evaluation-frequency 5m \
    --severity 2 \
    --action "$ACTION_GROUP_NAME" \
    --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/kindergarten-app-production"

# Web App Memory Alert
echo "Creating web app memory alert..."
az monitor metrics alert create \
    --name "WebApp-HighMemory" \
    --resource-group "$RESOURCE_GROUP" \
    --description "Alert when web app memory exceeds 85%" \
    --condition "avg MemoryPercentage > 85" \
    --window-size 10m \
    --evaluation-frequency 5m \
    --severity 2 \
    --action "$ACTION_GROUP_NAME" \
    --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/kindergarten-app-production"

# Web App Response Time Alert
echo "Creating response time alert..."
az monitor metrics alert create \
    --name "WebApp-SlowResponse" \
    --resource-group "$RESOURCE_GROUP" \
    --description "Alert when response time exceeds 2 seconds" \
    --condition "avg HttpResponseTime > 2000" \
    --window-size 5m \
    --evaluation-frequency 1m \
    --severity 2 \
    --action "$ACTION_GROUP_NAME" \
    --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/kindergarten-app-production"

# Database CPU Alert
echo "Creating database CPU alert..."
az monitor metrics alert create \
    --name "Database-HighCPU" \
    --resource-group "$RESOURCE_GROUP" \
    --description "Alert when database CPU exceeds 80%" \
    --condition "avg cpu_percent > 80" \
    --window-size 10m \
    --evaluation-frequency 5m \
    --severity 2 \
    --action "$ACTION_GROUP_NAME" \
    --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Sql/servers/kindergarten-prod/databases/kindergarten-production"

# HTTP 5xx Errors Alert
echo "Creating HTTP 5xx errors alert..."
az monitor metrics alert create \
    --name "WebApp-HighErrors" \
    --resource-group "$RESOURCE_GROUP" \
    --description "Alert when HTTP 5xx errors exceed 5 per minute" \
    --condition "total Http5xx > 5" \
    --window-size 5m \
    --evaluation-frequency 1m \
    --severity 1 \
    --action "$ACTION_GROUP_NAME" \
    --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/kindergarten-app-production"

echo "Alert rules created successfully"
```

### Custom Alert Handlers

#### 1. Alert Handling Service
```csharp
// Alert handling service
public class AlertHandlingService : IAlertHandlingService
{
    private readonly ILogger<AlertHandlingService> _logger;
    private readonly ISlackNotificationService _slackService;
    private readonly IEmailService _emailService;
    private readonly ISMSService _smsService;
    private readonly IConfiguration _configuration;

    public async Task HandleAlert(Alert alert)
    {
        _logger.LogWarning("Processing alert: {AlertName} - {Severity}", alert.Name, alert.Severity);

        // Determine actions based on severity
        var actions = GetActionsForSeverity(alert.Severity);

        foreach (var action in actions)
        {
            try
            {
                await ExecuteAlertAction(action, alert);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to execute alert action {Action} for alert {AlertName}", action, alert.Name);
            }
        }

        // Store alert in database for tracking
        await StoreAlertRecord(alert);
    }

    private List<AlertAction> GetActionsForSeverity(AlertSeverity severity)
    {
        return severity switch
        {
            AlertSeverity.Critical => new List<AlertAction>
            {
                AlertAction.SlackNotification,
                AlertAction.EmailNotification,
                AlertAction.SMSNotification,
                AlertAction.PagerDutyEscalation
            },
            AlertSeverity.Warning => new List<AlertAction>
            {
                AlertAction.SlackNotification,
                AlertAction.EmailNotification
            },
            AlertSeverity.Info => new List<AlertAction>
            {
                AlertAction.SlackNotification
            },
            _ => new List<AlertAction>()
        };
    }

    private async Task ExecuteAlertAction(AlertAction action, Alert alert)
    {
        switch (action)
        {
            case AlertAction.SlackNotification:
                await _slackService.SendAlert(alert);
                break;
            case AlertAction.EmailNotification:
                await _emailService.SendAlert(alert);
                break;
            case AlertAction.SMSNotification:
                await _smsService.SendAlert(alert);
                break;
            case AlertAction.PagerDutyEscalation:
                await EscalateToPagerDuty(alert);
                break;
        }
    }

    private async Task EscalateToPagerDuty(Alert alert)
    {
        // PagerDuty integration for critical alerts
        var pagerDutyClient = new PagerDutyClient(_configuration["PagerDuty:ApiKey"]);
        await pagerDutyClient.TriggerIncident(new Incident
        {
            Summary = alert.Name,
            Description = alert.Description,
            Severity = alert.Severity.ToString(),
            Source = "KindergartenApp"
        });
    }

    private async Task StoreAlertRecord(Alert alert)
    {
        // Store alert for historical tracking and analysis
        var alertRecord = new AlertRecord
        {
            AlertName = alert.Name,
            Severity = alert.Severity.ToString(),
            Description = alert.Description,
            MetricValue = alert.MetricValue,
            Timestamp = DateTimeOffset.UtcNow,
            Status = "Triggered"
        };

        // Save to database (implementation depends on your data layer)
    }
}
```

#### 2. Escalation Matrix
```json
{
  "EscalationMatrix": {
    "Level1": {
      "Duration": "PT5M",
      "Actions": ["SlackNotification", "EmailNotification"],
      "Recipients": ["devops-team@kindergarten.com"]
    },
    "Level2": {
      "Duration": "PT15M",
      "Actions": ["EmailNotification", "SMSNotification"],
      "Recipients": ["senior-devops@kindergarten.com", "team-lead@kindergarten.com"]
    },
    "Level3": {
      "Duration": "PT30M",
      "Actions": ["PagerDutyEscalation", "PhoneCall"],
      "Recipients": ["engineering-manager@kindergarten.com", "cto@kindergarten.com"]
    }
  },
  "AlertRouting": {
    "Database": {
      "PrimaryContact": "database-admin@kindergarten.com",
      "EscalationLevel": "Level2"
    },
    "Security": {
      "PrimaryContact": "security-team@kindergarten.com",
      "EscalationLevel": "Level1"
    },
    "Performance": {
      "PrimaryContact": "devops-team@kindergarten.com",
      "EscalationLevel": "Level2"
    },
    "Infrastructure": {
      "PrimaryContact": "infrastructure-team@kindergarten.com",
      "EscalationLevel": "Level2"
    }
  }
}
```

---

## Incident Response Procedures

### Incident Classification

#### 1. Severity Levels
```markdown
# Incident Severity Levels

## Critical (P1)
- Complete system outage
- Data loss or corruption
- Security breach
- Authentication system failure
- Database complete failure

**Response Time**: 15 minutes
**Resolution Target**: 1 hour
**Communication**: Every 30 minutes

## High (P2)
- Major feature unavailable
- Significant performance degradation
- Partial system outage
- External service integration failure

**Response Time**: 1 hour
**Resolution Target**: 4 hours
**Communication**: Every 2 hours

## Medium (P3)
- Minor feature issues
- Performance degradation
- Non-critical errors increasing

**Response Time**: 4 hours
**Resolution Target**: 24 hours
**Communication**: Daily updates

## Low (P4)
- Cosmetic issues
- Enhancement requests
- Non-urgent bugs

**Response Time**: Next business day
**Resolution Target**: 1 week
**Communication**: Weekly updates
```

#### 2. Incident Response Workflow
```bash
#!/bin/bash
# Incident response automation script

INCIDENT_ID=${1:-"INC-$(date +%Y%m%d-%H%M%S)"}
SEVERITY=${2:-"unknown"}
DESCRIPTION=${3:-"No description provided"}

echo "Starting incident response for $INCIDENT_ID (Severity: $SEVERITY)"

# 1. Create incident record
create_incident_record() {
    echo "Creating incident record..."

    cat > "/var/log/kindergarten-app/incidents/$INCIDENT_ID.json" <<EOF
{
    "incidentId": "$INCIDENT_ID",
    "severity": "$SEVERITY",
    "description": "$DESCRIPTION",
    "status": "Open",
    "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
    "assignedTo": "",
    "actions": [],
    "timeline": []
}
EOF

    echo "Incident record created: $INCIDENT_ID"
}

# 2. Initial response based on severity
initial_response() {
    case $SEVERITY in
        "critical"|"p1")
            echo "CRITICAL incident detected. Executing emergency response..."

            # Page on-call engineer
            curl -X POST "$PAGERDUTY_WEBHOOK" \
                -H 'Content-type: application/json' \
                --data "{
                    \"incident_key\": \"$INCIDENT_ID\",
                    \"event_type\": \"trigger\",
                    \"description\": \"CRITICAL: $DESCRIPTION\",
                    \"service_key\": \"$PAGERDUTY_SERVICE_KEY\"
                }"

            # Create war room
            create_war_room

            # Start status page update
            update_status_page "major-outage" "We are experiencing technical difficulties"
            ;;

        "high"|"p2")
            echo "HIGH severity incident. Executing standard response..."

            # Notify team lead
            send_sms_alert "+81901234567" "HIGH severity incident: $DESCRIPTION"

            # Update status page
            update_status_page "partial-outage" "Some services may be experiencing issues"
            ;;

        "medium"|"p3")
            echo "MEDIUM severity incident. Standard notification..."

            # Email notification
            send_email_alert "devops-team@kindergarten.com" "Medium Priority Incident" "$DESCRIPTION"
            ;;

        *)
            echo "LOW severity or unknown. Logging for review..."
            ;;
    esac
}

# 3. Create war room for critical incidents
create_war_room() {
    echo "Creating war room for incident $INCIDENT_ID..."

    # Create Slack channel
    curl -X POST "https://slack.com/api/channels.create" \
        -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
        -H "Content-type: application/json" \
        --data "{
            \"name\": \"incident-$INCIDENT_ID\",
            \"purpose\": \"War room for incident $INCIDENT_ID\"
        }"

    # Invite key personnel
    INCIDENT_RESPONDERS=(
        "U123456789"  # Engineering Manager
        "U987654321"  # Senior DevOps
        "U456789123"  # Database Admin
    )

    for user in "${INCIDENT_RESPONDERS[@]}"; do
        curl -X POST "https://slack.com/api/channels.invite" \
            -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
            -H "Content-type: application/json" \
            --data "{
                \"channel\": \"incident-$INCIDENT_ID\",
                \"user\": \"$user\"
            }"
    done

    echo "War room created and personnel notified"
}

# 4. Update status page
update_status_page() {
    local status=$1
    local message=$2

    curl -X PATCH "https://api.statuspage.io/v1/pages/$STATUSPAGE_ID/incidents" \
        -H "Authorization: OAuth $STATUSPAGE_API_KEY" \
        -H "Content-Type: application/json" \
        --data "{
            \"incident\": {
                \"name\": \"Service Disruption - $INCIDENT_ID\",
                \"status\": \"$status\",
                \"impact_override\": \"$status\",
                \"body\": \"$message\",
                \"component_ids\": [\"$MAIN_COMPONENT_ID\"]
            }
        }"
}

# 5. Collect initial diagnostics
collect_diagnostics() {
    echo "Collecting initial diagnostics..."

    DIAG_DIR="/var/log/kindergarten-app/incidents/$INCIDENT_ID/diagnostics"
    mkdir -p "$DIAG_DIR"

    # System status
    {
        echo "=== System Status ==="
        date
        uptime
        free -h
        df -h
        echo ""

        echo "=== Process Status ==="
        ps aux | grep -E "dotnet|nginx"
        echo ""

        echo "=== Network Status ==="
        netstat -tuln
        echo ""

        echo "=== Recent Errors ==="
        tail -100 /var/www/kindergarten-app/logs/kindergarten-$(date +%Y%m%d).txt | grep -E "ERROR|FATAL"
    } > "$DIAG_DIR/system-status.txt"

    # Application health
    curl -s "https://kindergarten-app-production.azurewebsites.net/health" > "$DIAG_DIR/health-check.json"

    # Database status
    sqlcmd -S "kindergarten-prod.database.windows.net" \
           -d "kindergarten-production" \
           -U "$DB_MONITORING_USER" \
           -P "$DB_MONITORING_PASSWORD" \
           -Q "SELECT 'Database Status' as check, GETDATE() as timestamp, @@VERSION as version" \
           > "$DIAG_DIR/database-status.txt"

    echo "Diagnostics collected in $DIAG_DIR"
}

# Execute incident response
main() {
    create_incident_record
    initial_response
    collect_diagnostics

    echo "Incident response initiated for $INCIDENT_ID"
    echo "Next steps:"
    echo "1. Investigate root cause"
    echo "2. Implement resolution"
    echo "3. Update incident record"
    echo "4. Communicate status updates"
    echo "5. Conduct post-incident review"
}

# Run main function
main
```

#### 3. Communication Templates
```bash
#!/bin/bash
# Communication templates for incident response

# Function to send status update
send_status_update() {
    local incident_id=$1
    local status=$2
    local update_message=$3
    local eta=${4:-"Unknown"}

    # Slack update
    curl -X POST "$SLACK_WEBHOOK_URL" \
        -H 'Content-type: application/json' \
        --data "{
            \"text\": \"📊 *Incident Update - $incident_id*\",
            \"attachments\": [{
                \"color\": \"warning\",
                \"fields\": [
                    {\"title\": \"Status\", \"value\": \"$status\", \"short\": true},
                    {\"title\": \"ETA\", \"value\": \"$eta\", \"short\": true},
                    {\"title\": \"Update\", \"value\": \"$update_message\", \"short\": false}
                ],
                \"footer\": \"Incident Management\",
                \"ts\": $(date +%s)
            }]
        }"

    # Email update to stakeholders
    cat > "/tmp/incident_update_$incident_id.txt" <<EOF
Subject: Incident Update - $incident_id
From: incidents@kindergarten.com
To: stakeholders@kindergarten.com

Incident Update - $(date)

Incident ID: $incident_id
Current Status: $status
Estimated Resolution: $eta

Update:
$update_message

We will continue to provide updates as the situation progresses.

Kindergarten App Operations Team
EOF

    sendmail stakeholders@kindergarten.com < "/tmp/incident_update_$incident_id.txt"
    rm "/tmp/incident_update_$incident_id.txt"
}

# Function to send resolution notification
send_resolution_notification() {
    local incident_id=$1
    local resolution_summary=$2
    local root_cause=$3

    curl -X POST "$SLACK_WEBHOOK_URL" \
        -H 'Content-type: application/json' \
        --data "{
            \"text\": \"✅ *Incident Resolved - $incident_id*\",
            \"attachments\": [{
                \"color\": \"good\",
                \"fields\": [
                    {\"title\": \"Resolution\", \"value\": \"$resolution_summary\", \"short\": false},
                    {\"title\": \"Root Cause\", \"value\": \"$root_cause\", \"short\": false}
                ],
                \"footer\": \"Incident Management\",
                \"ts\": $(date +%s)
            }]
        }"

    # Update status page
    curl -X PATCH "https://api.statuspage.io/v1/pages/$STATUSPAGE_ID/incidents/$incident_id" \
        -H "Authorization: OAuth $STATUSPAGE_API_KEY" \
        -H "Content-Type: application/json" \
        --data "{
            \"incident\": {
                \"status\": \"resolved\",
                \"body\": \"The issue has been resolved. $resolution_summary\"
            }
        }"
}
```

This comprehensive monitoring and alerting procedures document provides detailed guidance for monitoring the nursery management system, setting up alerts, and responding to incidents. The procedures include real-time monitoring, automated alerting, and structured incident response workflows to ensure high availability and quick resolution of issues.