import nodemailer from 'nodemailer';
import pool from '../config/database';

// Email configuration
const isEmailConfigured = (): boolean => {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.EMAIL_FROM
  );
};

// Create transporter (only if email is configured)
const getTransporter = () => {
  if (!isEmailConfigured()) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Email templates
const emailTemplates = {
  statusChange: (data: {
    userName: string;
    caseId: string;
    title: string;
    oldStatus: string;
    newStatus: string;
    type: 'issue' | 'suggestion';
    adminNote?: string;
  }) => {
    const statusLabels: Record<string, string> = {
      'under_review': 'Under Review',
      'in_progress': 'In Progress',
      'resolved': 'Resolved',
      'closed': 'Closed',
      'submitted': 'Submitted',
      'approved': 'Approved',
      'implemented': 'Implemented',
      'rejected': 'Rejected',
    };

    const typeLabel = data.type === 'issue' ? 'Issue' : 'Suggestion';
    const oldStatusLabel = statusLabels[data.oldStatus] || data.oldStatus;
    const newStatusLabel = statusLabels[data.newStatus] || data.newStatus;

    return {
      subject: `CivicFix: ${typeLabel} ${data.caseId} Status Updated`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .info-box { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4F46E5; border-radius: 4px; }
            .status-change { display: flex; align-items: center; gap: 10px; margin: 15px 0; }
            .status-badge { padding: 5px 15px; border-radius: 20px; font-weight: bold; }
            .old-status { background-color: #e5e7eb; color: #6b7280; }
            .new-status { background-color: #4F46E5; color: white; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
            .arrow { font-size: 20px; color: #4F46E5; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>CivicFix</h1>
            </div>
            <div class="content">
              <p>Hello ${data.userName},</p>
              <p>Your ${typeLabel.toLowerCase()} has been updated.</p>
              
              <div class="info-box">
                <strong>Case ID:</strong> ${data.caseId}<br>
                <strong>Title:</strong> ${data.title}
              </div>

              <div class="status-change">
                <span class="status-badge old-status">${oldStatusLabel}</span>
                <span class="arrow">→</span>
                <span class="status-badge new-status">${newStatusLabel}</span>
              </div>

              ${data.adminNote ? `
                <div class="info-box">
                  <strong>Admin Note:</strong><br>
                  ${data.adminNote}
                </div>
              ` : ''}

              <p>You can view the full details of your ${typeLabel.toLowerCase()} by logging into your CivicFix account.</p>
            </div>
            <div class="footer">
              <p>This is an automated notification from CivicFix.</p>
              <p>Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        CivicFix: ${typeLabel} ${data.caseId} Status Updated

        Hello ${data.userName},

        Your ${typeLabel.toLowerCase()} has been updated.

        Case ID: ${data.caseId}
        Title: ${data.title}
        Status: ${oldStatusLabel} → ${newStatusLabel}

        ${data.adminNote ? `Admin Note: ${data.adminNote}\n` : ''}

        You can view the full details by logging into your CivicFix account.

        This is an automated notification from CivicFix.
      `,
    };
  },

  adminResponse: (data: {
    userName: string;
    caseId: string;
    title: string;
    type: 'issue' | 'suggestion';
    adminMessage: string;
    adminName?: string;
  }) => {
    const typeLabel = data.type === 'issue' ? 'Issue' : 'Suggestion';

    return {
      subject: `CivicFix: Admin Response to Your ${typeLabel} ${data.caseId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .info-box { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4F46E5; border-radius: 4px; }
            .message-box { background-color: #fef3c7; padding: 15px; margin: 15px 0; border-left: 4px solid #f59e0b; border-radius: 4px; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>CivicFix</h1>
            </div>
            <div class="content">
              <p>Hello ${data.userName},</p>
              <p>An administrator has responded to your ${typeLabel.toLowerCase()}.</p>
              
              <div class="info-box">
                <strong>Case ID:</strong> ${data.caseId}<br>
                <strong>Title:</strong> ${data.title}
              </div>

              <div class="message-box">
                <strong>${data.adminName || 'Administrator'} Response:</strong><br>
                ${data.adminMessage}
              </div>

              <p>You can view the full details and respond by logging into your CivicFix account.</p>
            </div>
            <div class="footer">
              <p>This is an automated notification from CivicFix.</p>
              <p>Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        CivicFix: Admin Response to Your ${typeLabel} ${data.caseId}

        Hello ${data.userName},

        An administrator has responded to your ${typeLabel.toLowerCase()}.

        Case ID: ${data.caseId}
        Title: ${data.title}

        ${data.adminName || 'Administrator'} Response:
        ${data.adminMessage}

        You can view the full details by logging into your CivicFix account.

        This is an automated notification from CivicFix.
      `,
    };
  },

  weeklySummary: (data: {
    userName: string;
    email: string;
    issuesCount: number;
    suggestionsCount: number;
    issues: Array<{ caseId: string; title: string; status: string }>;
    suggestions: Array<{ caseId: string; title: string; status: string }>;
  }) => {
    const totalSubmissions = data.issuesCount + data.suggestionsCount;

    return {
      subject: `CivicFix: Your Weekly Summary`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .stats-box { background-color: white; padding: 20px; margin: 15px 0; border-radius: 4px; text-align: center; }
            .stat-number { font-size: 36px; font-weight: bold; color: #4F46E5; }
            .stat-label { color: #6b7280; margin-top: 5px; }
            .submission-item { background-color: white; padding: 10px; margin: 8px 0; border-left: 4px solid #4F46E5; border-radius: 4px; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>CivicFix Weekly Summary</h1>
            </div>
            <div class="content">
              <p>Hello ${data.userName},</p>
              <p>Here's a summary of your submissions this week:</p>
              
              <div class="stats-box">
                <div class="stat-number">${totalSubmissions}</div>
                <div class="stat-label">Total Submissions</div>
              </div>

              ${data.issuesCount > 0 ? `
                <h3>Your Issues (${data.issuesCount})</h3>
                ${data.issues.map(issue => `
                  <div class="submission-item">
                    <strong>${issue.caseId}</strong> - ${issue.title}<br>
                    <small>Status: ${issue.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</small>
                  </div>
                `).join('')}
              ` : ''}

              ${data.suggestionsCount > 0 ? `
                <h3>Your Suggestions (${data.suggestionsCount})</h3>
                ${data.suggestions.map(suggestion => `
                  <div class="submission-item">
                    <strong>${suggestion.caseId}</strong> - ${suggestion.title}<br>
                    <small>Status: ${suggestion.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</small>
                  </div>
                `).join('')}
              ` : ''}

              ${totalSubmissions === 0 ? `
                <p>You haven't submitted any issues or suggestions this week.</p>
                <p>Visit CivicFix to report an issue or submit a suggestion for your community!</p>
              ` : ''}

              <p style="margin-top: 20px;">Thank you for using CivicFix to improve your community!</p>
            </div>
            <div class="footer">
              <p>This is an automated weekly summary from CivicFix.</p>
              <p>Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        CivicFix Weekly Summary

        Hello ${data.userName},

        Here's a summary of your submissions this week:

        Total Submissions: ${totalSubmissions}

        ${data.issuesCount > 0 ? `Your Issues (${data.issuesCount}):\n${data.issues.map(i => `- ${i.caseId}: ${i.title} (${i.status})`).join('\n')}\n` : ''}
        ${data.suggestionsCount > 0 ? `Your Suggestions (${data.suggestionsCount}):\n${data.suggestions.map(s => `- ${s.caseId}: ${s.title} (${s.status})`).join('\n')}\n` : ''}

        ${totalSubmissions === 0 ? 'You haven\'t submitted any issues or suggestions this week.\n' : ''}

        Thank you for using CivicFix to improve your community!

        This is an automated weekly summary from CivicFix.
      `,
    };
  },
};

// Send email function
export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<boolean> => {
  if (!isEmailConfigured()) {
    console.log('📧 Email not configured - skipping email send');
    console.log('   To:', to);
    console.log('   Subject:', subject);
    return false;
  }

  const transporter = getTransporter();
  if (!transporter) {
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      text,
    });

    console.log('✅ Email sent successfully:', info.messageId);
    return true;
  } catch (error: any) {
    console.error('❌ Error sending email:', error.message);
    // Don't throw - email failures shouldn't break the app
    return false;
  }
};

// Send status change notification
export const sendStatusChangeNotification = async (
  userId: string,
  caseId: string,
  title: string,
  oldStatus: string,
  newStatus: string,
  type: 'issue' | 'suggestion',
  adminNote?: string
): Promise<void> => {
  try {
    // Get user email and name
    const userResult = await pool.query(
      'SELECT email FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      console.warn('User not found for email notification:', userId);
      return;
    }

    const userEmail = userResult.rows[0].email;
    const userName = userResult.rows[0].email.split('@')[0]; // Use email prefix as name fallback

    // Get user profile if available
    const profileResult = await pool.query(
      'SELECT first_name, surname FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    const displayName = profileResult.rows.length > 0 && profileResult.rows[0].first_name
      ? `${profileResult.rows[0].first_name} ${profileResult.rows[0].surname || ''}`.trim()
      : userName;

    const emailData = emailTemplates.statusChange({
      userName: displayName,
      caseId,
      title,
      oldStatus,
      newStatus,
      type,
      adminNote,
    });

    await sendEmail(userEmail, emailData.subject, emailData.html, emailData.text);
  } catch (error: any) {
    console.error('Error sending status change notification:', error.message);
    // Don't throw - email failures shouldn't break the app
  }
};

// Send admin response notification
export const sendAdminResponseNotification = async (
  userId: string,
  caseId: string,
  title: string,
  type: 'issue' | 'suggestion',
  adminMessage: string,
  adminName?: string
): Promise<void> => {
  try {
    // Get user email and name
    const userResult = await pool.query(
      'SELECT email FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      console.warn('User not found for email notification:', userId);
      return;
    }

    const userEmail = userResult.rows[0].email;
    const userName = userResult.rows[0].email.split('@')[0];

    // Get user profile if available
    const profileResult = await pool.query(
      'SELECT first_name, surname FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    const displayName = profileResult.rows.length > 0 && profileResult.rows[0].first_name
      ? `${profileResult.rows[0].first_name} ${profileResult.rows[0].surname || ''}`.trim()
      : userName;

    const emailData = emailTemplates.adminResponse({
      userName: displayName,
      caseId,
      title,
      type,
      adminMessage,
      adminName,
    });

    await sendEmail(userEmail, emailData.subject, emailData.html, emailData.text);
  } catch (error: any) {
    console.error('Error sending admin response notification:', error.message);
    // Don't throw - email failures shouldn't break the app
  }
};

// Send weekly summary to a user
export const sendWeeklySummary = async (userId: string): Promise<void> => {
  try {
    // Get user email and name
    const userResult = await pool.query(
      'SELECT email FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return;
    }

    const userEmail = userResult.rows[0].email;
    const userName = userResult.rows[0].email.split('@')[0];

    // Get user profile if available
    const profileResult = await pool.query(
      'SELECT first_name, surname FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    const displayName = profileResult.rows.length > 0 && profileResult.rows[0].first_name
      ? `${profileResult.rows[0].first_name} ${profileResult.rows[0].surname || ''}`.trim()
      : userName;

    // Get issues from the past week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const issuesResult = await pool.query(
      `SELECT case_id, title, status 
       FROM issues 
       WHERE user_id = $1 
       AND created_at >= $2
       AND title IS NOT NULL 
       AND title != ''
       ORDER BY created_at DESC`,
      [userId, oneWeekAgo]
    );

    const suggestionsResult = await pool.query(
      `SELECT case_id, title, status 
       FROM suggestions 
       WHERE user_id = $1 
       AND created_at >= $2
       AND title IS NOT NULL 
       AND title != ''
       ORDER BY created_at DESC`,
      [userId, oneWeekAgo]
    );

    const emailData = emailTemplates.weeklySummary({
      userName: displayName,
      email: userEmail,
      issuesCount: issuesResult.rows.length,
      suggestionsCount: suggestionsResult.rows.length,
      issues: issuesResult.rows,
      suggestions: suggestionsResult.rows,
    });

    await sendEmail(userEmail, emailData.subject, emailData.html, emailData.text);
  } catch (error: any) {
    console.error('Error sending weekly summary:', error.message);
    // Don't throw - email failures shouldn't break the app
  }
};

// Send weekly summaries to all users
export const sendWeeklySummariesToAllUsers = async (): Promise<void> => {
  try {
    console.log('📧 Starting weekly summary email job...');

    const usersResult = await pool.query('SELECT id FROM users WHERE role = $1', ['user']);

    console.log(`📧 Found ${usersResult.rows.length} users to send summaries to`);

    for (const user of usersResult.rows) {
      await sendWeeklySummary(user.id);
      // Small delay to avoid overwhelming the email server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('✅ Weekly summary emails sent successfully');
  } catch (error: any) {
    console.error('❌ Error sending weekly summaries:', error.message);
  }
};
