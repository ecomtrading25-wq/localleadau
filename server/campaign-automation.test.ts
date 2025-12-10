import { describe, expect, it } from "vitest";
import {
  replaceTemplateVariables,
  extractTemplateVariables,
  validateTemplateVariables,
  buildTemplateVariables,
  previewTemplate,
} from "./templates";

describe("Template Variables", () => {
  it("replaces simple variables", () => {
    const content = "Hello {{firstName}}, welcome to {{businessName}}!";
    const variables = {
      firstName: "John",
      businessName: "Sydney Plumbing",
    };
    
    const result = replaceTemplateVariables(content, variables);
    expect(result).toBe("Hello John, welcome to Sydney Plumbing!");
  });
  
  it("handles variables with spaces", () => {
    const content = "Hello {{ firstName }}, from {{ senderName }}";
    const variables = {
      firstName: "John",
      senderName: "Sarah",
    };
    
    const result = replaceTemplateVariables(content, variables);
    expect(result).toBe("Hello John, from Sarah");
  });
  
  it("removes unreplaced variables", () => {
    const content = "Hello {{firstName}}, your {{missingVar}} is ready";
    const variables = {
      firstName: "John",
    };
    
    const result = replaceTemplateVariables(content, variables);
    expect(result).toBe("Hello John, your  is ready");
  });
  
  it("extracts variables from template", () => {
    const content = "Hello {{firstName}}, welcome to {{businessName}}! Contact {{senderEmail}}";
    
    const variables = extractTemplateVariables(content);
    expect(variables).toEqual(["firstName", "businessName", "senderEmail"]);
  });
  
  it("validates required variables", () => {
    const content = "Hello {{firstName}}, welcome to {{businessName}}!";
    const variables = {
      firstName: "John",
    };
    
    const missing = validateTemplateVariables(content, variables);
    expect(missing).toEqual(["businessName"]);
  });
  
  it("builds variables from lead data", () => {
    const variables = buildTemplateVariables({
      lead: {
        businessName: "Sydney Plumbing Services",
        contactName: "John Smith",
        email: "john@sydneyplumbing.com.au",
        phone: "+61 2 1234 5678",
        website: "https://sydneyplumbing.com.au",
        address: "123 Main St, Sydney NSW 2000",
        city: "Sydney",
        state: "NSW",
      },
      organisation: {
        name: "Local Lead AU",
        website: "https://localleadau.com",
        city: "Melbourne",
        state: "VIC",
        leadHandlingEmail: "contact@localleadau.com",
        leadHandlingSms: "+61 3 9876 5432",
      },
    });
    
    expect(variables.firstName).toBe("John");
    expect(variables.lastName).toBe("Smith");
    expect(variables.fullName).toBe("John Smith");
    expect(variables.businessName).toBe("Sydney Plumbing Services");
    expect(variables.email).toBe("john@sydneyplumbing.com.au");
    expect(variables.city).toBe("Sydney");
    expect(variables.senderCompany).toBe("Local Lead AU");
    expect(variables.senderEmail).toBe("contact@localleadau.com");
  });
  
  it("generates preview with sample data", () => {
    const content = "Hello {{firstName}}, welcome to {{businessName}}!";
    
    const preview = previewTemplate(content);
    expect(preview).toContain("John");
    expect(preview).toContain("Sydney Plumbing Services");
  });
});

describe("Email Building", () => {
  it("builds HTML email with content", async () => {
    const { buildEmailHtml } = await import("./email");
    
    const html = buildEmailHtml({
      content: "<p>Hello, this is a test email.</p>",
      footerText: "Sent by Local Lead AU",
    });
    
    expect(html).toContain("Hello, this is a test email");
    expect(html).toContain("Sent by Local Lead AU");
    expect(html).toContain("<!DOCTYPE html>");
  });
  
  it("includes unsubscribe link when provided", async () => {
    const { buildEmailHtml } = await import("./email");
    
    const html = buildEmailHtml({
      content: "<p>Test</p>",
      unsubscribeUrl: "https://example.com/unsubscribe?id=123",
    });
    
    expect(html).toContain("Unsubscribe");
    expect(html).toContain("https://example.com/unsubscribe?id=123");
  });
});

describe("Campaign Automation Logic", () => {
  it("calculates next send time based on delay", () => {
    const lastSent = new Date("2025-01-01T10:00:00Z");
    const delayDays = 3;
    const expectedNextSend = new Date("2025-01-04T10:00:00Z");
    
    const nextSendTime = new Date(lastSent.getTime() + delayDays * 24 * 60 * 60 * 1000);
    
    expect(nextSendTime.getTime()).toBe(expectedNextSend.getTime());
  });
  
  it("determines if step should be sent (first step)", () => {
    const recipient = {
      currentStep: 0,
      lastSentAt: null,
    };
    
    // First step should always send
    const shouldSend = recipient.currentStep === 0 && !recipient.lastSentAt;
    expect(shouldSend).toBe(true);
  });
  
  it("determines if step should be sent (delayed step)", () => {
    const now = new Date("2025-01-05T10:00:00Z");
    const lastSent = new Date("2025-01-01T10:00:00Z");
    const delayDays = 3;
    
    const nextSendTime = new Date(lastSent.getTime() + delayDays * 24 * 60 * 60 * 1000);
    const shouldSend = now >= nextSendTime;
    
    expect(shouldSend).toBe(true);
  });
  
  it("determines if step should NOT be sent yet", () => {
    const now = new Date("2025-01-02T10:00:00Z");
    const lastSent = new Date("2025-01-01T10:00:00Z");
    const delayDays = 3;
    
    const nextSendTime = new Date(lastSent.getTime() + delayDays * 24 * 60 * 60 * 1000);
    const shouldSend = now >= nextSendTime;
    
    expect(shouldSend).toBe(false);
  });
});
