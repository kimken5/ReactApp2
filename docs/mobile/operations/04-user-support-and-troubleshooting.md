# User Support and Troubleshooting Guide
## Nursery Management System

### Table of Contents
1. [Support Overview](#support-overview)
2. [Common User Issues](#common-user-issues)
3. [Technical Support Procedures](#technical-support-procedures)
4. [User Account Management](#user-account-management)
5. [Escalation Procedures](#escalation-procedures)
6. [Data Management and Recovery](#data-management-and-recovery)
7. [Performance Issues](#performance-issues)
8. [Mobile App Support](#mobile-app-support)

---

## Support Overview

### Support Structure
- **Level 1**: Basic user support, common issues, password resets
- **Level 2**: Technical issues, account management, data problems
- **Level 3**: Complex technical issues, system modifications, escalations
- **Level 4**: Development team involvement, critical system issues

### Support Channels
- **Primary**: In-app help system and chat support
- **Email**: support@kindergarten.com
- **Phone**: +81-3-XXXX-XXXX (business hours: 8:00-18:00 JST)
- **Emergency**: +81-90-XXXX-XXXX (24/7 for critical issues)

### Response Time SLAs
- **Critical Issues**: 15 minutes response, 2 hours resolution
- **High Priority**: 2 hours response, 8 hours resolution
- **Medium Priority**: 4 hours response, 24 hours resolution
- **Low Priority**: 1 business day response, 3 business days resolution

---

## Common User Issues

### Authentication and Login Issues

#### 1. SMS Authentication Problems

**Issue**: SMS verification code not received
```
Symptoms:
- User enters phone number but doesn't receive SMS
- "Please wait before requesting another code" message
- Invalid verification code errors

Troubleshooting Steps:
1. Verify phone number format (+81XXXXXXXXX)
2. Check SMS service status in admin panel
3. Verify user's carrier supports SMS from international numbers
4. Check rate limiting logs for blocked requests
5. Manually send test SMS to verify service connectivity

Resolution Commands:
```bash
# Check SMS service status
curl -X GET "https://kindergarten-app-production.azurewebsites.net/api/admin/sms/status" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Check recent SMS attempts for user
grep "SMS send attempt" /var/www/kindergarten-app/logs/kindergarten-$(date +%Y%m%d).txt | grep "+81XXXXXXXXX"

# Manually trigger SMS resend (admin only)
curl -X POST "https://kindergarten-app-production.azurewebsites.net/api/admin/sms/resend" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+81XXXXXXXXX", "bypass": true}'
```

**Issue**: Invalid or expired verification codes
```
Symptoms:
- "Invalid verification code" error
- Code works intermittently
- Timezone-related issues

Troubleshooting Steps:
1. Check server time synchronization
2. Verify code expiration settings (default 5 minutes)
3. Check for multiple code generation requests
4. Verify clock synchronization on user's device

Resolution Commands:
```sql
-- Check recent SMS verification attempts
SELECT TOP 10
    s.PhoneNumber,
    s.Code,
    s.CreatedAt,
    s.ExpiresAt,
    s.IsVerified,
    s.VerifiedAt,
    DATEDIFF(MINUTE, s.CreatedAt, GETUTCDATE()) as age_minutes
FROM SmsAuthentications s
WHERE s.PhoneNumber = '+81XXXXXXXXX'
ORDER BY s.CreatedAt DESC;

-- Extend code expiration for specific user (emergency only)
UPDATE SmsAuthentications
SET ExpiresAt = DATEADD(MINUTE, 10, GETUTCDATE())
WHERE PhoneNumber = '+81XXXXXXXXX'
    AND IsVerified = 0
    AND CreatedAt = (
        SELECT MAX(CreatedAt)
        FROM SmsAuthentications
        WHERE PhoneNumber = '+81XXXXXXXXX' AND IsVerified = 0
    );
```

#### 2. Account Lockout Issues

**Issue**: User account locked due to multiple failed attempts
```
Symptoms:
- "Account temporarily locked" message
- Cannot generate new SMS codes
- Rate limiting errors

Troubleshooting Steps:
1. Check rate limiting logs
2. Verify IP address for suspicious activity
3. Check for automated attack patterns
4. Review authentication failure logs

Resolution Commands:
```bash
# Check rate limiting status for user
grep "Rate limit exceeded" /var/www/kindergarten-app/logs/kindergarten-$(date +%Y%m%d).txt | grep "+81XXXXXXXXX"

# Admin unlock user account
curl -X POST "https://kindergarten-app-production.azurewebsites.net/api/admin/users/unlock" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+81XXXXXXXXX"}'
```

### Photo and Media Issues

#### 1. Photo Upload Failures

**Issue**: Photos not uploading or upload timeouts
```
Symptoms:
- Upload progress stuck at certain percentage
- "Upload failed" error messages
- Large files timing out

Troubleshooting Steps:
1. Check file size limits (max 10MB per photo)
2. Verify supported file formats (JPEG, PNG, HEIC)
3. Check available storage space
4. Test upload with smaller files
5. Verify network connection stability

Resolution Commands:
```bash
# Check storage usage
df -h /var/www/kindergarten-app/uploads/

# Check recent upload attempts
grep "Photo upload" /var/www/kindergarten-app/logs/kindergarten-$(date +%Y%m%d).txt | tail -20

# Check for failed uploads
ls -la /var/www/kindergarten-app/uploads/temp/ | grep "$(date +%Y%m%d)"

# Clean up failed uploads
find /var/www/kindergarten-app/uploads/temp/ -mtime +1 -type f -delete
```

**Issue**: Photos not appearing in gallery
```
Symptoms:
- Upload successful but photos missing from gallery
- Inconsistent photo visibility between users
- Photos visible to some family members but not others

Troubleshooting Steps:
1. Check photo processing status
2. Verify photo permissions and consent settings
3. Check thumbnail generation
4. Verify database record creation

Resolution Commands:
```sql
-- Check recent photo uploads and processing status
SELECT TOP 20
    p.Id,
    p.FileName,
    p.UploadedAt,
    p.Status,
    p.VisibilityLevel,
    p.RequiresConsent,
    p.ThumbnailPath,
    s.FirstName + ' ' + s.LastName as UploadedBy
FROM Photos p
INNER JOIN Staff s ON p.UploadedByStaffId = s.Id
WHERE p.UploadedAt > DATEADD(DAY, -1, GETUTCDATE())
ORDER BY p.UploadedAt DESC;

-- Check photo-child associations
SELECT
    pc.PhotoId,
    pc.ChildId,
    c.Name as ChildName,
    pc.IsPrimarySubject
FROM PhotoChildren pc
INNER JOIN Children c ON pc.ChildId = c.Id
WHERE pc.PhotoId = [PHOTO_ID];

-- Check photo consent status
SELECT
    pcon.PhotoId,
    pcon.ChildId,
    pcon.ParentId,
    pcon.ConsentStatus,
    pcon.RequestedAt,
    pcon.RespondedAt
FROM PhotoConsents pcon
WHERE pcon.PhotoId = [PHOTO_ID];
```

#### 2. Photo Permission Issues

**Issue**: Parents cannot view photos of their children
```
Symptoms:
- Photos show "Permission required" message
- Inconsistent access between family members
- Some photos visible, others not

Troubleshooting Steps:
1. Verify parent-child relationships
2. Check photo consent settings
3. Verify family member permissions
4. Check photo visibility level settings

Resolution Commands:
```sql
-- Verify parent-child relationships
SELECT
    pcr.ParentId,
    pcr.ChildId,
    p.Name as ParentName,
    c.Name as ChildName,
    pcr.RelationshipType,
    pcr.IsActive,
    pcr.IsPrimaryContact
FROM ParentChildRelationships pcr
INNER JOIN Parents p ON pcr.ParentId = p.Id
INNER JOIN Children c ON pcr.ChildId = c.Id
WHERE p.PhoneNumber = '+81XXXXXXXXX'
    AND pcr.IsActive = 1;

-- Grant photo access to parent (if missing)
INSERT INTO PhotoAccesses (PhotoId, ParentId, AccessType, AccessedAt, IsSuccessful)
VALUES ([PHOTO_ID], [PARENT_ID], 'view', GETUTCDATE(), 1);
```

### Daily Reports and Communications

#### 1. Missing Daily Reports

**Issue**: Parents not receiving daily reports
```
Symptoms:
- No daily report notifications
- Reports missing from app
- Inconsistent delivery

Troubleshooting Steps:
1. Check notification settings
2. Verify report publishing status
3. Check notification delivery logs
4. Verify parent subscription to child's class

Resolution Commands:
```sql
-- Check recent daily reports for child
SELECT
    dr.Id,
    dr.ReportDate,
    dr.Title,
    dr.Status,
    dr.CreatedAt,
    dr.PublishedAt,
    c.Name as ChildName,
    s.FirstName + ' ' + s.LastName as CreatedBy
FROM DailyReports dr
INNER JOIN Children c ON dr.ChildId = c.Id
INNER JOIN Staff s ON dr.StaffId = s.Id
WHERE c.Id = [CHILD_ID]
    AND dr.ReportDate > DATEADD(DAY, -7, GETUTCDATE())
ORDER BY dr.ReportDate DESC;

-- Check notification delivery for daily reports
SELECT
    nl.NotificationType,
    nl.DeliveryMethod,
    nl.Status,
    nl.CreatedAt,
    nl.ErrorMessage
FROM NotificationLogs nl
WHERE nl.ParentId = [PARENT_ID]
    AND nl.NotificationType = 'DailyReport'
    AND nl.CreatedAt > DATEADD(DAY, -7, GETUTCDATE())
ORDER BY nl.CreatedAt DESC;

-- Check notification settings
SELECT
    ns.PushNotificationsEnabled,
    ns.DailyReportEnabled,
    ns.SmsNotificationsEnabled,
    ns.EmailNotificationsEnabled,
    ns.DeviceToken
FROM NotificationSettings ns
WHERE ns.ParentId = [PARENT_ID];
```

#### 2. Notification Delivery Issues

**Issue**: Push notifications not working
```
Symptoms:
- No push notifications received
- Notifications work sometimes but not always
- Different behavior on different devices

Troubleshooting Steps:
1. Check device token registration
2. Verify notification settings
3. Check Azure Notification Hub logs
4. Test notification delivery manually

Resolution Commands:
```bash
# Check device registrations
curl -X GET "https://kindergarten-app-production.azurewebsites.net/api/admin/notifications/devices" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  | jq '.[] | select(.userId == "[USER_ID]")'

# Send test notification
curl -X POST "https://kindergarten-app-production.azurewebsites.net/api/admin/notifications/test" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "[USER_ID]",
    "title": "Test Notification",
    "body": "This is a test notification from support"
  }'
```

### Family Management Issues

#### 1. Family Invitation Problems

**Issue**: Family invitations not working
```
Symptoms:
- Invitation codes not generating
- Invalid invitation code errors
- Expired invitation messages

Troubleshooting Steps:
1. Check invitation generation logs
2. Verify invitation expiration settings
3. Check email delivery for invitations
4. Verify family member limits

Resolution Commands:
```sql
-- Check recent family invitations
SELECT
    fi.Id,
    fi.InvitationCode,
    fi.InviteePhoneNumber,
    fi.InviteeName,
    fi.Status,
    fi.CreatedAt,
    fi.ExpiresAt,
    c.Name as ChildName,
    p.Name as InvitedBy
FROM FamilyInvitations fi
INNER JOIN Children c ON fi.ChildId = c.Id
INNER JOIN Parents p ON fi.InvitedByParentId = p.Id
WHERE fi.CreatedAt > DATEADD(DAY, -7, GETUTCDATE())
ORDER BY fi.CreatedAt DESC;

-- Extend invitation expiration
UPDATE FamilyInvitations
SET ExpiresAt = DATEADD(DAY, 7, GETUTCDATE())
WHERE InvitationCode = '[INVITATION_CODE]'
    AND Status = 'pending';

-- Manually create family relationship (emergency)
INSERT INTO ParentChildRelationships (ParentId, ChildId, RelationshipType, IsPrimaryContact, IsActive, CreatedAt)
VALUES ([PARENT_ID], [CHILD_ID], 'parent', 0, 1, GETUTCDATE());
```

---

## Technical Support Procedures

### Support Ticket Management

#### 1. Ticket Creation and Tracking
```bash
#!/bin/bash
# Support ticket management script

TICKET_ID=${1:-"TKT-$(date +%Y%m%d-%H%M%S)"}
USER_ID=${2}
PRIORITY=${3:-"medium"}
CATEGORY=${4:-"general"}
DESCRIPTION=${5:-"No description provided"}

# Create ticket record
create_ticket() {
    cat > "/var/log/kindergarten-app/support/tickets/$TICKET_ID.json" <<EOF
{
    "ticketId": "$TICKET_ID",
    "userId": "$USER_ID",
    "priority": "$PRIORITY",
    "category": "$CATEGORY",
    "description": "$DESCRIPTION",
    "status": "open",
    "assignedTo": "",
    "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
    "updatedAt": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
    "responses": [],
    "tags": [],
    "attachments": []
}
EOF

    echo "Support ticket created: $TICKET_ID"

    # Auto-assign based on category
    case $CATEGORY in
        "authentication")
            assign_ticket "$TICKET_ID" "auth-support@kindergarten.com"
            ;;
        "photos")
            assign_ticket "$TICKET_ID" "media-support@kindergarten.com"
            ;;
        "notifications")
            assign_ticket "$TICKET_ID" "notification-support@kindergarten.com"
            ;;
        *)
            assign_ticket "$TICKET_ID" "general-support@kindergarten.com"
            ;;
    esac
}

# Assign ticket to support agent
assign_ticket() {
    local ticket_id=$1
    local assignee=$2

    # Update ticket record
    jq --arg assignee "$assignee" '.assignedTo = $assignee | .updatedAt = now | .status = "assigned"' \
        "/var/log/kindergarten-app/support/tickets/$ticket_id.json" > "/tmp/$ticket_id.tmp"
    mv "/tmp/$ticket_id.tmp" "/var/log/kindergarten-app/support/tickets/$ticket_id.json"

    # Send notification to assignee
    send_ticket_notification "$ticket_id" "$assignee"
}

# Send ticket notification
send_ticket_notification() {
    local ticket_id=$1
    local assignee=$2

    curl -X POST "$SLACK_WEBHOOK_URL" \
        -H 'Content-type: application/json' \
        --data "{
            \"text\": \"🎫 New Support Ticket Assigned\",
            \"attachments\": [{
                \"color\": \"warning\",
                \"fields\": [
                    {\"title\": \"Ticket ID\", \"value\": \"$ticket_id\", \"short\": true},
                    {\"title\": \"Priority\", \"value\": \"$PRIORITY\", \"short\": true},
                    {\"title\": \"Category\", \"value\": \"$CATEGORY\", \"short\": true},
                    {\"title\": \"Assigned To\", \"value\": \"$assignee\", \"short\": true},
                    {\"title\": \"Description\", \"value\": \"$DESCRIPTION\", \"short\": false}
                ]
            }]
        }"
}

# Execute ticket creation
create_ticket
```

#### 2. Diagnostic Information Collection
```bash
#!/bin/bash
# Collect diagnostic information for support tickets

USER_ID=${1}
TICKET_ID=${2}
DIAG_DIR="/var/log/kindergarten-app/support/diagnostics/$TICKET_ID"

mkdir -p "$DIAG_DIR"

echo "Collecting diagnostic information for ticket $TICKET_ID (User: $USER_ID)"

# 1. User account information
echo "Collecting user account information..."
curl -X GET "https://kindergarten-app-production.azurewebsites.net/api/admin/users/$USER_ID/details" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  > "$DIAG_DIR/user-details.json"

# 2. Recent activity logs
echo "Collecting recent activity logs..."
grep "UserId.*$USER_ID" /var/www/kindergarten-app/logs/kindergarten-$(date +%Y%m%d).txt > "$DIAG_DIR/user-activity.log"

# 3. Error logs for user
echo "Collecting error logs..."
grep -E "ERROR.*$USER_ID|WARN.*$USER_ID" /var/www/kindergarten-app/logs/kindergarten-$(date +%Y%m%d).txt > "$DIAG_DIR/user-errors.log"

# 4. Authentication history
echo "Collecting authentication history..."
sqlcmd -S "kindergarten-prod.database.windows.net" \
       -d "kindergarten-production" \
       -U "$DB_READONLY_USER" \
       -P "$DB_READONLY_PASSWORD" \
       -Q "SELECT TOP 20 * FROM SmsAuthentications WHERE ParentId = $USER_ID ORDER BY CreatedAt DESC" \
       -o "$DIAG_DIR/auth-history.txt"

# 5. Device registrations
echo "Collecting device information..."
sqlcmd -S "kindergarten-prod.database.windows.net" \
       -d "kindergarten-production" \
       -U "$DB_READONLY_USER" \
       -P "$DB_READONLY_PASSWORD" \
       -Q "SELECT * FROM DeviceRegistrations WHERE UserId = $USER_ID AND IsActive = 1" \
       -o "$DIAG_DIR/devices.txt"

# 6. Notification history
echo "Collecting notification history..."
sqlcmd -S "kindergarten-prod.database.windows.net" \
       -d "kindergarten-production" \
       -U "$DB_READONLY_USER" \
       -P "$DB_READONLY_PASSWORD" \
       -Q "SELECT TOP 50 * FROM NotificationLogs WHERE ParentId = $USER_ID ORDER BY CreatedAt DESC" \
       -o "$DIAG_DIR/notifications.txt"

# 7. Family relationships
echo "Collecting family information..."
sqlcmd -S "kindergarten-prod.database.windows.net" \
       -d "kindergarten-production" \
       -U "$DB_READONLY_USER" \
       -P "$DB_READONLY_PASSWORD" \
       -Q "SELECT pcr.*, c.Name as ChildName FROM ParentChildRelationships pcr INNER JOIN Children c ON pcr.ChildId = c.Id WHERE pcr.ParentId = $USER_ID AND pcr.IsActive = 1" \
       -o "$DIAG_DIR/family-relationships.txt"

# 8. System status at time of issue
echo "Collecting system status..."
{
    echo "=== System Status at $(date) ==="
    curl -s "https://kindergarten-app-production.azurewebsites.net/health"
    echo ""
    echo "=== Performance Metrics ==="
    curl -s "https://kindergarten-app-production.azurewebsites.net/metrics"
} > "$DIAG_DIR/system-status.txt"

echo "Diagnostic information collected in $DIAG_DIR"

# Create summary report
{
    echo "Diagnostic Summary for Ticket $TICKET_ID"
    echo "User ID: $USER_ID"
    echo "Generated: $(date)"
    echo ""
    echo "Files collected:"
    ls -la "$DIAG_DIR/"
    echo ""
    echo "Recent errors:"
    head -10 "$DIAG_DIR/user-errors.log"
} > "$DIAG_DIR/summary.txt"

# Attach to ticket
jq --arg diagPath "$DIAG_DIR" '.attachments += [{"type": "diagnostic", "path": $diagPath}] | .updatedAt = now' \
    "/var/log/kindergarten-app/support/tickets/$TICKET_ID.json" > "/tmp/$TICKET_ID.tmp"
mv "/tmp/$TICKET_ID.tmp" "/var/log/kindergarten-app/support/tickets/$TICKET_ID.json"

echo "Diagnostic information attached to ticket $TICKET_ID"
```

### Remote Assistance Tools

#### 1. User Impersonation (Admin Only)
```bash
#!/bin/bash
# Safe user impersonation for support purposes

USER_PHONE=${1}
SUPPORT_AGENT=${2}
REASON=${3}

if [ -z "$USER_PHONE" ] || [ -z "$SUPPORT_AGENT" ] || [ -z "$REASON" ]; then
    echo "Usage: $0 <user_phone> <support_agent> <reason>"
    exit 1
fi

# Validate support agent authorization
if ! validate_support_agent "$SUPPORT_AGENT"; then
    echo "Error: Unauthorized support agent"
    exit 1
fi

# Log impersonation request
echo "$(date): Support impersonation started - Agent: $SUPPORT_AGENT, User: $USER_PHONE, Reason: $REASON" >> /var/log/kindergarten-app/support/impersonation.log

# Generate temporary admin token for user account
TEMP_TOKEN=$(curl -X POST "https://kindergarten-app-production.azurewebsites.net/api/admin/impersonate" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"userPhone\": \"$USER_PHONE\",
    \"supportAgent\": \"$SUPPORT_AGENT\",
    \"reason\": \"$REASON\",
    \"duration\": 3600
  }" | jq -r '.tempToken')

if [ "$TEMP_TOKEN" = "null" ] || [ -z "$TEMP_TOKEN" ]; then
    echo "Error: Failed to generate impersonation token"
    exit 1
fi

echo "Temporary access token generated (expires in 1 hour):"
echo "Token: $TEMP_TOKEN"
echo ""
echo "Use this token to make API calls on behalf of the user:"
echo "curl -H 'Authorization: Bearer $TEMP_TOKEN' https://kindergarten-app-production.azurewebsites.net/api/..."
echo ""
echo "IMPORTANT: This session is logged and audited. Use only for legitimate support purposes."

# Set up automatic cleanup
(sleep 3600; echo "$(date): Support impersonation expired - Agent: $SUPPORT_AGENT, User: $USER_PHONE" >> /var/log/kindergarten-app/support/impersonation.log) &
```

#### 2. Account Reset Tools
```bash
#!/bin/bash
# Account reset tools for support

USER_PHONE=${1}
RESET_TYPE=${2}

case $RESET_TYPE in
    "password")
        echo "Resetting SMS authentication for $USER_PHONE..."
        # Invalidate all existing SMS codes
        sqlcmd -S "kindergarten-prod.database.windows.net" \
               -d "kindergarten-production" \
               -U "$DB_ADMIN_USER" \
               -P "$DB_ADMIN_PASSWORD" \
               -Q "UPDATE SmsAuthentications SET IsVerified = 0, ExpiresAt = GETUTCDATE() WHERE PhoneNumber = '$USER_PHONE' AND IsVerified = 0"
        echo "SMS authentication reset completed"
        ;;

    "tokens")
        echo "Revoking all tokens for $USER_PHONE..."
        # Revoke all refresh tokens
        sqlcmd -S "kindergarten-prod.database.windows.net" \
               -d "kindergarten-production" \
               -U "$DB_ADMIN_USER" \
               -P "$DB_ADMIN_PASSWORD" \
               -Q "UPDATE RefreshTokens SET IsRevoked = 1, RevokedAt = GETUTCDATE() WHERE ParentId IN (SELECT Id FROM Parents WHERE PhoneNumber = '$USER_PHONE')"
        echo "All tokens revoked"
        ;;

    "notifications")
        echo "Resetting notification settings for $USER_PHONE..."
        # Reset to default notification settings
        sqlcmd -S "kindergarten-prod.database.windows.net" \
               -d "kindergarten-production" \
               -U "$DB_ADMIN_USER" \
               -P "$DB_ADMIN_PASSWORD" \
               -Q "UPDATE NotificationSettings SET PushNotificationsEnabled = 1, DailyReportEnabled = 1, EventNotificationEnabled = 1 WHERE ParentId IN (SELECT Id FROM Parents WHERE PhoneNumber = '$USER_PHONE')"
        echo "Notification settings reset to defaults"
        ;;

    "device")
        echo "Clearing device registrations for $USER_PHONE..."
        # Deactivate all device registrations
        sqlcmd -S "kindergarten-prod.database.windows.net" \
               -d "kindergarten-production" \
               -U "$DB_ADMIN_USER" \
               -P "$DB_ADMIN_PASSWORD" \
               -Q "UPDATE DeviceRegistrations SET IsActive = 0 WHERE UserId IN (SELECT Id FROM Parents WHERE PhoneNumber = '$USER_PHONE')"
        echo "Device registrations cleared"
        ;;

    "cache")
        echo "Clearing cache for $USER_PHONE..."
        # Clear user-specific cache entries
        curl -X DELETE "https://kindergarten-app-production.azurewebsites.net/api/admin/cache/user" \
          -H "Authorization: Bearer $ADMIN_TOKEN" \
          -H "Content-Type: application/json" \
          -d "{\"userPhone\": \"$USER_PHONE\"}"
        echo "User cache cleared"
        ;;

    *)
        echo "Unknown reset type: $RESET_TYPE"
        echo "Available types: password, tokens, notifications, device, cache"
        exit 1
        ;;
