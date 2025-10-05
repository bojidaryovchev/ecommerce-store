"use client";

import { deleteTaxRate, getTaxRates } from "@/actions/tax-rate.action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { formatTaxRate, getTaxTypeLabel } from "@/lib/tax-config";
import type { TaxRate } from "@prisma/client";
import { Pencil, Plus, Trash2, Upload } from "lucide-react";
import { useEffect, useState } from "react";

export function TaxRatesTable() {
  const { toast } = useToast();
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTaxRates = async () => {
    setIsLoading(true);
    try {
      const result = await getTaxRates();
      if (result.success && result.data) {
        setTaxRates(result.data);
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load tax rates",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTaxRates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tax rate?")) {
      return;
    }

    try {
      const result = await deleteTaxRate(id);
      if (result.success) {
        toast({
          title: "Success",
          description: "Tax rate deleted successfully",
        });
        loadTaxRates();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete tax rate",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete tax rate",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Tax Rates</CardTitle>
            <CardDescription>Manage tax rates for different locations</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Tax Rate
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-muted-foreground py-8 text-center">Loading tax rates...</div>
        ) : taxRates.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground mb-4">No tax rates configured yet</p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Tax Rate
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taxRates.map((rate) => (
                <TableRow key={rate.id}>
                  <TableCell>
                    <div className="font-medium">
                      {rate.country}
                      {rate.state && ` - ${rate.state}`}
                      {rate.city && ` - ${rate.city}`}
                      {rate.postalCode && ` (${rate.postalCode})`}
                    </div>
                  </TableCell>
                  <TableCell>{rate.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{getTaxTypeLabel(rate.type)}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{formatTaxRate(Number(rate.rate))}</TableCell>
                  <TableCell>{rate.priority}</TableCell>
                  <TableCell>
                    {rate.isActive ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(rate.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
