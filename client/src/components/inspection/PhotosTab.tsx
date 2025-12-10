import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Upload, Image as ImageIcon, Edit2 } from "lucide-react";
import { PHOTO_CATEGORIES } from "@shared/api510Types";

interface PhotosTabProps {
  inspectionId: number;
}

export default function PhotosTab({ inspectionId }: PhotosTabProps) {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [category, setCategory] = useState("general");
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const utils = trpc.useUtils();
  const { data: photos, isLoading } = trpc.photo.getByInspection.useQuery({ inspectionId });
  
  const uploadMutation = trpc.photo.upload.useMutation({
    onSuccess: () => {
      toast.success("Photo uploaded");
      setIsUploadDialogOpen(false);
      resetForm();
      utils.photo.getByInspection.invalidate({ inspectionId });
    },
    onError: (error) => toast.error(`Upload failed: ${error.message}`),
  });
  
  const updateMutation = trpc.photo.update.useMutation({
    onSuccess: () => {
      toast.success("Photo updated");
      utils.photo.getByInspection.invalidate({ inspectionId });
    },
    onError: (error) => toast.error(`Update failed: ${error.message}`),
  });
  
  const deleteMutation = trpc.photo.delete.useMutation({
    onSuccess: () => {
      toast.success("Photo deleted");
      utils.photo.getByInspection.invalidate({ inspectionId });
    },
    onError: (error) => toast.error(`Delete failed: ${error.message}`),
  });
  
  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setCategory("general");
    setCaption("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        await uploadMutation.mutateAsync({
          inspectionId,
          filename: selectedFile.name,
          contentType: selectedFile.type,
          base64Data: base64,
          category,
          caption,
        });
        setIsUploading(false);
      };
      reader.readAsDataURL(selectedFile);
    } catch {
      setIsUploading(false);
    }
  };
  
  // Group photos by category
  const groupedPhotos = photos?.reduce((acc, p) => {
    const cat = p.category || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {} as Record<string, typeof photos>);
  
  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Inspection Photos</h2>
          <p className="text-gray-600">Upload and organize vessel photos with annotations</p>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={(open) => {
          setIsUploadDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Upload className="h-4 w-4" />
              Upload Photo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Photo</DialogTitle>
              <DialogDescription>
                Add a photo to the inspection record
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Photo</Label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                />
                {previewUrl && (
                  <div className="mt-2">
                    <img src={previewUrl} alt="Preview" className="max-h-48 rounded-lg object-contain" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PHOTO_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat} className="capitalize">
                        {cat.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Caption</Label>
                <Input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Describe the photo..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleUpload} disabled={!selectedFile || isUploading || uploadMutation.isPending}>
                {isUploading ? "Uploading..." : "Upload"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {groupedPhotos && Object.keys(groupedPhotos).length > 0 ? (
        Object.entries(groupedPhotos).map(([cat, catPhotos]) => (
          <Card key={cat}>
            <CardHeader>
              <CardTitle className="capitalize">{cat.replace('_', ' ')}</CardTitle>
              <CardDescription>{catPhotos?.length || 0} photos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                {catPhotos?.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.url || ''}
                      alt={photo.caption || photo.filename || 'Photo'}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => deleteMutation.mutate({ id: photo.id })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {photo.caption && (
                      <p className="mt-2 text-sm text-gray-600 truncate">{photo.caption}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">No photos uploaded yet.</p>
            <Button onClick={() => setIsUploadDialogOpen(true)} className="gap-2">
              <Upload className="h-4 w-4" />
              Upload First Photo
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
