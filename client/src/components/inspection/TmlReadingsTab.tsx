import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, AlertTriangle, Edit2 } from "lucide-react";

interface TmlReadingsTabProps {
  inspectionId: number;
}

export default function TmlReadingsTab({ inspectionId }: TmlReadingsTabProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    cmlNumber: "",
    tmlId: "",
    location: "",
    componentType: "shell",
    readingType: "UT",
    nozzleSize: "",
    angle: "",
    tml1: "",
    tml2: "",
    tml3: "",
    tml4: "",
    nominalThickness: "",
    previousThickness: "",
    actualThickness: "",
    minimumThickness: "",
    notes: "",
  });
  
  const utils = trpc.useUtils();
  const { data: readings, isLoading } = trpc.tml.getByInspection.useQuery({ inspectionId });
  
  const createMutation = trpc.tml.create.useMutation({
    onSuccess: () => {
      toast.success("TML reading added");
      setIsAddDialogOpen(false);
      resetForm();
      utils.tml.getByInspection.invalidate({ inspectionId });
    },
    onError: (error) => toast.error(`Failed to add: ${error.message}`),
  });
  
  const updateMutation = trpc.tml.update.useMutation({
    onSuccess: () => {
      toast.success("TML reading updated");
      setEditingId(null);
      resetForm();
      utils.tml.getByInspection.invalidate({ inspectionId });
    },
    onError: (error) => toast.error(`Failed to update: ${error.message}`),
  });
  
  const deleteMutation = trpc.tml.delete.useMutation({
    onSuccess: () => {
      toast.success("TML reading deleted");
      utils.tml.getByInspection.invalidate({ inspectionId });
    },
    onError: (error) => toast.error(`Failed to delete: ${error.message}`),
  });
  
  const resetForm = () => {
    setFormData({
      cmlNumber: "",
      tmlId: "",
      location: "",
      componentType: "shell",
      readingType: "UT",
      nozzleSize: "",
      angle: "",
      tml1: "",
      tml2: "",
      tml3: "",
      tml4: "",
      nominalThickness: "",
      previousThickness: "",
      actualThickness: "",
      minimumThickness: "",
      notes: "",
    });
  };
  
  const handleSubmit = () => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...formData });
    } else {
      createMutation.mutate({ inspectionId, ...formData });
    }
  };
  
  const handleEdit = (reading: typeof readings extends (infer T)[] | undefined ? T : never) => {
    if (!reading) return;
    setEditingId(reading.id);
    setFormData({
      cmlNumber: reading.cmlNumber || "",
      tmlId: reading.tmlId || "",
      location: reading.location || "",
      componentType: reading.componentType || "shell",
      readingType: reading.readingType || "UT",
      nozzleSize: reading.nozzleSize || "",
      angle: reading.angle || "",
      tml1: reading.tml1 || "",
      tml2: reading.tml2 || "",
      tml3: reading.tml3 || "",
      tml4: reading.tml4 || "",
      nominalThickness: reading.nominalThickness || "",
      previousThickness: reading.previousThickness || "",
      actualThickness: reading.actualThickness || "",
      minimumThickness: reading.minimumThickness || "",
      notes: reading.notes || "",
    });
    setIsAddDialogOpen(true);
  };
  
  const getStatusBadge = (actual: string | null, minimum: string | null) => {
    if (!actual || !minimum) return null;
    const actualNum = parseFloat(actual);
    const minNum = parseFloat(minimum);
    if (actualNum < minNum) {
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Below Min</Badge>;
    }
    if (actualNum < minNum * 1.1) {
      return <Badge className="bg-yellow-100 text-yellow-800">Near Min</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800">OK</Badge>;
  };
  
  // Group readings by component type
  const groupedReadings = readings?.reduce((acc, r) => {
    const type = r.componentType || 'shell';
    if (!acc[type]) acc[type] = [];
    acc[type].push(r);
    return acc;
  }, {} as Record<string, typeof readings>);
  
  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">TML Readings</h2>
          <p className="text-gray-600">Thickness Measurement Location data</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) {
            setEditingId(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Reading
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit TML Reading" : "Add TML Reading"}</DialogTitle>
              <DialogDescription>
                Enter thickness measurement data for this location
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>CML Number</Label>
                  <Input value={formData.cmlNumber} onChange={(e) => setFormData(p => ({ ...p, cmlNumber: e.target.value }))} placeholder="e.g., 1" />
                </div>
                <div className="space-y-2">
                  <Label>TML ID</Label>
                  <Input value={formData.tmlId} onChange={(e) => setFormData(p => ({ ...p, tmlId: e.target.value }))} placeholder="e.g., 1A" />
                </div>
                <div className="space-y-2">
                  <Label>Component Type</Label>
                  <Select value={formData.componentType} onValueChange={(v) => setFormData(p => ({ ...p, componentType: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shell">Shell</SelectItem>
                      <SelectItem value="east_head">East Head</SelectItem>
                      <SelectItem value="west_head">West Head</SelectItem>
                      <SelectItem value="nozzle">Nozzle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Reading Type</Label>
                  <Select value={formData.readingType} onValueChange={(v) => setFormData(p => ({ ...p, readingType: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UT">UT</SelectItem>
                      <SelectItem value="RT">RT</SelectItem>
                      <SelectItem value="Visual">Visual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input value={formData.location} onChange={(e) => setFormData(p => ({ ...p, location: e.target.value }))} placeholder="e.g., 12 o'clock" />
                </div>
                <div className="space-y-2">
                  <Label>Angle</Label>
                  <Input value={formData.angle} onChange={(e) => setFormData(p => ({ ...p, angle: e.target.value }))} placeholder="e.g., 0°" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>TML 1</Label>
                  <Input value={formData.tml1} onChange={(e) => setFormData(p => ({ ...p, tml1: e.target.value }))} placeholder="0.000" />
                </div>
                <div className="space-y-2">
                  <Label>TML 2</Label>
                  <Input value={formData.tml2} onChange={(e) => setFormData(p => ({ ...p, tml2: e.target.value }))} placeholder="0.000" />
                </div>
                <div className="space-y-2">
                  <Label>TML 3</Label>
                  <Input value={formData.tml3} onChange={(e) => setFormData(p => ({ ...p, tml3: e.target.value }))} placeholder="0.000" />
                </div>
                <div className="space-y-2">
                  <Label>TML 4</Label>
                  <Input value={formData.tml4} onChange={(e) => setFormData(p => ({ ...p, tml4: e.target.value }))} placeholder="0.000" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Nominal</Label>
                  <Input value={formData.nominalThickness} onChange={(e) => setFormData(p => ({ ...p, nominalThickness: e.target.value }))} placeholder="0.000" />
                </div>
                <div className="space-y-2">
                  <Label>Previous</Label>
                  <Input value={formData.previousThickness} onChange={(e) => setFormData(p => ({ ...p, previousThickness: e.target.value }))} placeholder="0.000" />
                </div>
                <div className="space-y-2">
                  <Label>Actual</Label>
                  <Input value={formData.actualThickness} onChange={(e) => setFormData(p => ({ ...p, actualThickness: e.target.value }))} placeholder="0.000" />
                </div>
                <div className="space-y-2">
                  <Label>Minimum</Label>
                  <Input value={formData.minimumThickness} onChange={(e) => setFormData(p => ({ ...p, minimumThickness: e.target.value }))} placeholder="0.000" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {editingId ? "Update" : "Add"} Reading
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {groupedReadings && Object.keys(groupedReadings).length > 0 ? (
        Object.entries(groupedReadings).map(([componentType, componentReadings]) => (
          <Card key={componentType}>
            <CardHeader>
              <CardTitle className="capitalize">{componentType.replace('_', ' ')}</CardTitle>
              <CardDescription>{componentReadings?.length || 0} readings</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CML</TableHead>
                    <TableHead>TML ID</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>TML 1</TableHead>
                    <TableHead>TML 2</TableHead>
                    <TableHead>TML 3</TableHead>
                    <TableHead>TML 4</TableHead>
                    <TableHead>Previous</TableHead>
                    <TableHead>Actual</TableHead>
                    <TableHead>Minimum</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {componentReadings?.map((reading) => (
                    <TableRow key={reading.id}>
                      <TableCell className="font-medium">{reading.cmlNumber}</TableCell>
                      <TableCell>{reading.tmlId}</TableCell>
                      <TableCell>{reading.location}</TableCell>
                      <TableCell>{reading.tml1}</TableCell>
                      <TableCell>{reading.tml2}</TableCell>
                      <TableCell>{reading.tml3}</TableCell>
                      <TableCell>{reading.tml4}</TableCell>
                      <TableCell>{reading.previousThickness}</TableCell>
                      <TableCell className="font-medium">{reading.actualThickness}</TableCell>
                      <TableCell>{reading.minimumThickness}</TableCell>
                      <TableCell>{getStatusBadge(reading.actualThickness, reading.minimumThickness)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(reading)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate({ id: reading.id })}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-gray-600 mb-4">No TML readings recorded yet.</p>
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add First Reading
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
