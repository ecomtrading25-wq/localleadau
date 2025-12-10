import sgMail from '@sendgrid/mail';
import { ENV } from './_core/env';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export interface SendEmailParams {
  to: string;
  from: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  trackOpens?: boolean;
  trackClicks?: boolean;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send email via SendGrid
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('[Email] SendGrid API key not configured, skipping email send');
    return {
      success: false,
      error: 'SendGrid API key not configured',
    };
  }
  
  try {
    const msg = {
      to: params.to,
      from: params.from,
      subject: params.subject,
      html: params.html,
      text: params.text || stripHtml(params.html),
      replyTo: params.replyTo,
      trackingSettings: {
        clickTracking: {
          enable: params.trackClicks ?? true,
        },
        openTracking: {
          enable: params.trackOpens ?? true,
        },
      },
    };
    
    const [response] = await sgMail.send(msg);
    
    return {
      success: true,
      messageId: (response as any).headers?.['x-message-id'] || 'unknown',
    };
  } catch (error: any) {
    console.error('[Email] Failed to send email:', error);
    
    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
}

/**
 * Send bulk emails via SendGrid
 */
export async function sendBulkEmails(
  emails: SendEmailParams[]
): Promise<SendEmailResult[]> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('[Email] SendGrid API key not configured, skipping bulk email send');
    return emails.map(() => ({
      success: false,
      error: 'SendGrid API key not configured',
    }));
  }
  
  try {
    const messages = emails.map(params => ({
      to: params.to,
      from: params.from,
      subject: params.subject,
      html: params.html,
      text: params.text || stripHtml(params.html),
      replyTo: params.replyTo,
      trackingSettings: {
        clickTracking: {
          enable: params.trackClicks ?? true,
        },
        openTracking: {
          enable: params.trackOpens ?? true,
        },
      },
    }));
    
    const responses = await sgMail.send(messages);
    
    return responses.map(response => ({
      success: true,
      messageId: (response as any).headers?.['x-message-id'] || 'unknown',
    }));
  } catch (error: any) {
    console.error('[Email] Failed to send bulk emails:', error);
    
    // Return individual errors
    return emails.map(() => ({
      success: false,
      error: error.message || 'Failed to send email',
    }));
  }
}

/**
 * Verify email sender domain
 */
export async function verifySenderDomain(domain: string): Promise<boolean> {
  // This would typically involve DNS verification
  // For now, just check if it's a valid domain format
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
  return domainRegex.test(domain);
}

/**
 * Strip HTML tags for plain text version
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

/**
 * Build HTML email template
 */
export function buildEmailHtml(params: {
  content: string;
  preheader?: string;
  footerText?: string;
  unsubscribeUrl?: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      padding: 20px;
      text-align: center;
      background-color: #2563eb;
      color: #ffffff;
    }
    .content {
      padding: 30px 20px;
    }
    .footer {
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #666;
      background-color: #f9f9f9;
      border-top: 1px solid #e0e0e0;
    }
    .footer a {
      color: #2563eb;
      text-decoration: none;
    }
    .preheader {
      display: none;
      max-height: 0;
      overflow: hidden;
    }
    a {
      color: #2563eb;
    }
    p {
      margin: 0 0 15px 0;
    }
  </style>
</head>
<body>
  ${params.preheader ? `<div class="preheader">${params.preheader}</div>` : ''}
  <div class="container">
    <div class="content">
      ${params.content}
    </div>
    <div class="footer">
      ${params.footerText || ''}
      ${params.unsubscribeUrl ? `<br><a href="${params.unsubscribeUrl}">Unsubscribe</a>` : ''}
    </div>
  </div>
</body>
</html>
  `.trim();
}