esac

# Log the reset action
echo "$(date): Account reset performed - Type: $RESET_TYPE, User: $USER_PHONE, Agent: $USER" >> /var/log/kindergarten-app/support/account-resets.log
```

---

## User Account Management

### Account Lifecycle Management

#### 1. New Account Setup
```sql
-- New parent account setup procedure

-- 1. Create parent record
INSERT INTO Parents (PhoneNumber, Name, Email, IsActive, CreatedAt)
VALUES ('+81XXXXXXXXX', 'Parent Name', 'email@example.com', 1, GETUTCDATE());

DECLARE @ParentId INT = SCOPE_IDENTITY();

-- 2. Create default notification settings
INSERT INTO NotificationSettings (
    ParentId,
    PushNotificationsEnabled,
    DailyReportEnabled,
    EventNotificationEnabled,
    AnnouncementEnabled,
    CreatedAt
)
VALUES (
    @ParentId,
    1, -- Push notifications enabled
    1, -- Daily reports enabled
    1, -- Event notifications enabled
    1, -- Announcements enabled
    GETUTCDATE()
);

-- 3. Link to child (if child already exists)
-- This would typically be done through family invitation process
-- INSERT INTO ParentChildRelationships (ParentId, ChildId, RelationshipType, IsPrimaryContact, IsActive, CreatedAt)
-- VALUES (@ParentId, [CHILD_ID], 'parent', 0, 1, GETUTCDATE());

