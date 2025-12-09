import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  ArrowLeft, Save, FileText, Calculator, Camera, 
  AlertTriangle, CheckCircle, Download, Upload, Trash2,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import VesselInfoTab from "@/components/inspection/VesselInfoTab";
import TmlReadingsTab from "@/components/inspection/TmlReadingsTab";
import NozzlesTab from "@/components/inspection/NozzlesTab";
import CalculationsTab from "@/components/inspection/CalculationsTab";
import PhotosTab from "@/components/inspection/PhotosTab";
import FindingsTab from "@/components/inspection/FindingsTab";
import ReportTab from "@/components/inspection/ReportTab";
import ImportTab from "@/components/inspection/ImportTab";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function InspectionDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const inspectionId = parseInt(id || "0");
  
  const { data: inspection, isLoading, refetch } = trpc.inspection.getById.useQuery(
    { id: inspectionId },
    { enabled: inspectionId > 0 }
  );
  
  const { data: calculations } = trpc.calculation.getByInspection.useQuery(
    { inspectionId },
    { enabled: inspectionId > 0 }
  );
  
  const deleteMutation = trpc.inspection.delete.useMutation({
    onSuccess: () => {
      toast.success("Inspection deleted");
      setLocation("/inspections");
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });
  
  const exportMutation = trpc.export.generateCSV.useMutation({
    onSuccess: (data) => {
      window.open(data.url, '_blank');
      toast.success("CSV exported successfully");
    },
    onError: (error) => {
      toast.error(`Export failed: ${error.message}`);
    },
  });
  
  const recalculateMutation = trpc.calculation.recalculate.useMutation({
    onSuccess: () => {
      toast.success("Calculations updated");
      refetch();
    },
    onError: (error) => {
      toast.error(`Recalculation failed: ${error.message}`);
    },
  });
  
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
            <p className="text-gray-600 mb-4">The inspection you're looking for doesn't exist.</p>
            <Button onClick={() => setLocation("/inspections")}>
              Back to Inspections
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const getStatusBadge = () => {
    const hasCritical = calculations?.some(c => c.isBelowMinimum);
    const hasWarning = calculations?.some(c => parseFloat(c.remainingLife || '999') < 5);
    
    if (hasCritical) {
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Critical</Badge>;
    }
    if (hasWarning) {
      return <Badge className="bg-yellow-100 text-yellow-800 gap-1"><AlertTriangle className="h-3 w-3" /> Warning</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800 gap-1"><CheckCircle className="h-3 w-3" /> Acceptable</Badge>;
  };
  
  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setLocation("/inspections")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                {inspection.vesselTagNumber || 'Unnamed Vessel'}
              </h1>
              {getStatusBadge()}
            </div>
            <p className="text-gray-600">
              {inspection.vesselName || 'No description'} • 
              {inspection.inspectionDate 
                ? ` Inspected ${format(new Date(inspection.inspectionDate), 'MMM d, yyyy')}`
                : ' No inspection date'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => recalculateMutation.mutate({ inspectionId })}
            disabled={recalculateMutation.isPending}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${recalculateMutation.isPending ? 'animate-spin' : ''}`} />
            Recalculate
          </Button>
          <Button 
            variant="outline" 
            onClick={() => exportMutation.mutate({ inspectionId })}
            disabled={exportMutation.isPending}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Inspection</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the inspection and all associated data including 
                  TML readings, nozzle evaluations, photos, and reports. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => deleteMutation.mutate({ id: inspectionId })}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-8 mb-6">
          <TabsTrigger value="info">Vessel Info</TabsTrigger>
          <TabsTrigger value="tml">TML Readings</TabsTrigger>
          <TabsTrigger value="nozzles">Nozzles</TabsTrigger>
          <TabsTrigger value="calculations">Calculations</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="findings">Findings</TabsTrigger>
          <TabsTrigger value="report">Report</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
        </TabsList>
        
        <TabsContent value="info">
          <VesselInfoTab inspection={inspection} onUpdate={refetch} />
        </TabsContent>
        
        <TabsContent value="tml">
          <TmlReadingsTab inspectionId={inspectionId} />
        </TabsContent>
        
        <TabsContent value="nozzles">
          <NozzlesTab inspectionId={inspectionId} />
        </TabsContent>
        
        <TabsContent value="calculations">
          <CalculationsTab inspectionId={inspectionId} inspection={inspection} />
        </TabsContent>
        
        <TabsContent value="photos">
          <PhotosTab inspectionId={inspectionId} />
        </TabsContent>
        
        <TabsContent value="findings">
          <FindingsTab inspectionId={inspectionId} />
        </TabsContent>
        
        <TabsContent value="report">
          <ReportTab inspectionId={inspectionId} inspection={inspection} />
        </TabsContent>
        
        <TabsContent value="import">
          <ImportTab inspectionId={inspectionId} onImportComplete={refetch} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
