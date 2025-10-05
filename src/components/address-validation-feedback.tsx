"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ValidationResult } from "@/lib/address-validation";
import { AlertTriangle, ArrowRight, CheckCircle2, HelpCircle, MapPin, XCircle } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface AddressValidationFeedbackProps {
  validation: ValidationResult | null;
  showDetails?: boolean;
  className?: string;
}

interface AddressSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAcceptSuggestion: () => void;
  onKeepOriginal: () => void;
  validation: ValidationResult;
  isLoading?: boolean;
}

// ============================================================================
// Validation Status Badge
// ============================================================================

export function ValidationStatusBadge({ validation }: { validation: ValidationResult | null }) {
  if (!validation) {
    return (
      <Badge variant="secondary" className="gap-1">
        <HelpCircle className="h-3 w-3" />
        Not Validated
      </Badge>
    );
  }

  if (validation.isValid && validation.confidence >= 80) {
    return (
      <Badge variant="default" className="gap-1 bg-green-600">
        <CheckCircle2 className="h-3 w-3" />
        Validated
      </Badge>
    );
  }

  if (validation.isValid && validation.confidence >= 50) {
    return (
      <Badge variant="secondary" className="gap-1 bg-yellow-600 text-white">
        <AlertTriangle className="h-3 w-3" />
        Partially Validated
      </Badge>
    );
  }

  return (
    <Badge variant="destructive" className="gap-1">
      <XCircle className="h-3 w-3" />
      Validation Failed
    </Badge>
  );
}

// ============================================================================
// Validation Feedback Component
// ============================================================================

export function AddressValidationFeedback({
  validation,
  showDetails = false,
  className,
}: AddressValidationFeedbackProps) {
  if (!validation) return null;

  const { isValid, confidence, issues } = validation;

  // Determine alert variant based on validation status
  const getAlertVariant = () => {
    if (isValid && confidence >= 80) return "default";
    if (isValid && confidence >= 50) return "default";
    return "destructive";
  };

  const getIcon = () => {
    if (isValid && confidence >= 80) {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    }
    if (isValid && confidence >= 50) {
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getMessage = () => {
    if (isValid && confidence >= 80) {
      return "Address verified successfully";
    }
    if (isValid && confidence >= 50) {
      return "Address partially verified - please review suggestions";
    }
    return "Address could not be verified - please check for errors";
  };

  return (
    <div className={className}>
      <Alert variant={getAlertVariant()}>
        <div className="flex items-start gap-2">
          {getIcon()}
          <div className="flex-1">
            <AlertDescription>
              <div className="font-medium">{getMessage()}</div>
              {showDetails && (
                <>
                  <div className="text-muted-foreground mt-1 text-sm">Confidence: {confidence}%</div>
                  {issues.length > 0 && (
                    <ul className="mt-2 list-inside list-disc text-sm">
                      {issues.map((issue, index) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </AlertDescription>
          </div>
        </div>
      </Alert>
    </div>
  );
}

// ============================================================================
// Address Suggestion Modal
// ============================================================================

export function AddressSuggestionModal({
  isOpen,
  onClose,
  onAcceptSuggestion,
  onKeepOriginal,
  validation,
  isLoading = false,
}: AddressSuggestionModalProps) {
  const { originalAddress, suggestion } = validation;

  if (!suggestion) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Address Suggestion
          </DialogTitle>
          <DialogDescription>
            We found a suggested address that may be more accurate. Please review and choose which address to use.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Confidence Score */}
          <div className="bg-muted flex items-center justify-between rounded-lg p-3">
            <div className="text-sm font-medium">Confidence Score</div>
            <div className="flex items-center gap-2">
              <div className="text-lg font-bold">{suggestion.confidence}%</div>
              <ValidationStatusBadge validation={validation} />
            </div>
          </div>

          {/* Address Comparison */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Original Address */}
            <Card>
              <CardContent className="p-4">
                <div className="text-muted-foreground mb-2 text-sm font-semibold">Your Address</div>
                <div className="space-y-1 text-sm">
                  <div>{originalAddress.addressLine1}</div>
                  {originalAddress.addressLine2 && <div>{originalAddress.addressLine2}</div>}
                  <div>
                    {originalAddress.city}, {originalAddress.state} {originalAddress.postalCode}
                  </div>
                  <div>{originalAddress.country}</div>
                </div>
              </CardContent>
            </Card>

            {/* Suggested Address */}
            <Card className="border-primary border-2">
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-primary text-sm font-semibold">Suggested Address</div>
                  <Badge variant="default" className="text-xs">
                    Recommended
                  </Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="font-medium">{suggestion.addressLine1}</div>
                  {suggestion.addressLine2 && <div className="font-medium">{suggestion.addressLine2}</div>}
                  <div className="font-medium">
                    {suggestion.city}, {suggestion.state} {suggestion.postalCode}
                  </div>
                  <div className="font-medium">{suggestion.country}</div>
                </div>
                {suggestion.formattedAddress && (
                  <div className="bg-muted text-muted-foreground mt-2 rounded p-2 text-xs">
                    {suggestion.formattedAddress}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Issues/Warnings */}
          {validation.issues.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium">Please Note:</div>
                <ul className="mt-1 list-inside list-disc text-sm">
                  {validation.issues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Additional Info */}
          {(suggestion.hasInferredComponents || suggestion.hasUnconfirmedComponents) && (
            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
              {suggestion.hasInferredComponents && <div>• Some address components were automatically filled in</div>}
              {suggestion.hasUnconfirmedComponents && <div>• Some address components could not be confirmed</div>}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onKeepOriginal} disabled={isLoading}>
            Keep My Address
          </Button>
          <Button onClick={onAcceptSuggestion} disabled={isLoading} className="gap-2">
            {isLoading ? (
              "Updating..."
            ) : (
              <>
                Use Suggested Address
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Inline Address Comparison
// ============================================================================

export function AddressComparisonInline({
  validation,
  onAcceptSuggestion,
  onDismiss,
  isLoading = false,
}: {
  validation: ValidationResult;
  onAcceptSuggestion: () => void;
  onDismiss: () => void;
  isLoading?: boolean;
}) {
  const { suggestion } = validation;

  if (!suggestion) return null;

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span className="font-semibold text-blue-900">Suggested Address</span>
              <Badge variant="secondary" className="text-xs">
                {suggestion.confidence}% confidence
              </Badge>
            </div>
            <div className="text-sm">
              <div className="font-medium">{suggestion.addressLine1}</div>
              {suggestion.addressLine2 && <div>{suggestion.addressLine2}</div>}
              <div>
                {suggestion.city}, {suggestion.state} {suggestion.postalCode}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button size="sm" onClick={onAcceptSuggestion} disabled={isLoading}>
              Use This
            </Button>
            <Button size="sm" variant="outline" onClick={onDismiss} disabled={isLoading}>
              Dismiss
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
