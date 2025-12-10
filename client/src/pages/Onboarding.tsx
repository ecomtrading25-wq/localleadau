import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const AUSTRALIAN_STATES = [
  { value: "NSW", label: "New South Wales" },
  { value: "VIC", label: "Victoria" },
  { value: "QLD", label: "Queensland" },
  { value: "WA", label: "Western Australia" },
  { value: "SA", label: "South Australia" },
  { value: "TAS", label: "Tasmania" },
  { value: "ACT", label: "Australian Capital Territory" },
  { value: "NT", label: "Northern Territory" },
];

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1
    businessName: "",
    industry: "",
    website: "",
    abn: "",
    // Step 2
    city: "",
    state: "",
    radius: 25,
    suburbs: "",
    // Step 3
    averageJobValue: "",
    closeRate: "",
    // Step 4
    leadHandlingEmail: "",
    leadHandlingSms: "",
  });

  const completeMutation = trpc.onboarding.complete.useMutation({
    onSuccess: () => {
      toast.success("Welcome to Local Lead AU!");
      setLocation("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to complete onboarding");
    },
  });

  const handleNext = () => {
    // Validation for each step
    if (step === 1) {
      if (!formData.businessName.trim()) {
        toast.error("Please enter your business name");
        return;
      }
    } else if (step === 2) {
      if (!formData.city.trim() || !formData.state) {
        toast.error("Please enter your city and state");
        return;
      }
    } else if (step === 3) {
      if (!formData.averageJobValue || !formData.closeRate) {
        toast.error("Please enter your average job value and close rate");
        return;
      }
    }

    if (step < 5) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!formData.leadHandlingEmail && !formData.leadHandlingSms) {
      toast.error("Please provide at least one contact method for leads");
      return;
    }

    const suburbsArray = formData.suburbs
      ? formData.suburbs.split(",").map(s => s.trim()).filter(s => s)
      : [];

    completeMutation.mutate({
      businessName: formData.businessName,
      industry: formData.industry || undefined,
      website: formData.website || "",
      abn: formData.abn || undefined,
      city: formData.city,
      state: formData.state,
      radius: formData.radius,
      suburbs: suburbsArray.length > 0 ? suburbsArray : undefined,
      averageJobValue: parseFloat(formData.averageJobValue),
      closeRate: parseFloat(formData.closeRate),
      leadHandlingEmail: formData.leadHandlingEmail || "",
      leadHandlingSms: formData.leadHandlingSms || undefined,
    });
  };

  const updateField = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const progress = (step / 5) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to Local Lead AU</CardTitle>
          <CardDescription>
            Let's set up your account - Step {step} of 5
          </CardDescription>
          <Progress value={progress} className="mt-4" />
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">About Your Business</h3>
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => updateField("businessName", e.target.value)}
                  placeholder="e.g., Sydney Plumbing Services"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={formData.industry}
                  onChange={(e) => updateField("industry", e.target.value)}
                  placeholder="e.g., Plumbing, Electrical, Landscaping"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => updateField("website", e.target.value)}
                  placeholder="https://yourwebsite.com.au"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="abn">ABN (Australian Business Number)</Label>
                <Input
                  id="abn"
                  value={formData.abn}
                  onChange={(e) => updateField("abn", e.target.value)}
                  placeholder="12 345 678 901"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Service Areas</h3>
              <p className="text-sm text-muted-foreground">
                Tell us where you operate so we can find the right leads for you.
              </p>
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="e.g., Sydney, Melbourne, Brisbane"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <select
                  id="state"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={formData.state}
                  onChange={(e) => updateField("state", e.target.value)}
                >
                  <option value="">Select a state</option>
                  {AUSTRALIAN_STATES.map(state => (
                    <option key={state.value} value={state.value}>
                      {state.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="radius">Service Radius (km) *</Label>
                <Input
                  id="radius"
                  type="number"
                  value={formData.radius}
                  onChange={(e) => updateField("radius", parseInt(e.target.value) || 0)}
                  min="1"
                  max="500"
                />
                <p className="text-xs text-muted-foreground">
                  How far from {formData.city || "your city"} do you travel?
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="suburbs">Specific Suburbs (optional)</Label>
                <Input
                  id="suburbs"
                  value={formData.suburbs}
                  onChange={(e) => updateField("suburbs", e.target.value)}
                  placeholder="Parramatta, Chatswood, Bondi (comma-separated)"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Job Types & Value</h3>
              <p className="text-sm text-muted-foreground">
                This helps us calculate your ROI and prioritize the best leads.
              </p>
              <div className="space-y-2">
                <Label htmlFor="averageJobValue">Average Job Value ($) *</Label>
                <Input
                  id="averageJobValue"
                  type="number"
                  value={formData.averageJobValue}
                  onChange={(e) => updateField("averageJobValue", e.target.value)}
                  placeholder="e.g., 500"
                  min="0"
                  step="50"
                />
                <p className="text-xs text-muted-foreground">
                  What's the typical value of a job you complete?
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="closeRate">Close Rate (%) *</Label>
                <Input
                  id="closeRate"
                  type="number"
                  value={formData.closeRate}
                  onChange={(e) => updateField("closeRate", e.target.value)}
                  placeholder="e.g., 30"
                  min="0"
                  max="100"
                  step="5"
                />
                <p className="text-xs text-muted-foreground">
                  What percentage of leads do you typically convert to jobs?
                </p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Lead Handling Preferences</h3>
              <p className="text-sm text-muted-foreground">
                How should we notify you when new leads come in?
              </p>
              <div className="space-y-2">
                <Label htmlFor="leadHandlingEmail">Email Address</Label>
                <Input
                  id="leadHandlingEmail"
                  type="email"
                  value={formData.leadHandlingEmail}
                  onChange={(e) => updateField("leadHandlingEmail", e.target.value)}
                  placeholder="leads@yourbusiness.com.au"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leadHandlingSms">Mobile Number (SMS)</Label>
                <Input
                  id="leadHandlingSms"
                  type="tel"
                  value={formData.leadHandlingSms}
                  onChange={(e) => updateField("leadHandlingSms", e.target.value)}
                  placeholder="0412 345 678"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Provide at least one contact method. You can update these later.
              </p>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Review & Confirm</h3>
              <p className="text-sm text-muted-foreground">
                Please review your information before completing setup.
              </p>
              <div className="bg-muted p-4 rounded-lg space-y-3 text-sm">
                <div>
                  <strong>Business:</strong> {formData.businessName}
                  {formData.industry && ` (${formData.industry})`}
                </div>
                <div>
                  <strong>Service Area:</strong> {formData.city}, {formData.state} ({formData.radius}km radius)
                </div>
                <div>
                  <strong>Average Job Value:</strong> ${formData.averageJobValue}
                </div>
                <div>
                  <strong>Close Rate:</strong> {formData.closeRate}%
                </div>
                <div>
                  <strong>Lead Notifications:</strong>{" "}
                  {formData.leadHandlingEmail && `Email: ${formData.leadHandlingEmail}`}
                  {formData.leadHandlingEmail && formData.leadHandlingSms && ", "}
                  {formData.leadHandlingSms && `SMS: ${formData.leadHandlingSms}`}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1 || completeMutation.isPending}
            >
              Back
            </Button>
            {step < 5 ? (
              <Button onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={completeMutation.isPending}
              >
                {completeMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  "Complete Setup"
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
