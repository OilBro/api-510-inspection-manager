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
import { Plus, Trash2, Edit2 } from "lucide-react";
import { NOZZLE_SERVICE_TYPES } from "@shared/api510Types";

interface NozzlesTabProps {
  inspectionId: number;
}

export default function NozzlesTab({ inspectionId }: NozzlesTabProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nozzleId: "",
    cmlNumber: "",
    serviceType: "",
    size: "",
    schedule: "",
    materialSpec: "",
    nominalThickness: "",
    previousThickness: "",
    actualThickness: "",
    minimumThickness: "",
    corrosionAllowance: "",
    corrosionRate: "",
    remainingLife: "",
    age: "",
    notes: "",
  });
  
  const utils = trpc.useUtils();
  const { data: nozzles, isLoading } = trpc.nozzle.getByInspection.useQuery({ inspectionId });
  
  const createMutation = trpc.nozzle.create.useMutation({
    onSuccess: () => {
      toast.success("Nozzle added");
      setIsAddDialogOpen(false);
      resetForm();
      utils.nozzle.getByInspection.invalidate({ inspectionId });
    },
    onError: (error) => toast.error(`Failed to add: ${error.message}`),
  });
  
  const updateMutation = trpc.nozzle.update.useMutation({
    onSuccess: () => {
      toast.success("Nozzle updated");
      setEditingId(null);
      resetForm();
      utils.nozzle.getByInspection.invalidate({ inspectionId });
    },
    onError: (error) => toast.error(`Failed to update: ${error.message}`),
  });
  
  const deleteMutation = trpc.nozzle.delete.useMutation({
    onSuccess: () => {
      toast.success("Nozzle deleted");
      utils.nozzle.getByInspection.invalidate({ inspectionId });
    },
    onError: (error) => toast.error(`Failed to delete: ${error.message}`),
  });
  
  const resetForm = () => {
    setFormData({
      nozzleId: "",
      cmlNumber: "",
      serviceType: "",
      size: "",
      schedule: "",
      materialSpec: "",
      nominalThickness: "",
      previousThickness: "",
      actualThickness: "",
      minimumThickness: "",
      corrosionAllowance: "",
      corrosionRate: "",
      remainingLife: "",
      age: "",
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
  
  const handleEdit = (nozzle: typeof nozzles extends (infer T)[] | undefined ? T : never) => {
    if (!nozzle) return;
    setEditingId(nozzle.id);
    setFormData({
      nozzleId: nozzle.nozzleId || "",
      cmlNumber: nozzle.cmlNumber || "",
      serviceType: nozzle.serviceType || "",
      size: nozzle.size || "",
      schedule: nozzle.schedule || "",
      materialSpec: nozzle.materialSpec || "",
      nominalThickness: nozzle.nominalThickness || "",
      previousThickness: nozzle.previousThickness || "",
      actualThickness: nozzle.actualThickness || "",
      minimumThickness: nozzle.minimumThickness || "",
      corrosionAllowance: nozzle.corrosionAllowance || "",
      corrosionRate: nozzle.corrosionRate || "",
      remainingLife: nozzle.remainingLife || "",
      age: nozzle.age || "",
      notes: nozzle.notes || "",
    });
    setIsAddDialogOpen(true);
  };
  
  const getStatusBadge = (status: string | null) => {
    if (!status) return null;
    switch (status.toLowerCase()) {
      case 'acceptable':
        return <Badge className="bg-green-100 text-green-800">Acceptable</Badge>;
      case 'marginal':
        return <Badge className="bg-yellow-100 text-yellow-800">Marginal</Badge>;
      case 'unacceptable':
        return <Badge variant="destructive">Unacceptable</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Nozzle Evaluations</h2>
          <p className="text-gray-600">ASME B31.3 nozzle thickness analysis</p>
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
              Add Nozzle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Nozzle" : "Add Nozzle"}</DialogTitle>
              <DialogDescription>
                Enter nozzle details and thickness measurements
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Nozzle ID</Label>
                  <Input value={formData.nozzleId} onChange={(e) => setFormData(p => ({ ...p, nozzleId: e.target.value }))} placeholder="e.g., N1" />
                </div>
                <div className="space-y-2">
                  <Label>CML Number</Label>
                  <Input value={formData.cmlNumber} onChange={(e) => setFormData(p => ({ ...p, cmlNumber: e.target.value }))} placeholder="e.g., 10" />
                </div>
                <div className="space-y-2">
                  <Label>Service Type</Label>
                  <Select value={formData.serviceType} onValueChange={(v) => setFormData(p => ({ ...p, serviceType: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      {NOZZLE_SERVICE_TYPES.map(st => (
                        <SelectItem key={st} value={st}>{st}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Size (inches)</Label>
                  <Input value={formData.size} onChange={(e) => setFormData(p => ({ ...p, size: e.target.value }))} placeholder='e.g., 2"' />
                </div>
                <div className="space-y-2">
                  <Label>Schedule</Label>
                  <Input value={formData.schedule} onChange={(e) => setFormData(p => ({ ...p, schedule: e.target.value }))} placeholder="e.g., 40" />
                </div>
                <div className="space-y-2">
                  <Label>Material Spec</Label>
                  <Input value={formData.materialSpec} onChange={(e) => setFormData(p => ({ ...p, materialSpec: e.target.value }))} placeholder="e.g., SA-106 Gr. B" />
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
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Corrosion Rate (ipy)</Label>
                  <Input value={formData.corrosionRate} onChange={(e) => setFormData(p => ({ ...p, corrosionRate: e.target.value }))} placeholder="0.0000" />
                </div>
                <div className="space-y-2">
                  <Label>Remaining Life (years)</Label>
                  <Input value={formData.remainingLife} onChange={(e) => setFormData(p => ({ ...p, remainingLife: e.target.value }))} placeholder="0.0" />
                </div>
                <div className="space-y-2">
                  <Label>Age (years)</Label>
                  <Input value={formData.age} onChange={(e) => setFormData(p => ({ ...p, age: e.target.value }))} placeholder="0" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {editingId ? "Update" : "Add"} Nozzle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {nozzles && nozzles.length > 0 ? (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CML</TableHead>
                  <TableHead>Nozzle ID</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Nominal</TableHead>
                  <TableHead>Previous</TableHead>
                  <TableHead>Actual</TableHead>
                  <TableHead>Minimum</TableHead>
                  <TableHead>CR (ipy)</TableHead>
                  <TableHead>RL (yrs)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nozzles.map((nozzle) => (
                  <TableRow key={nozzle.id}>
                    <TableCell className="font-medium">{nozzle.cmlNumber}</TableCell>
                    <TableCell>{nozzle.nozzleId}</TableCell>
                    <TableCell>{nozzle.serviceType}</TableCell>
                    <TableCell>{nozzle.size}</TableCell>
                    <TableCell>{nozzle.nominalThickness}</TableCell>
                    <TableCell>{nozzle.previousThickness}</TableCell>
                    <TableCell className="font-medium">{nozzle.actualThickness}</TableCell>
                    <TableCell>{nozzle.minimumThickness}</TableCell>
                    <TableCell>{nozzle.corrosionRate}</TableCell>
                    <TableCell>{nozzle.remainingLife}</TableCell>
                    <TableCell>{getStatusBadge(nozzle.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(nozzle)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate({ id: nozzle.id })}>
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
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-gray-600 mb-4">No nozzles recorded yet.</p>
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add First Nozzle
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
