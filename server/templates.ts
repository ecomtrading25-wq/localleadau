/**
 * Template variable replacement system for campaigns
 * Supports variables like {{firstName}}, {{businessName}}, {{city}}, etc.
 */

export interface TemplateVariables {
  // Lead/Prospect info
  firstName?: string;
  lastName?: string;
  fullName?: string;
  businessName?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  
  // Organisation info
  senderName?: string;
  senderCompany?: string;
  senderEmail?: string;
  senderPhone?: string;
  senderWebsite?: string;
  
  // Custom fields
  [key: string]: string | undefined;
}

/**
 * Replace template variables in content
 * @param content - Template content with {{variable}} placeholders
 * @param variables - Object with variable values
 * @returns Content with variables replaced
 */
export function replaceTemplateVariables(
  content: string,
  variables: TemplateVariables
): string {
  let result = content;
  
  // Replace each variable
  for (const [key, value] of Object.entries(variables)) {
    if (value !== undefined) {
      // Match {{key}} or {{ key }} (with optional spaces)
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
      result = result.replace(regex, value);
    }
  }
  
  // Remove any remaining unreplaced variables (show as empty)
  result = result.replace(/{{[^}]+}}/g, '');
  
  return result;
}

/**
 * Extract variables from template content
 * @param content - Template content
 * @returns Array of variable names found in template
 */
export function extractTemplateVariables(content: string): string[] {
  const matches = content.match(/{{[^}]+}}/g) || [];
  return matches.map(match => 
    match.replace(/{{|}}/g, '').trim()
  ).filter((v, i, arr) => arr.indexOf(v) === i); // unique
}

/**
 * Validate that all required variables are provided
 * @param content - Template content
 * @param variables - Provided variables
 * @returns Array of missing variable names
 */
export function validateTemplateVariables(
  content: string,
  variables: TemplateVariables
): string[] {
  const required = extractTemplateVariables(content);
  return required.filter(varName => !variables[varName]);
}

/**
 * Build variables object from lead/prospect and organisation data
 */
export function buildTemplateVariables(data: {
  lead?: {
    businessName: string;
    contactName?: string | null;
    email?: string | null;
    phone?: string | null;
    website?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
  };
  prospect?: {
    businessName: string;
    contactName?: string | null;
    email?: string | null;
    phone?: string | null;
    website?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
  };
  organisation: {
    name: string;
    website?: string | null;
    city: string;
    state: string;
    leadHandlingEmail?: string | null;
    leadHandlingSms?: string | null;
  };
  user?: {
    name?: string | null;
    email?: string | null;
  };
}): TemplateVariables {
  const recipient = data.lead || data.prospect;
  
  if (!recipient) {
    throw new Error("Either lead or prospect data is required");
  }
  
  // Parse contact name into first/last
  const contactName = recipient.contactName || '';
  const nameParts = contactName.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  
  return {
    // Recipient info
    firstName,
    lastName,
    fullName: contactName,
    businessName: recipient.businessName,
    email: recipient.email || undefined,
    phone: recipient.phone || undefined,
    website: recipient.website || undefined,
    address: recipient.address || undefined,
    city: recipient.city || undefined,
    state: recipient.state || undefined,
    
    // Sender info
    senderName: data.user?.name || data.organisation.name,
    senderCompany: data.organisation.name,
    senderEmail: data.user?.email || data.organisation.leadHandlingEmail || undefined,
    senderPhone: data.organisation.leadHandlingSms || undefined,
    senderWebsite: data.organisation.website || undefined,
  };
}

/**
 * Preview template with sample data
 */
export function previewTemplate(content: string): string {
  const sampleVariables: TemplateVariables = {
    firstName: 'John',
    lastName: 'Smith',
    fullName: 'John Smith',
    businessName: 'Sydney Plumbing Services',
    email: 'john@sydneyplumbing.com.au',
    phone: '+61 2 1234 5678',
    website: 'https://sydneyplumbing.com.au',
    address: '123 Main St, Sydney NSW 2000',
    city: 'Sydney',
    state: 'NSW',
    senderName: 'Sarah Johnson',
    senderCompany: 'Local Lead AU',
    senderEmail: 'sarah@localleadau.com',
    senderPhone: '+61 2 9876 5432',
    senderWebsite: 'https://localleadau.com',
  };
  
  return replaceTemplateVariables(content, sampleVariables);
}
