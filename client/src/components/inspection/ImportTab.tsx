import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, FileText, Check, AlertCircle, Loader2, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface ImportTabProps {
  inspectionId: number;
  onImportComplete: () => void;
}

export default function ImportTab({ inspectionId, onImportComplete }: ImportTabProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const utils = trpc.useUtils();
  const { data: importedFiles, isLoading } = trpc.import.getByInspection.useQuery({ inspectionId });
  
  const importMutation = trpc.import.parseDocument.useMutation({
    onSuccess: (data) => {
      toast.success("Document imported and parsed successfully");
      setSelectedFile(null);
      setImportProgress(100);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      utils.import.getByInspection.invalidate({ inspectionId });
      onImportComplete();
    },
    onError: (error) => {
      toast.error(`Import failed: ${error.message}`);
      setImportProgress(0);
    },
  });
  
  const deleteMutation = trpc.import.delete.useMutation({
    onSuccess: () => {
      toast.success("Import record deleted");
      utils.import.getByInspection.invalidate({ inspectionId });
    },
    onError: (error) => toast.error(`Delete failed: ${error.message}`),
  });
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportProgress(0);
    }
  };
  
  const handleImport = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    setImportProgress(10);
    
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        setImportProgress(30);
        const base64 = (reader.result as string).split(',')[1];
        
        setImportProgress(50);
        await importMutation.mutateAsync({
          inspectionId,
          filename: selectedFile.name,
          contentType: selectedFile.type,
          base64Data: base64,
        });
        setIsUploading(false);
      };
      reader.readAsDataURL(selectedFile);
    } catch {
      setIsUploading(false);
      setImportProgress(0);
    }
  };
  
  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 gap-1"><Check className="h-3 w-3" /> Completed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800 gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Import Data</h2>
        <p className="text-gray-600">Import inspection data from PDF or Excel files using AI-powered parsing</p>
      </div>
      
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Document</CardTitle>
          <CardDescription>
            Upload a PDF or Excel file to extract vessel data, thickness readings, and inspection metadata
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select File</Label>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.xlsx,.xls,.csv"
              onChange={handleFileSelect}
            />
            <p className="text-sm text-gray-500">
              Supported formats: PDF, Excel (.xlsx, .xls), CSV
            </p>
          </div>
          
          {selectedFile && (
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="flex-1">
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button 
                onClick={handleImport} 
                disabled={isUploading || importMutation.isPending}
                className="gap-2"
              >
                {isUploading || importMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Import
                  </>
                )}
              </Button>
            </div>
          )}
          
          {importProgress > 0 && importProgress < 100 && (
            <div className="space-y-2">
              <Progress value={importProgress} />
              <p className="text-sm text-gray-500 text-center">
                {importProgress < 30 && "Uploading file..."}
                {importProgress >= 30 && importProgress < 50 && "Processing document..."}
                {importProgress >= 50 && "Extracting data with AI..."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* AI Parsing Info */}
      <Card>
        <CardHeader>
          <CardTitle>AI-Powered Extraction</CardTitle>
          <CardDescription>
            How the import process works
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-semibold">What Gets Extracted</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Vessel identification and nameplate data</li>
                <li>• Design parameters (pressure, temperature, material)</li>
                <li>• Thickness measurement readings</li>
                <li>• Nozzle information and evaluations</li>
                <li>• Previous inspection data</li>
                <li>• Findings and recommendations</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Confidence Scoring</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Each extracted field has a confidence score</li>
                <li>• High confidence: Automatically applied</li>
                <li>• Medium confidence: Review recommended</li>
                <li>• Low confidence: Manual verification required</li>
                <li>• Field mapping suggestions provided</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Import History */}
      <Card>
        <CardHeader>
          <CardTitle>Import History</CardTitle>
          <CardDescription>
            Previously imported documents for this inspection
          </CardDescription>
        </CardHeader>
        <CardContent>
          {importedFiles && importedFiles.length > 0 ? (
            <div className="space-y-4">
              {importedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="font-medium">{file.originalFilename}</p>
                      <p className="text-sm text-gray-500">
                        Imported {format(new Date(file.createdAt), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(file.status)}
                    {file.fieldsExtracted && (
                      <Badge variant="outline">{file.fieldsExtracted} fields</Badge>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => deleteMutation.mutate({ id: file.id })}
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
              <p className="text-gray-600">No documents imported yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