SELECT
    'Account created successfully' as Result,
    @ParentId as ParentId,
    '+81XXXXXXXXX' as PhoneNumber;
```

#### 2. Account Deactivation
```sql
-- Account deactivation procedure (soft delete)

DECLARE @PhoneNumber NVARCHAR(15) = '+81XXXXXXXXX';

-- 1. Deactivate parent account
UPDATE Parents
SET IsActive = 0,
    DeactivatedAt = GETUTCDATE()
WHERE PhoneNumber = @PhoneNumber;

-- 2. Deactivate relationships
UPDATE ParentChildRelationships
SET IsActive = 0
WHERE ParentId IN (SELECT Id FROM Parents WHERE PhoneNumber = @PhoneNumber);

-- 3. Revoke all tokens
UPDATE RefreshTokens
SET IsRevoked = 1,
    RevokedAt = GETUTCDATE()
WHERE ParentId IN (SELECT Id FROM Parents WHERE PhoneNumber = @PhoneNumber);

-- 4. Deactivate device registrations
UPDATE DeviceRegistrations
SET IsActive = 0
WHERE UserId IN (SELECT Id FROM Parents WHERE PhoneNumber = @PhoneNumber);

-- 5. Disable notifications
UPDATE NotificationSettings
SET PushNotificationsEnabled = 0,
    SmsNotificationsEnabled = 0,
    EmailNotificationsEnabled = 0
