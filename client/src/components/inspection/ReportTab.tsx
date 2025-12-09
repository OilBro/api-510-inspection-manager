import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { FileText, Download, RefreshCw, ExternalLink, Trash2 } from "lucide-react";
import { format } from "date-fns";
import type { Inspection } from "@shared/types";

interface ReportTabProps {
  inspectionId: number;
  inspection: Inspection;
}

export default function ReportTab({ inspectionId, inspection }: ReportTabProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const utils = trpc.useUtils();
  const { data: reports, isLoading } = trpc.report.getByInspection.useQuery({ inspectionId });
  
  const generateMutation = trpc.report.generate.useMutation({
    onSuccess: (data) => {
      toast.success("Report generated successfully");
      utils.report.getByInspection.invalidate({ inspectionId });
    },
    onError: (error) => {
      toast.error(`Failed to generate report: ${error.message}`);
    },
  });
  
  const deleteMutation = trpc.report.delete.useMutation({
    onSuccess: () => {
      toast.success("Report deleted");
      utils.report.getByInspection.invalidate({ inspectionId });
    },
    onError: (error) => toast.error(`Failed to delete: ${error.message}`),
  });
  
  const handleGenerate = () => {
    generateMutation.mutate({ inspectionId });
  };
  
  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Professional Reports</h2>
          <p className="text-gray-600">Generate and download inspection reports</p>
        </div>
        <Button 
          onClick={handleGenerate} 
          disabled={generateMutation.isPending}
          className="gap-2"
        >
          {generateMutation.isPending ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4" />
              Generate Report
            </>
          )}
        </Button>
      </div>
      
      {/* Report Preview Info */}
      <Card>
        <CardHeader>
          <CardTitle>Report Contents</CardTitle>
          <CardDescription>
            The generated report will include the following sections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-semibold">Executive Summary</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Vessel identification and nameplate data</li>
                <li>• Design parameters and operating conditions</li>
                <li>• Overall condition assessment</li>
                <li>• Key findings summary</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Thickness Analysis</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Component-by-component thickness data</li>
                <li>• TML readings with multi-angle measurements</li>
                <li>• Corrosion rate calculations (LT & ST)</li>
                <li>• Remaining life predictions</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">ASME Calculations</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Minimum required thickness (t_min)</li>
                <li>• Maximum allowable working pressure (MAWP)</li>
                <li>• Next inspection interval recommendations</li>
                <li>• Formula references and parameters</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Nozzle Evaluations</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• ASME B31.3 nozzle thickness analysis</li>
                <li>• Service type classifications</li>
                <li>• Individual nozzle condition assessments</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Findings & Recommendations</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Detailed inspection findings</li>
                <li>• Severity classifications</li>
                <li>• Prioritized recommendations</li>
                <li>• Due dates and action items</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Appendices</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Inspection photographs</li>
                <li>• Raw thickness data tables</li>
                <li>• Material stress lookup references</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Generated Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Reports</CardTitle>
          <CardDescription>
            Previously generated reports for this inspection
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reports && reports.length > 0 ? (
            <div className="space-y-4">
              {reports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="font-medium">{report.filename}</p>
                      <p className="text-sm text-gray-500">
                        Generated {format(new Date(report.createdAt), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{report.status}</Badge>
                    <Button variant="outline" size="sm" asChild className="gap-2">
                      <a href={report.url || report.pdfUrl || '#'} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                        View
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild className="gap-2">
                      <a href={report.url || report.pdfUrl || '#'} download>
                        <Download className="h-4 w-4" />
                        Download
                      </a>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => deleteMutation.mutate({ id: report.id })}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">No reports generated yet.</p>
              <Button onClick={handleGenerate} disabled={generateMutation.isPending} className="gap-2">
                <FileText className="h-4 w-4" />
                Generate First Report
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
