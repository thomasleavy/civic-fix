# Email Notification Setup

The CivicFix platform includes a comprehensive email notification system. The logic is fully implemented and ready to use, but email sending is optional and will gracefully skip if not configured.

## Features

### 1. Status Change Notifications
- Automatically sent when an admin updates the status of an issue or suggestion
- Includes case ID, title, old status, new status, and optional admin note
- Sent to the user who submitted the issue/suggestion

### 2. Admin Response Notifications
- Sent when an admin responds to an issue or suggestion
- Includes the admin's message and case details
- Allows admins to communicate directly with users

### 3. Weekly Summary Emails
- Automatically sent every Monday at 9 AM
- Summarizes all issues and suggestions submitted in the past week
- Includes case IDs, titles, and current statuses
- Only sent to users who have submitted items that week

## Configuration

### Environment Variables

Add these to your `server/.env` file:

```env
# Email Configuration (Optional - emails will be skipped if not configured)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@civicfix.com

# Enable weekly email summaries (set to 'true' to enable)
ENABLE_WEEKLY_EMAILS=false
```

### Gmail Setup Example

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. **Use the app password** in `SMTP_PASS`

### Other Email Providers

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

**Mailgun:**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
```

**Outlook/Office 365:**
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

## API Endpoints

### Status Updates (with email notification)

**Update Issue Status:**
```
PATCH /api/issues/:id/status
Headers: Authorization: Bearer <token>
Body: {
  "status": "in_progress",
  "adminNote": "Optional note for the user"
}
```

**Update Suggestion Status:**
```
PATCH /api/suggestions/:id/status
Headers: Authorization: Bearer <token>
Body: {
  "status": "approved",
  "adminNote": "Optional note for the user"
}
```

### Admin Responses (with email notification)

**Send Response to Issue:**
```
POST /api/issues/:id/response
Headers: Authorization: Bearer <admin-token>
Body: {
  "message": "Thank you for reporting this. We're looking into it."
}
```

**Send Response to Suggestion:**
```
POST /api/suggestions/:id/response
Headers: Authorization: Bearer <admin-token>
Body: {
  "message": "Great suggestion! We'll consider this for implementation."
}
```

### Manual Weekly Summary Trigger (Admin Only)

**Trigger Weekly Emails Manually:**
```
POST /api/admin/trigger-weekly-emails
Headers: Authorization: Bearer <admin-token>
```

## How It Works

1. **Email Service** (`server/src/services/emailService.ts`):
   - Checks if email is configured
   - Creates email templates (HTML and plain text)
   - Sends emails via nodemailer
   - Gracefully handles failures (won't break the app)

2. **Status Updates**:
   - When an admin updates status, the system:
     - Updates the database
     - Sends email notification (if configured)
     - Logs success/failure (doesn't fail the request)

3. **Weekly Summaries**:
   - Scheduler runs automatically every Monday at 9 AM
   - Can be enabled/disabled via `ENABLE_WEEKLY_EMAILS`
   - Can be manually triggered via admin endpoint

## Testing

### Without Email Configuration
- All email functions will log to console instead of sending
- Status updates and admin responses will still work
- Weekly summaries will be skipped

### With Email Configuration
- Emails will be sent to user email addresses
- Check your email provider's logs for delivery status
- Failed sends are logged but don't break the application

## Email Templates

The system includes three email templates:

1. **Status Change**: Notifies users when their issue/suggestion status changes
2. **Admin Response**: Notifies users when an admin responds
3. **Weekly Summary**: Weekly digest of user's submissions

All templates include:
- HTML version (styled)
- Plain text version (fallback)
- Case ID and title
- Links to view details (when frontend is ready)

## Notes

- Email failures are logged but don't break the application
- Users receive emails at the address they registered with
- Admin notes and responses are included in notifications
- Weekly summaries only include submissions from the past 7 days
- The scheduler automatically reschedules after each run