WHERE ParentId IN (SELECT Id FROM Parents WHERE PhoneNumber = @PhoneNumber);

-- 6. Log deactivation
INSERT INTO AccountActions (ParentId, ActionType, ActionDate, PerformedBy)
SELECT Id, 'deactivation', GETUTCDATE(), SYSTEM_USER
FROM Parents
WHERE PhoneNumber = @PhoneNumber;

SELECT 'Account deactivated successfully' as Result;
```

#### 3. Data Export (GDPR Compliance)
```bash
#!/bin/bash
# Export user data for GDPR compliance

USER_PHONE=${1}
EXPORT_DIR="/var/exports/user-data"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
EXPORT_FILE="$EXPORT_DIR/user_data_${USER_PHONE//+/}_$TIMESTAMP.zip"

mkdir -p "$EXPORT_DIR/temp/$TIMESTAMP"
TEMP_DIR="$EXPORT_DIR/temp/$TIMESTAMP"

echo "Exporting data for user: $USER_PHONE"

# 1. Export parent information
echo "Exporting parent information..."
sqlcmd -S "kindergarten-prod.database.windows.net" \
       -d "kindergarten-production" \
       -U "$DB_READONLY_USER" \
       -P "$DB_READONLY_PASSWORD" \
       -Q "SELECT * FROM Parents WHERE PhoneNumber = '$USER_PHONE'" \
       -o "$TEMP_DIR/parent_info.txt"

