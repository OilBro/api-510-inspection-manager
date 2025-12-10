import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Inspection } from "@shared/types";

interface CalculationsTabProps {
  inspectionId: number;
  inspection: Inspection;
}

export default function CalculationsTab({ inspectionId, inspection }: CalculationsTabProps) {
  const { data: calculations, isLoading } = trpc.calculation.getByInspection.useQuery({ inspectionId });
  
  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }
  
  const getStatusBadge = (calc: typeof calculations extends (infer T)[] | undefined ? T : never) => {
    if (!calc) return null;
    if (calc.isBelowMinimum) {
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Below Min</Badge>;
    }
    const rl = parseFloat(calc.remainingLife || '999');
    if (rl < 2) {
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Critical</Badge>;
    }
    if (rl < 5) {
      return <Badge className="bg-yellow-100 text-yellow-800 gap-1"><AlertTriangle className="h-3 w-3" /> Warning</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800 gap-1"><CheckCircle className="h-3 w-3" /> Acceptable</Badge>;
  };
  
  const getRateIndicator = (calc: typeof calculations extends (infer T)[] | undefined ? T : never) => {
    if (!calc) return null;
    const isLT = calc.governingRate === 'LT';
    return (
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="outline" className="gap-1">
            {isLT ? 'LT' : 'ST'}
            <Info className="h-3 w-3" />
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="font-semibold mb-1">{isLT ? 'Long-Term Rate Governs' : 'Short-Term Rate Governs'}</p>
          <p className="text-sm">{calc.governingRateReason}</p>
          <div className="mt-2 text-xs">
            <p>LT Rate: {calc.corrosionRateLT} ipy</p>
            <p>ST Rate: {calc.corrosionRateST} ipy</p>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Component Calculations</h2>
        <p className="text-gray-600">ASME Section VIII thickness and MAWP analysis</p>
      </div>
      
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Design Pressure</CardDescription>
            <CardTitle className="text-2xl">{inspection.designPressure || '-'} psi</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Design Temperature</CardDescription>
            <CardTitle className="text-2xl">{inspection.designTemperature || '-'}°F</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Allowable Stress</CardDescription>
            <CardTitle className="text-2xl">{inspection.allowableStress?.toLocaleString() || '-'} psi</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Joint Efficiency</CardDescription>
            <CardTitle className="text-2xl">{inspection.jointEfficiency || '-'}</CardTitle>
          </CardHeader>
        </Card>
      </div>
      
      {calculations && calculations.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Calculation Results</CardTitle>
            <CardDescription>
              Minimum thickness, MAWP, corrosion rates, and remaining life for each component
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Component</TableHead>
                  <TableHead>Actual (in)</TableHead>
                  <TableHead>Min Required (in)</TableHead>
                  <TableHead>MAWP (psi)</TableHead>
                  <TableHead>CR (ipy)</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>RL (years)</TableHead>
                  <TableHead>Next Insp</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calculations.map((calc) => (
                  <TableRow key={calc.id} className={calc.isBelowMinimum ? 'bg-red-50' : ''}>
                    <TableCell className="font-medium">{calc.componentName}</TableCell>
                    <TableCell>{calc.actualThickness}</TableCell>
                    <TableCell>{calc.minimumThickness}</TableCell>
                    <TableCell>{calc.calculatedMAWP}</TableCell>
                    <TableCell>{calc.corrosionRate}</TableCell>
                    <TableCell>{getRateIndicator(calc)}</TableCell>
                    <TableCell className="font-medium">{calc.remainingLife}</TableCell>
                    <TableCell>{calc.nextInspectionYears} yrs</TableCell>
                    <TableCell>{getStatusBadge(calc)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-gray-600 mb-4">
              No calculations available. Add TML readings and click "Recalculate" to generate component calculations.
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* Formulas Reference */}
      <Card>
        <CardHeader>
          <CardTitle>ASME Section VIII Formulas</CardTitle>
          <CardDescription>Reference formulas used in calculations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Shell Minimum Thickness</h4>
            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
              t_min = PR / (SE - 0.6P)
            </code>
          </div>
          <div>
            <h4 className="font-semibold mb-2">2:1 Ellipsoidal Head Minimum Thickness</h4>
            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
              t_min = PD / (2SE - 0.2P)
            </code>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Shell MAWP</h4>
            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
              MAWP = SEt / (R + 0.6t)
            </code>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Corrosion Rate</h4>
            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
              CR = (t_previous - t_actual) / ΔT
            </code>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Remaining Life</h4>
            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
              RL = (t_actual - t_min) / CR
            </code>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Next Inspection Interval (API 510)</h4>
            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
              NI = min(RL/2, 10 years)
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
