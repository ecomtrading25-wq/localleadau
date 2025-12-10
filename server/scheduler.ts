import cron from 'node-cron';
import { getDb } from './db';
import { campaigns, campaignSteps, campaignRecipients, leads, organisations } from '../drizzle/schema';
import { eq, and, lte, isNull, or } from 'drizzle-orm';
import { sendEmail, buildEmailHtml } from './email';
import { replaceTemplateVariables, buildTemplateVariables } from './templates';

/**
 * Campaign automation scheduler
 * Runs every minute to check for campaigns that need to be executed
 */
export function startCampaignScheduler() {
  console.log('[Scheduler] Starting campaign automation scheduler...');
  
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      await processPendingCampaigns();
    } catch (error) {
      console.error('[Scheduler] Error processing campaigns:', error);
    }
  });
  
  console.log('[Scheduler] Campaign scheduler started');
}

/**
 * Process all pending campaign sends
 */
async function processPendingCampaigns() {
  const db = await getDb();
  if (!db) return;
  
  const now = new Date();
  
  // Find all active campaigns
  const activeCampaigns = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.status, 'active'));
  
  for (const campaign of activeCampaigns) {
    try {
      await processCampaign(campaign.id);
    } catch (error) {
      console.error(`[Scheduler] Error processing campaign ${campaign.id}:`, error);
    }
  }
}

/**
 * Process a single campaign
 */
async function processCampaign(campaignId: number) {
  const db = await getDb();
  if (!db) return;
  
  // Get campaign steps
  const steps = await db
    .select()
    .from(campaignSteps)
    .where(eq(campaignSteps.campaignId, campaignId))
    .orderBy(campaignSteps.stepNumber);
  
  if (steps.length === 0) return;
  
  // Get campaign recipients
  const recipients = await db
    .select()
    .from(campaignRecipients)
    .where(eq(campaignRecipients.campaignId, campaignId));
  
  for (const recipient of recipients) {
    try {
      await processRecipient(campaignId, recipient, steps);
    } catch (error) {
      console.error(`[Scheduler] Error processing recipient ${recipient.id}:`, error);
    }
  }
}

/**
 * Process a single recipient
 */
async function processRecipient(
  campaignId: number,
  recipient: any,
  steps: any[]
) {
  const db = await getDb();
  if (!db) return;
  
  const now = new Date();
  
  // Find the next step to send
  const currentStepIndex = recipient.currentStep || 0;
  
  if (currentStepIndex >= steps.length) {
    // Campaign complete for this recipient
    if (recipient.status !== 'completed') {
      await db
        .update(campaignRecipients)
        .set({
          status: 'completed',
          completedAt: now,
        })
        .where(eq(campaignRecipients.id, recipient.id));
    }
    return;
  }
  
  const nextStep = steps[currentStepIndex];
  
  // Check if it's time to send this step
  const shouldSend = shouldSendStep(recipient, nextStep, now);
  
  if (!shouldSend) return;
  
  // Send the step
  await sendCampaignStep(campaignId, recipient, nextStep);
}

/**
 * Determine if a step should be sent now
 */
function shouldSendStep(recipient: any, step: any, now: Date): boolean {
  // If this is the first step and recipient just added
  if (recipient.currentStep === 0 && !recipient.lastSentAt) {
    return true;
  }
  
  // If no last sent time, don't send
  if (!recipient.lastSentAt) {
    return false;
  }
  
  // Calculate when the next step should be sent
  const lastSent = new Date(recipient.lastSentAt);
  const delayDays = step.delayDays || 0;
  const nextSendTime = new Date(lastSent.getTime() + delayDays * 24 * 60 * 60 * 1000);
  
  return now >= nextSendTime;
}

/**
 * Send a campaign step to a recipient
 */
async function sendCampaignStep(
  campaignId: number,
  recipient: any,
  step: any
) {
  const db = await getDb();
  if (!db) return;
  
  try {
    // Get lead and organisation data
    const [lead] = await db
      .select()
      .from(leads)
      .where(eq(leads.id, recipient.leadId))
      .limit(1);
    
    if (!lead) {
      console.error(`[Scheduler] Lead ${recipient.leadId} not found`);
      return;
    }
    
    const [organisation] = await db
      .select()
      .from(organisations)
      .where(eq(organisations.id, lead.organisationId))
      .limit(1);
    
    if (!organisation) {
      console.error(`[Scheduler] Organisation ${lead.organisationId} not found`);
      return;
    }
    
    // Build template variables
    const variables = buildTemplateVariables({
      lead,
      organisation: {
        name: organisation.name,
        website: organisation.website,
        city: organisation.city || '',
        state: organisation.state || '',
        leadHandlingEmail: organisation.leadHandlingEmail,
        leadHandlingSms: organisation.leadHandlingSms,
      },
    });
    
    // Replace variables in subject and body
    const subject = replaceTemplateVariables(step.subject || '', variables);
    const body = replaceTemplateVariables(step.body || '', variables);
    
    // Send based on channel
    if (step.channel === 'email') {
      await sendCampaignEmail(lead, organisation, subject, body, recipient.id);
    } else if (step.channel === 'sms') {
      // SMS not yet implemented
      console.warn('[Scheduler] SMS sending not yet implemented');
    }
    
    // Update recipient status
    await db
      .update(campaignRecipients)
      .set({
        currentStep: (recipient.currentStep || 0) + 1,
        lastSentAt: new Date(),
        status: 'active',
      })
      .where(eq(campaignRecipients.id, recipient.id));
    
    console.log(`[Scheduler] Sent step ${step.stepNumber} to recipient ${recipient.id}`);
  } catch (error) {
    console.error(`[Scheduler] Error sending campaign step:`, error);
    
    // Mark as failed
    await db
      .update(campaignRecipients)
      .set({
        status: 'failed',
      })
      .where(eq(campaignRecipients.id, recipient.id));
  }
}

/**
 * Send campaign email
 */
async function sendCampaignEmail(
  lead: any,
  organisation: any,
  subject: string,
  body: string,
  recipientId: number
) {
  if (!lead.email) {
    throw new Error('Lead has no email address');
  }
  
  // Build HTML email
  const html = buildEmailHtml({
    content: body,
    footerText: `Sent by ${organisation.name}`,
    unsubscribeUrl: `https://localleadau.com/unsubscribe?recipient=${recipientId}`,
  });
  
  // Send via SendGrid
  const result = await sendEmail({
    to: lead.email,
    from: organisation.leadHandlingEmail || 'noreply@localleadau.com',
    subject,
    html,
    trackOpens: true,
    trackClicks: true,
  });
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to send email');
  }
}

/**
 * Stop the scheduler (for testing)
 */
export function stopCampaignScheduler() {
  cron.getTasks().forEach(task => task.stop());
  console.log('[Scheduler] Campaign scheduler stopped');
}