# 2. Export children relationships
echo "Exporting children relationships..."
sqlcmd -S "kindergarten-prod.database.windows.net" \
       -d "kindergarten-production" \
       -U "$DB_READONLY_USER" \
       -P "$DB_READONLY_PASSWORD" \
       -Q "SELECT pcr.*, c.Name as ChildName FROM ParentChildRelationships pcr INNER JOIN Children c ON pcr.ChildId = c.Id WHERE pcr.ParentId IN (SELECT Id FROM Parents WHERE PhoneNumber = '$USER_PHONE')" \
       -o "$TEMP_DIR/children.txt"

# 3. Export SMS authentication history
echo "Exporting authentication history..."
sqlcmd -S "kindergarten-prod.database.windows.net" \
       -d "kindergarten-production" \
       -U "$DB_READONLY_USER" \
       -P "$DB_READONLY_PASSWORD" \
       -Q "SELECT CreatedAt, IsVerified, ClientIpAddress FROM SmsAuthentications WHERE ParentId IN (SELECT Id FROM Parents WHERE PhoneNumber = '$USER_PHONE')" \
       -o "$TEMP_DIR/auth_history.txt"

# 4. Export notification history
echo "Exporting notification history..."
sqlcmd -S "kindergarten-prod.database.windows.net" \
       -d "kindergarten-production" \
       -U "$DB_READONLY_USER" \
       -P "$DB_READONLY_PASSWORD" \
       -Q "SELECT NotificationType, DeliveryMethod, CreatedAt, Status FROM NotificationLogs WHERE ParentId IN (SELECT Id FROM Parents WHERE PhoneNumber = '$USER_PHONE')" \
       -o "$TEMP_DIR/notifications.txt"

