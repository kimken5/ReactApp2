# Maintenance and Operations Guide
## Nursery Management System

### Table of Contents
1. [Maintenance Overview](#maintenance-overview)
2. [Routine Maintenance Schedules](#routine-maintenance-schedules)
3. [System Health Checks](#system-health-checks)
4. [Database Maintenance](#database-maintenance)
5. [Performance Optimization](#performance-optimization)
6. [Security Maintenance](#security-maintenance)
7. [Data Archival and Cleanup](#data-archival-and-cleanup)
8. [Disaster Recovery Testing](#disaster-recovery-testing)

---

## Maintenance Overview

### Maintenance Philosophy
- **Proactive**: Prevent issues before they occur
- **Minimal Disruption**: Perform maintenance during low-usage periods
- **Automated**: Use scripts and tools to reduce human error
- **Documented**: Maintain detailed logs of all maintenance activities
- **Tested**: Validate all changes in staging before production

### Maintenance Windows
- **Daily**: 02:00-04:00 JST (Low impact maintenance)
- **Weekly**: Sunday 01:00-05:00 JST (Medium impact maintenance)
- **Monthly**: First Sunday 00:00-06:00 JST (High impact maintenance)
- **Emergency**: As needed with stakeholder notification

### Maintenance Categories
- **Preventive**: Regular maintenance to prevent issues
- **Corrective**: Fix identified problems
- **Adaptive**: Adjust system for changing requirements
- **Perfective**: Improve system performance and reliability

---

## Routine Maintenance Schedules

### Daily Maintenance Tasks

#### 1. System Health Verification
```bash
#!/bin/bash
# Daily system health check script
# Schedule: Daily at 02:00 JST

MAINTENANCE_LOG="/var/log/kindergarten-app/maintenance/daily-$(date +%Y%m%d).log"
ALERT_THRESHOLD_CPU=80
ALERT_THRESHOLD_MEMORY=85
ALERT_THRESHOLD_DISK=90

echo "=== Daily Maintenance Check - $(date) ===" >> "$MAINTENANCE_LOG"

# 1. System resource check
echo "Checking system resources..." >> "$MAINTENANCE_LOG"
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.1f", ($3/$2) * 100.0}')
DISK_USAGE=$(df -h / | awk 'NR==2{print $5}' | sed 's/%//')

echo "CPU Usage: ${CPU_USAGE}%" >> "$MAINTENANCE_LOG"
echo "Memory Usage: ${MEMORY_USAGE}%" >> "$MAINTENANCE_LOG"
echo "Disk Usage: ${DISK_USAGE}%" >> "$MAINTENANCE_LOG"

# Alert if thresholds exceeded
if (( $(echo "$CPU_USAGE > $ALERT_THRESHOLD_CPU" | bc -l) )); then
    echo "ALERT: High CPU usage detected" >> "$MAINTENANCE_LOG"
    send_maintenance_alert "High CPU Usage" "CPU usage at ${CPU_USAGE}%"
fi

if (( $(echo "$MEMORY_USAGE > $ALERT_THRESHOLD_MEMORY" | bc -l) )); then
    echo "ALERT: High memory usage detected" >> "$MAINTENANCE_LOG"
    send_maintenance_alert "High Memory Usage" "Memory usage at ${MEMORY_USAGE}%"
fi

if [ "$DISK_USAGE" -gt "$ALERT_THRESHOLD_DISK" ]; then
    echo "ALERT: High disk usage detected" >> "$MAINTENANCE_LOG"
    send_maintenance_alert "High Disk Usage" "Disk usage at ${DISK_USAGE}%"
fi

# 2. Application health check
echo "Checking application health..." >> "$MAINTENANCE_LOG"
HEALTH_RESPONSE=$(curl -s -w "%{http_code}" "https://kindergarten-app-production.azurewebsites.net/health")
HEALTH_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)

if [ "$HEALTH_CODE" = "200" ]; then
    echo "Application health: OK" >> "$MAINTENANCE_LOG"
else
    echo "ALERT: Application health check failed (HTTP $HEALTH_CODE)" >> "$MAINTENANCE_LOG"
    send_maintenance_alert "Application Health Failure" "Health check returned HTTP $HEALTH_CODE"
fi

# 3. Database connectivity check
echo "Checking database connectivity..." >> "$MAINTENANCE_LOG"
DB_CHECK=$(sqlcmd -S "kindergarten-prod.database.windows.net" \
                  -d "kindergarten-production" \
                  -U "$DB_MONITORING_USER" \
                  -P "$DB_MONITORING_PASSWORD" \
                  -Q "SELECT 1" -h -1 2>/dev/null)

if [ "$DB_CHECK" = "1" ]; then
    echo "Database connectivity: OK" >> "$MAINTENANCE_LOG"
else
    echo "ALERT: Database connectivity failed" >> "$MAINTENANCE_LOG"
    send_maintenance_alert "Database Connectivity Failure" "Cannot connect to production database"
fi

# 4. Log rotation and cleanup
echo "Performing log rotation..." >> "$MAINTENANCE_LOG"
find /var/www/kindergarten-app/logs -name "*.txt" -mtime +30 -delete
find /var/log/kindergarten-app -name "*.log" -mtime +90 -delete

# 5. Temporary file cleanup
echo "Cleaning temporary files..." >> "$MAINTENANCE_LOG"
find /tmp -name "kindergarten_*" -mtime +1 -delete
find /var/www/kindergarten-app/uploads/temp -mtime +1 -delete

# 6. Check SSL certificate expiration
echo "Checking SSL certificate..." >> "$MAINTENANCE_LOG"
CERT_EXPIRY=$(echo | openssl s_client -servername kindergarten.com -connect kindergarten.com:443 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
CERT_EXPIRY_EPOCH=$(date -d "$CERT_EXPIRY" +%s)
CURRENT_EPOCH=$(date +%s)
DAYS_UNTIL_EXPIRY=$(( (CERT_EXPIRY_EPOCH - CURRENT_EPOCH) / 86400 ))

echo "SSL certificate expires in $DAYS_UNTIL_EXPIRY days" >> "$MAINTENANCE_LOG"

if [ "$DAYS_UNTIL_EXPIRY" -lt 30 ]; then
    send_maintenance_alert "SSL Certificate Expiring" "Certificate expires in $DAYS_UNTIL_EXPIRY days"
fi

echo "Daily maintenance check completed" >> "$MAINTENANCE_LOG"

# Function to send maintenance alerts
send_maintenance_alert() {
    local alert_type=$1
    local message=$2

    curl -X POST "$SLACK_WEBHOOK_URL" \
        -H 'Content-type: application/json' \
        --data "{
            \"text\": \"🔧 *Maintenance Alert*\",
            \"attachments\": [{
                \"color\": \"warning\",
                \"title\": \"$alert_type\",
                \"text\": \"$message\",
                \"footer\": \"Daily Maintenance Check\",
                \"ts\": $(date +%s)
            }]
        }"
}
```

#### 2. Performance Metrics Collection
```bash
#!/bin/bash
# Daily performance metrics collection
# Schedule: Daily at 02:30 JST

METRICS_DIR="/var/log/kindergarten-app/metrics"
TODAY=$(date +%Y%m%d)
METRICS_FILE="$METRICS_DIR/performance-$TODAY.json"

mkdir -p "$METRICS_DIR"

echo "Collecting performance metrics for $TODAY..."

# 1. Application performance metrics
APP_METRICS=$(curl -s "https://kindergarten-app-production.azurewebsites.net/metrics")

# 2. Database performance metrics
DB_METRICS=$(sqlcmd -S "kindergarten-prod.database.windows.net" \
                   -d "kindergarten-production" \
                   -U "$DB_MONITORING_USER" \
                   -P "$DB_MONITORING_PASSWORD" \
                   -Q "
                   SELECT
                       'DatabaseMetrics' as category,
                       (SELECT AVG(avg_cpu_percent) FROM sys.dm_db_resource_stats WHERE end_time > DATEADD(hour, -24, GETUTCDATE())) as avg_cpu_24h,
                       (SELECT AVG(avg_data_io_percent) FROM sys.dm_db_resource_stats WHERE end_time > DATEADD(hour, -24, GETUTCDATE())) as avg_io_24h,
                       (SELECT COUNT(*) FROM sys.dm_exec_sessions WHERE is_user_process = 1) as active_sessions,
                       (SELECT COUNT(*) FROM sys.dm_exec_requests) as active_requests
                   " -h -1 -s "," | tail -n 1)

# 3. System resource metrics
SYSTEM_METRICS=$(cat <<EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
    "cpu_usage": $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//'),
    "memory_usage": $(free | grep Mem | awk '{printf "%.1f", ($3/$2) * 100.0}'),
    "disk_usage": $(df -h / | awk 'NR==2{print $5}' | sed 's/%//'),
    "load_average": "$(uptime | awk -F'load average:' '{print $2}' | sed 's/^ *//')",
    "network_connections": $(netstat -an | wc -l)
}
EOF
)

# 4. User activity metrics
USER_METRICS=$(sqlcmd -S "kindergarten-prod.database.windows.net" \
                      -d "kindergarten-production" \
                      -U "$DB_MONITORING_USER" \
                      -P "$DB_MONITORING_PASSWORD" \
                      -Q "
                      SELECT
                          (SELECT COUNT(DISTINCT ParentId) FROM SmsAuthentications WHERE CreatedAt > DATEADD(day, -1, GETUTCDATE()) AND IsVerified = 1) as daily_active_users,
                          (SELECT COUNT(*) FROM Photos WHERE UploadedAt > DATEADD(day, -1, GETUTCDATE())) as photos_uploaded_24h,
                          (SELECT COUNT(*) FROM NotificationLogs WHERE CreatedAt > DATEADD(day, -1, GETUTCDATE())) as notifications_sent_24h,
                          (SELECT COUNT(*) FROM DailyReports WHERE CreatedAt > DATEADD(day, -1, GETUTCDATE())) as reports_created_24h
                      " -h -1 -s "," | tail -n 1)

# 5. Combine all metrics
cat > "$METRICS_FILE" <<EOF
{
    "date": "$TODAY",
    "collection_time": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
    "system_metrics": $SYSTEM_METRICS,
    "application_metrics": $APP_METRICS,
    "database_metrics": "$DB_METRICS",
    "user_activity": "$USER_METRICS"
}
EOF

# 6. Generate daily report
generate_daily_report() {
    local report_file="$METRICS_DIR/daily-report-$TODAY.txt"

    {
        echo "Daily Performance Report - $TODAY"
        echo "=================================="
        echo ""
        echo "System Overview:"
        echo "  CPU Usage: $(echo "$SYSTEM_METRICS" | jq -r '.cpu_usage')%"
        echo "  Memory Usage: $(echo "$SYSTEM_METRICS" | jq -r '.memory_usage')%"
        echo "  Disk Usage: $(echo "$SYSTEM_METRICS" | jq -r '.disk_usage')%"
        echo ""
        echo "Database Performance:"
        echo "  Average CPU (24h): $(echo "$DB_METRICS" | cut -d',' -f2)%"
        echo "  Average I/O (24h): $(echo "$DB_METRICS" | cut -d',' -f3)%"
        echo "  Active Sessions: $(echo "$DB_METRICS" | cut -d',' -f4)"
        echo ""
        echo "User Activity (24h):"
        echo "  Active Users: $(echo "$USER_METRICS" | cut -d',' -f1)"
        echo "  Photos Uploaded: $(echo "$USER_METRICS" | cut -d',' -f2)"
        echo "  Notifications Sent: $(echo "$USER_METRICS" | cut -d',' -f3)"
        echo "  Reports Created: $(echo "$USER_METRICS" | cut -d',' -f4)"
        echo ""
        echo "Report generated at: $(date)"
    } > "$report_file"

    echo "Daily report generated: $report_file"
}

generate_daily_report

echo "Performance metrics collection completed"
```

### Weekly Maintenance Tasks

#### 1. Database Optimization
```bash
#!/bin/bash
# Weekly database maintenance
# Schedule: Sunday at 01:00 JST

MAINTENANCE_LOG="/var/log/kindergarten-app/maintenance/weekly-$(date +%Y%m%d).log"

echo "=== Weekly Database Maintenance - $(date) ===" >> "$MAINTENANCE_LOG"

# 1. Index maintenance
echo "Starting index maintenance..." >> "$MAINTENANCE_LOG"
sqlcmd -S "kindergarten-prod.database.windows.net" \
       -d "kindergarten-production" \
       -U "$DB_ADMIN_USER" \
       -P "$DB_ADMIN_PASSWORD" \
       -i "/scripts/weekly_index_maintenance.sql" \
       >> "$MAINTENANCE_LOG" 2>&1

# 2. Statistics update
echo "Updating database statistics..." >> "$MAINTENANCE_LOG"
sqlcmd -S "kindergarten-prod.database.windows.net" \
       -d "kindergarten-production" \
       -U "$DB_ADMIN_USER" \
       -P "$DB_ADMIN_PASSWORD" \
       -Q "EXEC sp_updatestats;" \
       >> "$MAINTENANCE_LOG" 2>&1

# 3. Database integrity check
echo "Performing database integrity check..." >> "$MAINTENANCE_LOG"
sqlcmd -S "kindergarten-prod.database.windows.net" \
       -d "kindergarten-production" \
       -U "$DB_ADMIN_USER" \
       -P "$DB_ADMIN_PASSWORD" \
       -Q "DBCC CHECKDB('kindergarten-production') WITH NO_INFOMSGS;" \
       >> "$MAINTENANCE_LOG" 2>&1

# 4. Performance analysis
echo "Analyzing query performance..." >> "$MAINTENANCE_LOG"
sqlcmd -S "kindergarten-prod.database.windows.net" \
       -d "kindergarten-production" \
       -U "$DB_MONITORING_USER" \
       -P "$DB_MONITORING_PASSWORD" \
       -i "/scripts/performance_analysis.sql" \
       >> "$MAINTENANCE_LOG" 2>&1

# 5. Backup verification
echo "Verifying recent backups..." >> "$MAINTENANCE_LOG"
BACKUP_COUNT=$(az storage blob list \
    --account-name "kindergartenbackups" \
    --container-name "backups" \
    --query "[?lastModified >= '$(date -d '7 days ago' -u +%Y-%m-%dT%H:%M:%S.%3NZ)']" \
    --output tsv | wc -l)

echo "Backups found in last 7 days: $BACKUP_COUNT" >> "$MAINTENANCE_LOG"

if [ "$BACKUP_COUNT" -lt 7 ]; then
    echo "WARNING: Insufficient backups found" >> "$MAINTENANCE_LOG"
    send_maintenance_alert "Backup Warning" "Only $BACKUP_COUNT backups found in last 7 days"
fi

echo "Weekly database maintenance completed" >> "$MAINTENANCE_LOG"
```

#### 2. Security Updates and Scanning
```bash
#!/bin/bash
# Weekly security maintenance
# Schedule: Sunday at 02:00 JST

SECURITY_LOG="/var/log/kindergarten-app/security/weekly-$(date +%Y%m%d).log"

echo "=== Weekly Security Maintenance - $(date) ===" >> "$SECURITY_LOG"

# 1. System updates check
echo "Checking for system updates..." >> "$SECURITY_LOG"
if command -v apt-get &> /dev/null; then
    apt list --upgradable 2>/dev/null | grep -v "WARNING" >> "$SECURITY_LOG"
elif command -v yum &> /dev/null; then
    yum check-update >> "$SECURITY_LOG" 2>&1
fi

# 2. Security scanning
echo "Performing security scan..." >> "$SECURITY_LOG"

# Check for suspicious login patterns
echo "Checking authentication logs..." >> "$SECURITY_LOG"
FAILED_LOGINS=$(grep "JWT認証失敗" /var/www/kindergarten-app/logs/kindergarten-$(date +%Y%m%d).txt | wc -l)
echo "Failed logins today: $FAILED_LOGINS" >> "$SECURITY_LOG"

if [ "$FAILED_LOGINS" -gt 100 ]; then
    echo "WARNING: High number of failed logins detected" >> "$SECURITY_LOG"
    send_security_alert "High Failed Login Rate" "Detected $FAILED_LOGINS failed login attempts"
fi

# Check for suspicious file changes
echo "Checking file integrity..." >> "$SECURITY_LOG"
find /var/www/kindergarten-app -name "*.dll" -o -name "*.exe" -o -name "*.config" | while read file; do
    if [ -f "$file.checksum" ]; then
        CURRENT_CHECKSUM=$(sha256sum "$file" | cut -d' ' -f1)
        STORED_CHECKSUM=$(cat "$file.checksum")

        if [ "$CURRENT_CHECKSUM" != "$STORED_CHECKSUM" ]; then
            echo "WARNING: File integrity check failed for $file" >> "$SECURITY_LOG"
            send_security_alert "File Integrity Alert" "Checksum mismatch detected for $file"
        fi
    else
        # Create initial checksum
        sha256sum "$file" | cut -d' ' -f1 > "$file.checksum"
    fi
done

# 3. SSL certificate monitoring
echo "Checking SSL certificates..." >> "$SECURITY_LOG"
CERT_EXPIRY=$(echo | openssl s_client -servername kindergarten.com -connect kindergarten.com:443 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
CERT_EXPIRY_EPOCH=$(date -d "$CERT_EXPIRY" +%s)
CURRENT_EPOCH=$(date +%s)
DAYS_UNTIL_EXPIRY=$(( (CERT_EXPIRY_EPOCH - CURRENT_EPOCH) / 86400 ))

echo "SSL certificate expires in $DAYS_UNTIL_EXPIRY days" >> "$SECURITY_LOG"

# 4. Dependency vulnerability scan
echo "Scanning for vulnerable dependencies..." >> "$SECURITY_LOG"
cd /var/www/kindergarten-app/reactapp.client
npm audit --audit-level high >> "$SECURITY_LOG" 2>&1

# 5. Access log analysis
echo "Analyzing access logs..." >> "$SECURITY_LOG"
SUSPICIOUS_IPS=$(grep -E "40[0-9]|50[0-9]" /var/log/nginx/access.log | awk '{print $1}' | sort | uniq -c | sort -nr | head -10)
echo "Top IPs with errors:" >> "$SECURITY_LOG"
echo "$SUSPICIOUS_IPS" >> "$SECURITY_LOG"

echo "Weekly security maintenance completed" >> "$SECURITY_LOG"

# Security alert function
send_security_alert() {
    local alert_type=$1
    local message=$2

    curl -X POST "$SLACK_WEBHOOK_URL" \
        -H 'Content-type: application/json' \
        --data "{
            \"text\": \"🔐 *Security Alert*\",
            \"attachments\": [{
                \"color\": \"danger\",
                \"title\": \"$alert_type\",
                \"text\": \"$message\",
                \"footer\": \"Weekly Security Scan\",
                \"ts\": $(date +%s)
            }]
        }"

    # Also send email for security alerts
    {
        echo "Subject: Security Alert - $alert_type"
        echo "From: security@kindergarten.com"
        echo "To: security-team@kindergarten.com"
        echo ""
        echo "Security Alert Detected"
        echo "======================"
        echo ""
        echo "Alert Type: $alert_type"
        echo "Message: $message"
        echo "Time: $(date)"
        echo ""
        echo "Please investigate immediately."
    } | sendmail security-team@kindergarten.com
}
```

### Monthly Maintenance Tasks

#### 1. Comprehensive System Analysis
```bash
#!/bin/bash
# Monthly comprehensive system analysis
# Schedule: First Sunday of month at 00:00 JST

MONTHLY_LOG="/var/log/kindergarten-app/maintenance/monthly-$(date +%Y%m).log"
ANALYSIS_DIR="/var/log/kindergarten-app/analysis/$(date +%Y%m)"

mkdir -p "$ANALYSIS_DIR"

echo "=== Monthly System Analysis - $(date) ===" >> "$MONTHLY_LOG"

# 1. Performance trend analysis
echo "Analyzing performance trends..." >> "$MONTHLY_LOG"
python3 /scripts/performance_trend_analysis.py \
    --input-dir "/var/log/kindergarten-app/metrics" \
    --output-dir "$ANALYSIS_DIR" \
    --period "30days" \
    >> "$MONTHLY_LOG" 2>&1

# 2. Capacity planning analysis
echo "Performing capacity planning analysis..." >> "$MONTHLY_LOG"
{
    echo "Storage Usage Trend (Last 30 days):"
    find /var/log/kindergarten-app/metrics -name "performance-*.json" -mtime -30 | while read file; do
        DATE=$(basename "$file" .json | cut -d'-' -f2)
        DISK_USAGE=$(jq -r '.system_metrics.disk_usage' "$file")
        echo "$DATE: ${DISK_USAGE}%"
    done | sort

    echo ""
    echo "User Growth Analysis:"
    sqlcmd -S "kindergarten-prod.database.windows.net" \
           -d "kindergarten-production" \
           -U "$DB_MONITORING_USER" \
           -P "$DB_MONITORING_PASSWORD" \
           -Q "
           SELECT
               YEAR(CreatedAt) as year,
               MONTH(CreatedAt) as month,
               COUNT(*) as new_users
           FROM Parents
           WHERE CreatedAt > DATEADD(month, -12, GETUTCDATE())
           GROUP BY YEAR(CreatedAt), MONTH(CreatedAt)
           ORDER BY year, month
           " -h -1
} >> "$ANALYSIS_DIR/capacity_analysis.txt"

# 3. Database growth analysis
echo "Analyzing database growth..." >> "$MONTHLY_LOG"
sqlcmd -S "kindergarten-prod.database.windows.net" \
       -d "kindergarten-production" \
       -U "$DB_MONITORING_USER" \
       -P "$DB_MONITORING_PASSWORD" \
       -Q "
       SELECT
           t.name as table_name,
           p.rows as row_count,
           SUM(a.total_pages) * 8 as total_space_kb,
           SUM(a.used_pages) * 8 as used_space_kb
       FROM sys.tables t
       INNER JOIN sys.indexes i ON t.object_id = i.object_id
       INNER JOIN sys.partitions p ON i.object_id = p.object_id AND i.index_id = p.index_id
       INNER JOIN sys.allocation_units a ON p.partition_id = a.container_id
       WHERE t.name NOT LIKE 'dt%' AND t.is_ms_shipped = 0 AND i.object_id > 255
       GROUP BY t.name, p.rows
       ORDER BY used_space_kb DESC
       " > "$ANALYSIS_DIR/database_growth.txt"

# 4. Error pattern analysis
echo "Analyzing error patterns..." >> "$MONTHLY_LOG"
find /var/www/kindergarten-app/logs -name "kindergarten-*.txt" -mtime -30 | while read logfile; do
    grep -E "\[ERR\]|\[FTL\]" "$logfile"
done | sort | uniq -c | sort -nr > "$ANALYSIS_DIR/error_patterns.txt"

# 5. Generate monthly report
generate_monthly_report() {
    local report_file="$ANALYSIS_DIR/monthly_report.txt"

    {
        echo "Monthly System Analysis Report"
        echo "=============================="
        echo "Report Date: $(date)"
        echo "Analysis Period: $(date -d '30 days ago' +%Y-%m-%d) to $(date +%Y-%m-%d)"
        echo ""

        echo "System Performance Summary:"
        echo "  Average CPU Usage: $(find /var/log/kindergarten-app/metrics -name "performance-*.json" -mtime -30 | xargs jq -r '.system_metrics.cpu_usage' | awk '{sum+=$1; count++} END {if(count>0) printf "%.1f%%\n", sum/count; else print "N/A"}')"
        echo "  Average Memory Usage: $(find /var/log/kindergarten-app/metrics -name "performance-*.json" -mtime -30 | xargs jq -r '.system_metrics.memory_usage' | awk '{sum+=$1; count++} END {if(count>0) printf "%.1f%%\n", sum/count; else print "N/A"}')"
        echo "  Peak Disk Usage: $(find /var/log/kindergarten-app/metrics -name "performance-*.json" -mtime -30 | xargs jq -r '.system_metrics.disk_usage' | sort -n | tail -1)%"
        echo ""

        echo "Database Summary:"
        echo "  Total Tables: $(wc -l < "$ANALYSIS_DIR/database_growth.txt")"
        echo "  Largest Table: $(head -1 "$ANALYSIS_DIR/database_growth.txt")"
        echo ""

        echo "Error Summary:"
        echo "  Total Error Instances: $(awk '{sum+=$1} END {print sum}' "$ANALYSIS_DIR/error_patterns.txt")"
        echo "  Most Common Error: $(head -1 "$ANALYSIS_DIR/error_patterns.txt")"
        echo ""

        echo "Recommendations:"

        # Automated recommendations based on analysis
        local avg_cpu=$(find /var/log/kindergarten-app/metrics -name "performance-*.json" -mtime -30 | xargs jq -r '.system_metrics.cpu_usage' | awk '{sum+=$1; count++} END {if(count>0) print sum/count; else print 0}')
        if (( $(echo "$avg_cpu > 70" | bc -l) )); then
            echo "  - Consider CPU upgrade or optimization (Average: ${avg_cpu}%)"
        fi

        local peak_disk=$(find /var/log/kindergarten-app/metrics -name "performance-*.json" -mtime -30 | xargs jq -r '.system_metrics.disk_usage' | sort -n | tail -1)
        if [ "$peak_disk" -gt 80 ]; then
            echo "  - Disk space cleanup or expansion needed (Peak: ${peak_disk}%)"
        fi

        local error_count=$(awk '{sum+=$1} END {print sum}' "$ANALYSIS_DIR/error_patterns.txt")
        if [ "$error_count" -gt 1000 ]; then
            echo "  - Investigate error patterns (Total: $error_count errors)"
        fi

        echo ""
        echo "Detailed analysis files:"
        ls -la "$ANALYSIS_DIR/"
    } > "$report_file"

    echo "Monthly report generated: $report_file"
}

generate_monthly_report

# 6. Send monthly report to stakeholders
send_monthly_report() {
    local report_file="$ANALYSIS_DIR/monthly_report.txt"

    curl -X POST "$SLACK_WEBHOOK_URL" \
        -H 'Content-type: application/json' \
        --data "{
            \"text\": \"📊 *Monthly System Analysis Report*\",
            \"attachments\": [{
                \"color\": \"good\",
                \"title\": \"Monthly Analysis Completed\",
                \"text\": \"Comprehensive system analysis for $(date +%B) has been completed.\",
                \"fields\": [
                    {\"title\": \"Report Location\", \"value\": \"$report_file\", \"short\": false}
                ],
                \"footer\": \"Monthly Maintenance\",
                \"ts\": $(date +%s)
            }]
        }"

    # Email report to stakeholders
    {
        echo "Subject: Monthly System Analysis Report - $(date +%B\ %Y)"
        echo "From: operations@kindergarten.com"
        echo "To: stakeholders@kindergarten.com"
        echo ""
        cat "$report_file"
    } | sendmail stakeholders@kindergarten.com
}

send_monthly_report

echo "Monthly system analysis completed" >> "$MONTHLY_LOG"
```

---

## System Health Checks

### Automated Health Monitoring

#### 1. Comprehensive Health Check Script
```bash
#!/bin/bash
# Comprehensive health check script
# Can be run on-demand or scheduled

HEALTH_LOG="/var/log/kindergarten-app/health/health-check-$(date +%Y%m%d-%H%M%S).log"
HEALTH_REPORT="/tmp/health-report-$(date +%Y%m%d-%H%M%S).json"

mkdir -p "$(dirname "$HEALTH_LOG")"

echo "Starting comprehensive health check at $(date)" | tee "$HEALTH_LOG"

# Initialize health report
cat > "$HEALTH_REPORT" <<EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
    "overall_status": "unknown",
    "checks": {}
}
EOF

# Function to update health report
update_health_report() {
    local check_name=$1
    local status=$2
    local message=$3
    local details=${4:-"null"}

    jq --arg name "$check_name" \
       --arg status "$status" \
       --arg message "$message" \
       --argjson details "$details" \
       '.checks[$name] = {status: $status, message: $message, details: $details, timestamp: now}' \
       "$HEALTH_REPORT" > "${HEALTH_REPORT}.tmp"
    mv "${HEALTH_REPORT}.tmp" "$HEALTH_REPORT"
}

# 1. Application Health Check
echo "Checking application health..." | tee -a "$HEALTH_LOG"
APP_HEALTH=$(curl -s -w "%{http_code}" "https://kindergarten-app-production.azurewebsites.net/health")
APP_STATUS_CODE=$(echo "$APP_HEALTH" | tail -n1)
APP_RESPONSE=$(echo "$APP_HEALTH" | head -n -1)

if [ "$APP_STATUS_CODE" = "200" ]; then
    echo "✓ Application health: OK" | tee -a "$HEALTH_LOG"
    update_health_report "application" "healthy" "Application responding normally" "$APP_RESPONSE"
else
    echo "✗ Application health: FAILED (HTTP $APP_STATUS_CODE)" | tee -a "$HEALTH_LOG"
    update_health_report "application" "unhealthy" "Application health check failed with HTTP $APP_STATUS_CODE" "\"$APP_RESPONSE\""
fi

# 2. Database Health Check
echo "Checking database health..." | tee -a "$HEALTH_LOG"
DB_CHECK=$(sqlcmd -S "kindergarten-prod.database.windows.net" \
                  -d "kindergarten-production" \
                  -U "$DB_MONITORING_USER" \
                  -P "$DB_MONITORING_PASSWORD" \
                  -Q "SELECT 'OK' as status" -h -1 2>/dev/null | tr -d ' ')

if [ "$DB_CHECK" = "OK" ]; then
    echo "✓ Database health: OK" | tee -a "$HEALTH_LOG"

    # Additional database checks
    DB_STATS=$(sqlcmd -S "kindergarten-prod.database.windows.net" \
                     -d "kindergarten-production" \
                     -U "$DB_MONITORING_USER" \
                     -P "$DB_MONITORING_PASSWORD" \
                     -Q "SELECT
                         (SELECT COUNT(*) FROM sys.dm_exec_sessions WHERE is_user_process = 1) as active_sessions,
                         (SELECT AVG(avg_cpu_percent) FROM sys.dm_db_resource_stats WHERE end_time > DATEADD(minute, -5, GETUTCDATE())) as avg_cpu,
                         (SELECT COUNT(*) FROM sys.dm_exec_requests WHERE blocking_session_id > 0) as blocked_sessions
                         " -h -1 -s "," | tail -n 1)

    update_health_report "database" "healthy" "Database responding normally" "\"$DB_STATS\""
else
    echo "✗ Database health: FAILED" | tee -a "$HEALTH_LOG"
    update_health_report "database" "unhealthy" "Database connectivity failed" "null"
fi

# 3. External Services Health Check
echo "Checking external services..." | tee -a "$HEALTH_LOG"

# SMS Service Check
SMS_CHECK=$(curl -s -w "%{http_code}" "$MEDIA4U_API_ENDPOINT/status" | tail -n1)
if [ "$SMS_CHECK" = "200" ]; then
    echo "✓ SMS service: OK" | tee -a "$HEALTH_LOG"
    update_health_report "sms_service" "healthy" "SMS service responding" "null"
else
    echo "✗ SMS service: FAILED (HTTP $SMS_CHECK)" | tee -a "$HEALTH_LOG"
    update_health_report "sms_service" "unhealthy" "SMS service check failed with HTTP $SMS_CHECK" "null"
fi

# Azure Notification Hub Check
NOTIFICATION_CHECK=$(curl -s -w "%{http_code}" "https://kindergarten-app-production.azurewebsites.net/api/health/notifications" | tail -n1)
if [ "$NOTIFICATION_CHECK" = "200" ]; then
    echo "✓ Notification service: OK" | tee -a "$HEALTH_LOG"
    update_health_report "notifications" "healthy" "Notification service responding" "null"
else
    echo "✗ Notification service: FAILED" | tee -a "$HEALTH_LOG"
    update_health_report "notifications" "unhealthy" "Notification service failed" "null"
fi

# 4. System Resources Check
echo "Checking system resources..." | tee -a "$HEALTH_LOG"

CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.1f", ($3/$2) * 100.0}')
DISK_USAGE=$(df -h / | awk 'NR==2{print $5}' | sed 's/%//')

RESOURCE_STATUS="healthy"
RESOURCE_MESSAGE="System resources within normal limits"

if (( $(echo "$CPU_USAGE > 90" | bc -l) )) || (( $(echo "$MEMORY_USAGE > 90" | bc -l) )) || [ "$DISK_USAGE" -gt 90 ]; then
    RESOURCE_STATUS="critical"
    RESOURCE_MESSAGE="System resources critically high"
elif (( $(echo "$CPU_USAGE > 80" | bc -l) )) || (( $(echo "$MEMORY_USAGE > 80" | bc -l) )) || [ "$DISK_USAGE" -gt 80 ]; then
    RESOURCE_STATUS="warning"
    RESOURCE_MESSAGE="System resources elevated"
fi

echo "  CPU: ${CPU_USAGE}%, Memory: ${MEMORY_USAGE}%, Disk: ${DISK_USAGE}%" | tee -a "$HEALTH_LOG"
update_health_report "system_resources" "$RESOURCE_STATUS" "$RESOURCE_MESSAGE" "{\"cpu\": $CPU_USAGE, \"memory\": $MEMORY_USAGE, \"disk\": $DISK_USAGE}"

# 5. Network Connectivity Check
echo "Checking network connectivity..." | tee -a "$HEALTH_LOG"

# Check internet connectivity
if ping -c 1 8.8.8.8 &> /dev/null; then
    echo "✓ Internet connectivity: OK" | tee -a "$HEALTH_LOG"
    update_health_report "internet" "healthy" "Internet connectivity available" "null"
else
    echo "✗ Internet connectivity: FAILED" | tee -a "$HEALTH_LOG"
    update_health_report "internet" "unhealthy" "Internet connectivity failed" "null"
fi

# Check Azure connectivity
if ping -c 1 kindergarten-prod.database.windows.net &> /dev/null; then
    echo "✓ Azure connectivity: OK" | tee -a "$HEALTH_LOG"
    update_health_report "azure_connectivity" "healthy" "Azure services reachable" "null"
else
    echo "✗ Azure connectivity: FAILED" | tee -a "$HEALTH_LOG"
    update_health_report "azure_connectivity" "unhealthy" "Azure services unreachable" "null"
fi

# 6. SSL Certificate Check
echo "Checking SSL certificates..." | tee -a "$HEALTH_LOG"
CERT_EXPIRY=$(echo | openssl s_client -servername kindergarten.com -connect kindergarten.com:443 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
CERT_EXPIRY_EPOCH=$(date -d "$CERT_EXPIRY" +%s)
CURRENT_EPOCH=$(date +%s)
DAYS_UNTIL_EXPIRY=$(( (CERT_EXPIRY_EPOCH - CURRENT_EPOCH) / 86400 ))

if [ "$DAYS_UNTIL_EXPIRY" -gt 30 ]; then
    echo "✓ SSL certificate: OK ($DAYS_UNTIL_EXPIRY days remaining)" | tee -a "$HEALTH_LOG"
    update_health_report "ssl_certificate" "healthy" "SSL certificate valid" "{\"days_remaining\": $DAYS_UNTIL_EXPIRY}"
elif [ "$DAYS_UNTIL_EXPIRY" -gt 7 ]; then
    echo "⚠ SSL certificate: WARNING ($DAYS_UNTIL_EXPIRY days remaining)" | tee -a "$HEALTH_LOG"
    update_health_report "ssl_certificate" "warning" "SSL certificate expires soon" "{\"days_remaining\": $DAYS_UNTIL_EXPIRY}"
else
    echo "✗ SSL certificate: CRITICAL ($DAYS_UNTIL_EXPIRY days remaining)" | tee -a "$HEALTH_LOG"
    update_health_report "ssl_certificate" "critical" "SSL certificate expires very soon" "{\"days_remaining\": $DAYS_UNTIL_EXPIRY}"
fi

# 7. Calculate Overall Health Status
echo "Calculating overall health status..." | tee -a "$HEALTH_LOG"

CRITICAL_COUNT=$(jq '[.checks[] | select(.status == "critical")] | length' "$HEALTH_REPORT")
UNHEALTHY_COUNT=$(jq '[.checks[] | select(.status == "unhealthy")] | length' "$HEALTH_REPORT")
WARNING_COUNT=$(jq '[.checks[] | select(.status == "warning")] | length' "$HEALTH_REPORT")

if [ "$CRITICAL_COUNT" -gt 0 ] || [ "$UNHEALTHY_COUNT" -gt 0 ]; then
    OVERALL_STATUS="unhealthy"
elif [ "$WARNING_COUNT" -gt 0 ]; then
    OVERALL_STATUS="degraded"
else
    OVERALL_STATUS="healthy"
fi

jq --arg status "$OVERALL_STATUS" '.overall_status = $status' "$HEALTH_REPORT" > "${HEALTH_REPORT}.tmp"
mv "${HEALTH_REPORT}.tmp" "$HEALTH_REPORT"

echo "Overall health status: $OVERALL_STATUS" | tee -a "$HEALTH_LOG"

# 8. Generate Health Summary
{
    echo ""
    echo "Health Check Summary:"
    echo "===================="
    echo "Overall Status: $OVERALL_STATUS"
    echo "Timestamp: $(date)"
    echo ""
    echo "Check Results:"
    jq -r '.checks | to_entries[] | "  \(.key): \(.value.status) - \(.value.message)"' "$HEALTH_REPORT"
    echo ""
    echo "Detailed report: $HEALTH_REPORT"
} | tee -a "$HEALTH_LOG"

# 9. Send Alerts if Needed
if [ "$OVERALL_STATUS" != "healthy" ]; then
    send_health_alert "$OVERALL_STATUS" "$HEALTH_REPORT"
fi

echo "Health check completed at $(date)" | tee -a "$HEALTH_LOG"

# Function to send health alerts
send_health_alert() {
    local status=$1
    local report_file=$2

    local color="warning"
    if [ "$status" = "unhealthy" ]; then
        color="danger"
    fi

    curl -X POST "$SLACK_WEBHOOK_URL" \
        -H 'Content-type: application/json' \
        --data "{
            \"text\": \"🏥 *System Health Alert*\",
            \"attachments\": [{
                \"color\": \"$color\",
                \"title\": \"System Status: $status\",
                \"text\": \"Comprehensive health check detected issues\",
                \"fields\": [
                    {\"title\": \"Critical Issues\", \"value\": \"$CRITICAL_COUNT\", \"short\": true},
                    {\"title\": \"Unhealthy Services\", \"value\": \"$UNHEALTHY_COUNT\", \"short\": true},
                    {\"title\": \"Warnings\", \"value\": \"$WARNING_COUNT\", \"short\": true}
                ],
                \"footer\": \"Health Check System\",
                \"ts\": $(date +%s)
            }]
        }"

    # Copy report to accessible location for review
    cp "$report_file" "/var/www/html/health-reports/latest.json"
}

# Cleanup old health reports (keep last 30 days)
find /var/log/kindergarten-app/health -name "health-check-*.log" -mtime +30 -delete
find /tmp -name "health-report-*.json" -mtime +1 -delete
```

#### 2. Service-Specific Health Checks
```bash
#!/bin/bash
# Service-specific health checks

check_application_health() {
    echo "Detailed application health check..."

    # Check if application is responding
    local app_response=$(curl -s -m 10 "https://kindergarten-app-production.azurewebsites.net/health")
    local health_data=$(echo "$app_response" | jq '.')

    # Check specific service endpoints
    local endpoints=(
        "/api/auth/health"
        "/api/family/health"
        "/api/photos/health"
        "/api/notifications/health"
    )

    for endpoint in "${endpoints[@]}"; do
        local status_code=$(curl -s -o /dev/null -w "%{http_code}" "https://kindergarten-app-production.azurewebsites.net$endpoint")
        echo "  $endpoint: HTTP $status_code"
    done

    # Check application metrics
    local metrics=$(curl -s "https://kindergarten-app-production.azurewebsites.net/metrics")
    echo "  Current request rate: $(echo "$metrics" | jq -r '.requestsPerMinute // "N/A"')"
    echo "  Average response time: $(echo "$metrics" | jq -r '.averageResponseTime // "N/A"')ms"
    echo "  Active connections: $(echo "$metrics" | jq -r '.activeConnections // "N/A"')"
}

check_database_health() {
    echo "Detailed database health check..."

    # Connection pool status
    local pool_status=$(sqlcmd -S "kindergarten-prod.database.windows.net" \
                              -d "kindergarten-production" \
                              -U "$DB_MONITORING_USER" \
                              -P "$DB_MONITORING_PASSWORD" \
                              -Q "
                              SELECT
                                  (SELECT COUNT(*) FROM sys.dm_exec_sessions WHERE is_user_process = 1) as active_sessions,
                                  (SELECT COUNT(*) FROM sys.dm_exec_requests) as active_requests,
                                  (SELECT COUNT(*) FROM sys.dm_exec_requests WHERE blocking_session_id > 0) as blocked_requests,
                                  (SELECT AVG(avg_cpu_percent) FROM sys.dm_db_resource_stats WHERE end_time > DATEADD(minute, -5, GETUTCDATE())) as avg_cpu_5min
                              " -h -1 -s "," | tail -n 1)

    echo "  Database connection status: $(echo "$pool_status" | cut -d',' -f1) active sessions"
    echo "  Active requests: $(echo "$pool_status" | cut -d',' -f2)"
    echo "  Blocked requests: $(echo "$pool_status" | cut -d',' -f3)"
    echo "  Average CPU (5min): $(echo "$pool_status" | cut -d',' -f4)%"

    # Check for long-running queries
    local long_queries=$(sqlcmd -S "kindergarten-prod.database.windows.net" \
                               -d "kindergarten-production" \
                               -U "$DB_MONITORING_USER" \
                               -P "$DB_MONITORING_PASSWORD" \
                               -Q "
                               SELECT COUNT(*) as long_running_queries
                               FROM sys.dm_exec_requests
                               WHERE start_time < DATEADD(minute, -5, GETUTCDATE())
                               " -h -1 | tail -n 1 | tr -d ' ')

    echo "  Long-running queries (>5min): $long_queries"

    # Check database file sizes
    local db_size=$(sqlcmd -S "kindergarten-prod.database.windows.net" \
                          -d "kindergarten-production" \
                          -U "$DB_MONITORING_USER" \
                          -P "$DB_MONITORING_PASSWORD" \
                          -Q "
                          SELECT
                              SUM(CAST(FILEPROPERTY(name, 'SpaceUsed') AS bigint) * 8192.) / (1024 * 1024) as used_mb,
                              SUM(CAST(size AS bigint) * 8192.) / (1024 * 1024) as allocated_mb
                          FROM sys.database_files
                          " -h -1 -s "," | tail -n 1)

    echo "  Database size: $(echo "$db_size" | cut -d',' -f1) MB used / $(echo "$db_size" | cut -d',' -f2) MB allocated"
}

check_external_services() {
    echo "Detailed external services health check..."

    # SMS Service detailed check
    echo "  SMS Service (Media4U):"
    local sms_test=$(curl -s -w "%{http_code}|%{time_total}" "$MEDIA4U_API_ENDPOINT/test" 2>/dev/null || echo "000|0")
    local sms_code=$(echo "$sms_test" | cut -d'|' -f1)
    local sms_time=$(echo "$sms_test" | cut -d'|' -f2)
    echo "    Status: HTTP $sms_code"
    echo "    Response time: ${sms_time}s"

    # Azure Services
    echo "  Azure Services:"

    # Application Insights
    local ai_test=$(curl -s -w "%{http_code}" "https://api.applicationinsights.io/v1/apps/$APP_INSIGHTS_ID/query" \
                         -H "X-API-Key: $APP_INSIGHTS_API_KEY" \
                         -d '{"query": "requests | take 1"}' 2>/dev/null || echo "000")
    echo "    Application Insights: HTTP $ai_test"

    # Azure Notification Hub (test through our API)
    local notification_test=$(curl -s -w "%{http_code}" "https://kindergarten-app-production.azurewebsites.net/api/admin/notifications/test" \
                                   -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || echo "000")
    echo "    Notification Hub: HTTP $notification_test"

    # Storage Account
    local storage_test=$(curl -s -w "%{http_code}" "https://kindergartenbackups.blob.core.windows.net/backups?restype=container&comp=list" 2>/dev/null || echo "000")
    echo "    Storage Account: HTTP $storage_test"
}

# Run all detailed checks
check_application_health
echo ""
check_database_health
echo ""
check_external_services
```

This comprehensive maintenance and operations guide provides detailed procedures for keeping the nursery management system running smoothly. The scripts and procedures cover daily, weekly, and monthly maintenance tasks, health monitoring, and performance optimization to ensure reliable system operation.