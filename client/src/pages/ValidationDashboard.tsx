import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, AlertTriangle, CheckCircle, Info, RefreshCw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function ValidationDashboard() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const inspectionId = parseInt(id || "0");
  
  const { data: inspection, isLoading: inspectionLoading } = trpc.inspection.getById.useQuery(
    { id: inspectionId },
    { enabled: inspectionId > 0 }
  );
  
  const { data: calculations, isLoading: calculationsLoading } = trpc.calculation.getByInspection.useQuery(
    { inspectionId },
    { enabled: inspectionId > 0 }
  );
  
  const { data: tmlReadings } = trpc.tml.getByInspection.useQuery(
    { inspectionId },
    { enabled: inspectionId > 0 }
  );
  
  const isLoading = inspectionLoading || calculationsLoading;
  
  if (isLoading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  
  if (!inspection) {
    return (
      <div className="container py-8">
        <Card className="text-center py-12">
          <CardContent>
            <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Inspection Not Found</h3>
            <Button onClick={() => setLocation("/inspections")}>
              Back to Inspections
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Calculate discrepancies
  const discrepancies = calculations?.map(calc => {
    const issues: string[] = [];
    
    // Check if actual thickness matches TML readings
    const relatedTml = tmlReadings?.filter(t => 
      t.componentType?.toLowerCase().includes(calc.componentName?.toLowerCase() || '')
    );
    
    // Check corrosion rate consistency
    const ltRate = parseFloat(calc.corrosionRateLT || '0');
    const stRate = parseFloat(calc.corrosionRateST || '0');
    
    if (stRate > ltRate * 2) {
      issues.push('Short-term rate significantly exceeds long-term rate (possible accelerated corrosion)');
    }
    
    // Check if below minimum
    if (calc.isBelowMinimum) {
      issues.push('Actual thickness below minimum required');
    }
    
    // Check remaining life
    const rl = parseFloat(calc.remainingLife || '999');
    if (rl < 2) {
      issues.push('Remaining life less than 2 years - immediate attention required');
    } else if (rl < 5) {
      issues.push('Remaining life less than 5 years - schedule replacement');
    }
    
    return {
      ...calc,
      issues,
      hasDiscrepancy: issues.length > 0,
    };
  }) || [];
  
  const criticalCount = discrepancies.filter(d => d.isBelowMinimum).length;
  const warningCount = discrepancies.filter(d => d.issues.length > 0 && !d.isBelowMinimum).length;
  const okCount = discrepancies.filter(d => d.issues.length === 0).length;
  
  const getDiscrepancyBadge = (d: typeof discrepancies[0]) => {
    if (d.isBelowMinimum) {
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Critical</Badge>;
    }
    if (d.issues.length > 0) {
      return <Badge className="bg-yellow-100 text-yellow-800 gap-1"><AlertTriangle className="h-3 w-3" /> Warning</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800 gap-1"><CheckCircle className="h-3 w-3" /> OK</Badge>;
  };
  
  return (
    <div className="container py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => setLocation(`/inspection/${inspectionId}`)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Validation Dashboard</h1>
          <p className="text-gray-600">
            {inspection.vesselTagNumber || 'Vessel'} - Discrepancy Analysis
          </p>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Components</CardDescription>
            <CardTitle className="text-2xl">{discrepancies.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardDescription className="text-red-700">Critical Issues</CardDescription>
            <CardTitle className="text-2xl text-red-700">{criticalCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardDescription className="text-yellow-700">Warnings</CardDescription>
            <CardTitle className="text-2xl text-yellow-700">{warningCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardDescription className="text-green-700">Acceptable</CardDescription>
            <CardTitle className="text-2xl text-green-700">{okCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>
      
      <Tabs defaultValue="discrepancies">
        <TabsList className="mb-4">
          <TabsTrigger value="discrepancies">Discrepancy Analysis</TabsTrigger>
          <TabsTrigger value="corrosion">Dual Corrosion Rate Analysis</TabsTrigger>
          <TabsTrigger value="comparison">PDF vs Calculated</TabsTrigger>
        </TabsList>
        
        <TabsContent value="discrepancies">
          <Card>
            <CardHeader>
              <CardTitle>Component Discrepancy Analysis</CardTitle>
              <CardDescription>
                Review calculated values against expected ranges and identify anomalies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead>Actual (in)</TableHead>
                    <TableHead>Min Required (in)</TableHead>
                    <TableHead>Margin</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issues</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {discrepancies.map((d) => {
                    const actual = parseFloat(d.actualThickness || '0');
                    const min = parseFloat(d.minimumThickness || '0');
                    const margin = actual - min;
                    const marginPercent = min > 0 ? ((margin / min) * 100).toFixed(1) : 'N/A';
                    
                    return (
                      <TableRow key={d.id} className={d.isBelowMinimum ? 'bg-red-50' : d.issues.length > 0 ? 'bg-yellow-50' : ''}>
                        <TableCell className="font-medium">{d.componentName}</TableCell>
                        <TableCell>{d.actualThickness}</TableCell>
                        <TableCell>{d.minimumThickness}</TableCell>
                        <TableCell className={margin < 0 ? 'text-red-600 font-medium' : ''}>
                          {margin.toFixed(4)}" ({marginPercent}%)
                        </TableCell>
                        <TableCell>{getDiscrepancyBadge(d)}</TableCell>
                        <TableCell>
                          {d.issues.length > 0 ? (
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="outline" className="gap-1 cursor-help">
                                  {d.issues.length} issue(s)
                                  <Info className="h-3 w-3" />
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-sm">
                                <ul className="text-sm space-y-1">
                                  {d.issues.map((issue, i) => (
                                    <li key={i}>• {issue}</li>
                                  ))}
                                </ul>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-gray-400">None</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="corrosion">
          <Card>
            <CardHeader>
              <CardTitle>Dual Corrosion Rate Analysis</CardTitle>
              <CardDescription>
                Compare long-term (LT) and short-term (ST) corrosion rates to identify trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead>LT Rate (ipy)</TableHead>
                    <TableHead>ST Rate (ipy)</TableHead>
                    <TableHead>Governing</TableHead>
                    <TableHead>Ratio (ST/LT)</TableHead>
                    <TableHead>Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calculations?.map((calc) => {
                    const ltRate = parseFloat(calc.corrosionRateLT || '0');
                    const stRate = parseFloat(calc.corrosionRateST || '0');
                    const ratio = ltRate > 0 ? (stRate / ltRate).toFixed(2) : 'N/A';
                    
                    let trend = 'Stable';
                    let trendColor = 'text-green-600';
                    if (stRate > ltRate * 1.5) {
                      trend = 'Accelerating';
                      trendColor = 'text-red-600';
                    } else if (stRate < ltRate * 0.5) {
                      trend = 'Decelerating';
                      trendColor = 'text-blue-600';
                    }
                    
                    return (
                      <TableRow key={calc.id}>
                        <TableCell className="font-medium">{calc.componentName}</TableCell>
                        <TableCell>{calc.corrosionRateLT}</TableCell>
                        <TableCell>{calc.corrosionRateST}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {calc.governingRate === 'LT' ? 'Long-Term' : 'Short-Term'}
                          </Badge>
                        </TableCell>
                        <TableCell>{ratio}</TableCell>
                        <TableCell className={trendColor + ' font-medium'}>{trend}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Interpretation Guide</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li><span className="text-red-600 font-medium">Accelerating:</span> ST rate &gt; 1.5x LT rate - Corrosion is increasing, investigate cause</li>
                  <li><span className="text-green-600 font-medium">Stable:</span> ST rate ≈ LT rate - Corrosion is consistent with historical trends</li>
                  <li><span className="text-blue-600 font-medium">Decelerating:</span> ST rate &lt; 0.5x LT rate - Corrosion is slowing (verify data accuracy)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>PDF Original vs Calculated Values</CardTitle>
              <CardDescription>
                Compare values from imported PDF against recalculated values
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Info className="h-12 w-12 mx-auto mb-4" />
                <p>PDF comparison data will be available after importing an inspection report.</p>
                <p className="text-sm mt-2">
                  Import a PDF in the Import tab to enable this comparison.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