# 5. Export daily report responses
echo "Exporting daily report responses..."
sqlcmd -S "kindergarten-prod.database.windows.net" \
       -d "kindergarten-production" \
       -U "$DB_READONLY_USER" \
       -P "$DB_READONLY_PASSWORD" \
       -Q "SELECT drr.ResponseMessage, drr.CreatedAt, dr.Title FROM DailyReportResponses drr INNER JOIN DailyReports dr ON drr.DailyReportId = dr.Id WHERE drr.ParentId IN (SELECT Id FROM Parents WHERE PhoneNumber = '$USER_PHONE')" \
       -o "$TEMP_DIR/daily_report_responses.txt"

# 6. Export photo access logs
echo "Exporting photo access logs..."
sqlcmd -S "kindergarten-prod.database.windows.net" \
       -d "kindergarten-production" \
       -U "$DB_READONLY_USER" \
       -P "$DB_READONLY_PASSWORD" \
       -Q "SELECT AccessType, AccessedAt, IsSuccessful FROM PhotoAccesses WHERE ParentId IN (SELECT Id FROM Parents WHERE PhoneNumber = '$USER_PHONE')" \
       -o "$TEMP_DIR/photo_access.txt"

# 7. Create data export summary
echo "Creating export summary..."
{
    echo "Data Export Summary"
    echo "==================="
    echo "User: $USER_PHONE"
    echo "Export Date: $(date)"
    echo "Export ID: $TIMESTAMP"
    echo ""
    echo "Files included:"
    ls -la "$TEMP_DIR/"
    echo ""
    echo "This export contains all personal data stored in the Kindergarten Management System"
    echo "for the specified user account as of the export date."
} > "$TEMP_DIR/export_summary.txt"

# 8. Create ZIP archive
echo "Creating ZIP archive..."
cd "$EXPORT_DIR/temp"
zip -r "../user_data_${USER_PHONE//+/}_$TIMESTAMP.zip" "$TIMESTAMP/"

# 9. Clean up temporary files
rm -rf "$TEMP_DIR"

# 10. Log export action
echo "$(date): Data export completed - User: $USER_PHONE, File: $EXPORT_FILE, Agent: $USER" >> /var/log/kindergarten-app/support/data-exports.log

echo "Data export completed: $EXPORT_FILE"
echo "File size: $(ls -lh "$EXPORT_FILE" | awk '{print $5}')"
echo ""
echo "Please provide this file to the user and delete it after delivery."
echo "Retention period: 30 days"
```

---

## Escalation Procedures

### Escalation Matrix

#### 1. Technical Escalation Paths
```markdown
# Technical Escalation Matrix

## Level 1 → Level 2 Escalation
**Triggers:**
- Issue unresolved after 2 hours
- Multiple related incidents
- User VIP status
- Business impact assessment: Medium or High

**Actions:**
1. Create escalation record
2. Notify Level 2 engineer
3. Transfer all diagnostic data
4. Schedule handoff call if needed

## Level 2 → Level 3 Escalation
**Triggers:**
- Issue unresolved after 4 hours
- System-wide impact
- Security implications
- Data integrity concerns

**Actions:**
1. Engage senior engineer
2. Create war room if needed
3. Notify management
4. Activate emergency procedures if critical

## Level 3 → Development Team Escalation
**Triggers:**
- Bug requiring code changes
- System architecture issues
- New feature requirements
- Security vulnerabilities

**Actions:**
1. Create development ticket
2. Provide detailed reproduction steps
3. Include system impact assessment
4. Schedule emergency release if critical
```

#### 2. Escalation Automation
```bash
#!/bin/bash
# Automated escalation script

TICKET_ID=${1}
CURRENT_LEVEL=${2}
ESCALATION_REASON=${3}

echo "Processing escalation for ticket $TICKET_ID from Level $CURRENT_LEVEL"

# Load ticket information
TICKET_INFO=$(cat "/var/log/kindergarten-app/support/tickets/$TICKET_ID.json")
PRIORITY=$(echo "$TICKET_INFO" | jq -r '.priority')
CATEGORY=$(echo "$TICKET_INFO" | jq -r '.category')
USER_ID=$(echo "$TICKET_INFO" | jq -r '.userId')

# Determine escalation target
get_escalation_target() {
    local level=$1
    local category=$2

    case "$level:$category" in
        "1:authentication")
            echo "auth-specialist@kindergarten.com"
            ;;
        "1:photos")
            echo "media-specialist@kindergarten.com"
            ;;
        "2:*")
            echo "senior-support@kindergarten.com"
            ;;
        "3:*")
            echo "engineering-lead@kindergarten.com"
            ;;
        *)
            echo "escalation-manager@kindergarten.com"
            ;;
    esac
}

ESCALATION_TARGET=$(get_escalation_target "$((CURRENT_LEVEL + 1))" "$CATEGORY")

# Update ticket record
jq --arg level "$((CURRENT_LEVEL + 1))" \
   --arg target "$ESCALATION_TARGET" \
   --arg reason "$ESCALATION_REASON" \
   '.escalationLevel = ($level | tonumber) | .assignedTo = $target | .escalationReason = $reason | .escalatedAt = now | .updatedAt = now' \
   "/var/log/kindergarten-app/support/tickets/$TICKET_ID.json" > "/tmp/$TICKET_ID.tmp"
mv "/tmp/$TICKET_ID.tmp" "/var/log/kindergarten-app/support/tickets/$TICKET_ID.json"

# Send escalation notification
send_escalation_notification() {
    local ticket_id=$1
    local target=$2
    local level=$3

    curl -X POST "$SLACK_WEBHOOK_URL" \
        -H 'Content-type: application/json' \
        --data "{
            \"text\": \"🚨 *Ticket Escalation - Level $level*\",
            \"attachments\": [{
                \"color\": \"danger\",
                \"fields\": [
                    {\"title\": \"Ticket ID\", \"value\": \"$ticket_id\", \"short\": true},
                    {\"title\": \"Priority\", \"value\": \"$PRIORITY\", \"short\": true},
                    {\"title\": \"Category\", \"value\": \"$CATEGORY\", \"short\": true},
                    {\"title\": \"Escalated To\", \"value\": \"$target\", \"short\": true},
                    {\"title\": \"Reason\", \"value\": \"$ESCALATION_REASON\", \"short\": false}
                ],
                \"actions\": [{
                    \"type\": \"button\",
                    \"text\": \"View Ticket\",
                    \"url\": \"https://support.kindergarten.com/tickets/$ticket_id\"
                }]
            }]
        }"

    # Send email notification
    {
        echo "Subject: Ticket Escalation - $ticket_id (Level $level)"
        echo "From: support@kindergarten.com"
        echo "To: $target"
        echo ""
        echo "A support ticket has been escalated to you:"
        echo ""
        echo "Ticket ID: $ticket_id"
        echo "Priority: $PRIORITY"
        echo "Category: $CATEGORY"
        echo "User ID: $USER_ID"
        echo "Escalation Reason: $ESCALATION_REASON"
        echo ""
        echo "Please review the ticket and take appropriate action."
        echo ""
        echo "Ticket Details: https://support.kindergarten.com/tickets/$ticket_id"
    } | sendmail "$target"
}

send_escalation_notification "$TICKET_ID" "$ESCALATION_TARGET" "$((CURRENT_LEVEL + 1))"

# For high-priority escalations, also notify management
if [ "$PRIORITY" = "critical" ] || [ "$PRIORITY" = "high" ]; then
    send_escalation_notification "$TICKET_ID" "management@kindergarten.com" "Management"
fi

echo "Ticket $TICKET_ID escalated to Level $((CURRENT_LEVEL + 1)) ($ESCALATION_TARGET)"

# Log escalation
echo "$(date): Ticket escalation - ID: $TICKET_ID, From: Level $CURRENT_LEVEL, To: Level $((CURRENT_LEVEL + 1)), Target: $ESCALATION_TARGET, Reason: $ESCALATION_REASON" >> /var/log/kindergarten-app/support/escalations.log
```

### Emergency Response Procedures

#### 1. Critical Issue Response
```bash
#!/bin/bash
# Critical issue emergency response

ISSUE_TYPE=${1:-"system-outage"}
DESCRIPTION=${2:-"Critical system issue"}
REPORTER=${3:-"automated-monitoring"}

INCIDENT_ID="CRIT-$(date +%Y%m%d-%H%M%S)"

echo "CRITICAL ISSUE DETECTED: $INCIDENT_ID"
echo "Type: $ISSUE_TYPE"
echo "Description: $DESCRIPTION"
echo "Reporter: $REPORTER"

# 1. Immediate notifications
send_critical_alerts() {
    # Emergency Slack notification
    curl -X POST "$EMERGENCY_SLACK_WEBHOOK" \
        -H 'Content-type: application/json' \
        --data "{
            \"text\": \"🚨 **CRITICAL EMERGENCY** 🚨\",
            \"attachments\": [{
                \"color\": \"danger\",
                \"title\": \"$INCIDENT_ID\",
                \"fields\": [
                    {\"title\": \"Type\", \"value\": \"$ISSUE_TYPE\", \"short\": true},
                    {\"title\": \"Reporter\", \"value\": \"$REPORTER\", \"short\": true},
                    {\"title\": \"Description\", \"value\": \"$DESCRIPTION\", \"short\": false},
                    {\"title\": \"Time\", \"value\": \"$(date)\", \"short\": true}
                ]
            }]
        }"

    # Emergency SMS to on-call team
    local phone_numbers=("+81901234567" "+81909876543" "+81905555555")
    for phone in "${phone_numbers[@]}"; do
        curl -X POST "$SMS_API_ENDPOINT" \
            -H "Content-Type: application/json" \
            -d "{
                \"to\": \"$phone\",
                \"message\": \"CRITICAL ALERT: $INCIDENT_ID - $ISSUE_TYPE. Immediate attention required. Check Slack for details.\"
            }"
    done

    # Emergency email
    {
        echo "Subject: 🚨 CRITICAL EMERGENCY - $INCIDENT_ID"
        echo "From: emergency@kindergarten.com"
        echo "To: oncall@kindergarten.com"
        echo "Priority: urgent"
        echo ""
        echo "CRITICAL ISSUE DETECTED"
        echo "======================"
        echo ""
        echo "Incident ID: $INCIDENT_ID"
        echo "Type: $ISSUE_TYPE"
        echo "Time: $(date)"
        echo "Reporter: $REPORTER"
        echo ""
        echo "Description:"
        echo "$DESCRIPTION"
        echo ""
        echo "IMMEDIATE ACTION REQUIRED"
    } | sendmail oncall@kindergarten.com
}

# 2. Activate emergency procedures
activate_emergency_procedures() {
    echo "Activating emergency procedures..."

    # Create emergency war room
    curl -X POST "https://slack.com/api/channels.create" \
        -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
        -H "Content-type: application/json" \
        --data "{
            \"name\": \"emergency-$INCIDENT_ID\",
            \"purpose\": \"Emergency response for $INCIDENT_ID\"
        }"

    # Update status page
    curl -X POST "https://api.statuspage.io/v1/pages/$STATUSPAGE_ID/incidents" \
        -H "Authorization: OAuth $STATUSPAGE_API_KEY" \
        -H "Content-Type: application/json" \
        --data "{
            \"incident\": {
                \"name\": \"Service Emergency - $INCIDENT_ID\",
                \"status\": \"investigating\",
                \"impact_override\": \"critical\",
                \"body\": \"We are investigating a critical issue affecting our services. Updates will be provided as they become available.\",
                \"component_ids\": [\"$MAIN_COMPONENT_ID\"]
            }
        }"

    # Start collecting diagnostics
    /usr/local/bin/collect-emergency-diagnostics.sh "$INCIDENT_ID" &

    # Notify external stakeholders if needed
    if [ "$ISSUE_TYPE" = "data-breach" ] || [ "$ISSUE_TYPE" = "security-incident" ]; then
        echo "Security incident detected. Activating security response team..."
        # Additional security-specific procedures would go here
    fi
}

# 3. Log incident
log_critical_incident() {
    cat > "/var/log/kindergarten-app/incidents/critical/$INCIDENT_ID.json" <<EOF
{
    "incidentId": "$INCIDENT_ID",
    "type": "$ISSUE_TYPE",
    "severity": "critical",
    "description": "$DESCRIPTION",
    "reporter": "$REPORTER",
    "status": "active",
    "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
    "notifications": {
        "slack": true,
        "sms": true,
        "email": true,
        "statusPage": true
    },
    "responseTeam": [],
    "timeline": [
        {
            "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
            "action": "incident_detected",
            "description": "Critical incident detected and emergency response activated"
        }
    ]
}
EOF
}

# Execute emergency response
send_critical_alerts
activate_emergency_procedures
log_critical_incident

echo "Emergency response activated for $INCIDENT_ID"
echo "War room: emergency-$INCIDENT_ID"
echo "Status page updated: https://status.kindergarten.com"
echo "Diagnostic collection in progress..."
```

This comprehensive user support and troubleshooting guide provides detailed procedures for handling common issues, managing user accounts, and escalating problems when needed. The guide includes both automated tools and manual procedures to ensure effective support operations.