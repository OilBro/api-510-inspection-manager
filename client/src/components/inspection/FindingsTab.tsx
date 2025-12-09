import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, AlertTriangle, AlertCircle, Info, Eye } from "lucide-react";
import { FINDING_SEVERITY, RECOMMENDATION_PRIORITY } from "@shared/api510Types";

interface FindingsTabProps {
  inspectionId: number;
}

export default function FindingsTab({ inspectionId }: FindingsTabProps) {
  const [isFindingDialogOpen, setIsFindingDialogOpen] = useState(false);
  const [isRecommendationDialogOpen, setIsRecommendationDialogOpen] = useState(false);
  const [editingFindingId, setEditingFindingId] = useState<number | null>(null);
  const [editingRecommendationId, setEditingRecommendationId] = useState<number | null>(null);
  
  const [findingForm, setFindingForm] = useState({
    findingNumber: "",
    category: "",
    severity: "observation" as typeof FINDING_SEVERITY[number],
    description: "",
    location: "",
  });
  
  const [recommendationForm, setRecommendationForm] = useState({
    recommendationNumber: "",
    priority: "medium" as typeof RECOMMENDATION_PRIORITY[number],
    description: "",
    dueDate: "",
  });
  
  const utils = trpc.useUtils();
  const { data: findings, isLoading: findingsLoading } = trpc.findings.getByInspection.useQuery({ inspectionId });
  const { data: recommendations, isLoading: recommendationsLoading } = trpc.recommendations.getByInspection.useQuery({ inspectionId });
  
  // Findings mutations
  const createFindingMutation = trpc.findings.create.useMutation({
    onSuccess: () => {
      toast.success("Finding added");
      setIsFindingDialogOpen(false);
      resetFindingForm();
      utils.findings.getByInspection.invalidate({ inspectionId });
    },
    onError: (error) => toast.error(`Failed: ${error.message}`),
  });
  
  const updateFindingMutation = trpc.findings.update.useMutation({
    onSuccess: () => {
      toast.success("Finding updated");
      setIsFindingDialogOpen(false);
      setEditingFindingId(null);
      resetFindingForm();
      utils.findings.getByInspection.invalidate({ inspectionId });
    },
    onError: (error) => toast.error(`Failed: ${error.message}`),
  });
  
  const deleteFindingMutation = trpc.findings.delete.useMutation({
    onSuccess: () => {
      toast.success("Finding deleted");
      utils.findings.getByInspection.invalidate({ inspectionId });
    },
    onError: (error) => toast.error(`Failed: ${error.message}`),
  });
  
  // Recommendations mutations
  const createRecommendationMutation = trpc.recommendations.create.useMutation({
    onSuccess: () => {
      toast.success("Recommendation added");
      setIsRecommendationDialogOpen(false);
      resetRecommendationForm();
      utils.recommendations.getByInspection.invalidate({ inspectionId });
    },
    onError: (error) => toast.error(`Failed: ${error.message}`),
  });
  
  const updateRecommendationMutation = trpc.recommendations.update.useMutation({
    onSuccess: () => {
      toast.success("Recommendation updated");
      setIsRecommendationDialogOpen(false);
      setEditingRecommendationId(null);
      resetRecommendationForm();
      utils.recommendations.getByInspection.invalidate({ inspectionId });
    },
    onError: (error) => toast.error(`Failed: ${error.message}`),
  });
  
  const deleteRecommendationMutation = trpc.recommendations.delete.useMutation({
    onSuccess: () => {
      toast.success("Recommendation deleted");
      utils.recommendations.getByInspection.invalidate({ inspectionId });
    },
    onError: (error) => toast.error(`Failed: ${error.message}`),
  });
  
  const resetFindingForm = () => {
    setFindingForm({
      findingNumber: "",
      category: "",
      severity: "observation",
      description: "",
      location: "",
    });
  };
  
  const resetRecommendationForm = () => {
    setRecommendationForm({
      recommendationNumber: "",
      priority: "medium",
      description: "",
      dueDate: "",
    });
  };
  
  const handleSubmitFinding = () => {
    if (editingFindingId) {
      updateFindingMutation.mutate({
        id: editingFindingId,
        findingNumber: findingForm.findingNumber ? parseInt(findingForm.findingNumber) : undefined,
        category: findingForm.category || undefined,
        severity: findingForm.severity,
        description: findingForm.description || undefined,
        location: findingForm.location || undefined,
      });
    } else {
      createFindingMutation.mutate({
        inspectionId,
        findingNumber: findingForm.findingNumber ? parseInt(findingForm.findingNumber) : undefined,
        category: findingForm.category || undefined,
        severity: findingForm.severity,
        description: findingForm.description || undefined,
        location: findingForm.location || undefined,
      });
    }
  };
  
  const handleSubmitRecommendation = () => {
    if (editingRecommendationId) {
      updateRecommendationMutation.mutate({
        id: editingRecommendationId,
        recommendationNumber: recommendationForm.recommendationNumber ? parseInt(recommendationForm.recommendationNumber) : undefined,
        priority: recommendationForm.priority,
        description: recommendationForm.description || undefined,
        dueDate: recommendationForm.dueDate || undefined,
      });
    } else {
      createRecommendationMutation.mutate({
        inspectionId,
        recommendationNumber: recommendationForm.recommendationNumber ? parseInt(recommendationForm.recommendationNumber) : undefined,
        priority: recommendationForm.priority,
        description: recommendationForm.description || undefined,
        dueDate: recommendationForm.dueDate || undefined,
      });
    }
  };
  
  const getSeverityBadge = (severity: string | null) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Critical</Badge>;
      case 'major':
        return <Badge className="bg-orange-100 text-orange-800 gap-1"><AlertCircle className="h-3 w-3" /> Major</Badge>;
      case 'minor':
        return <Badge className="bg-yellow-100 text-yellow-800 gap-1"><Info className="h-3 w-3" /> Minor</Badge>;
      default:
        return <Badge variant="outline" className="gap-1"><Eye className="h-3 w-3" /> Observation</Badge>;
    }
  };
  
  const getPriorityBadge = (priority: string | null) => {
    switch (priority) {
      case 'immediate':
        return <Badge variant="destructive">Immediate</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      default:
        return <Badge variant="outline">Low</Badge>;
    }
  };
  
  if (findingsLoading || recommendationsLoading) {
    return <Skeleton className="h-64 w-full" />;
  }
  
  return (
    <div className="space-y-6">
      {/* Findings Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Inspection Findings</CardTitle>
            <CardDescription>Document issues and observations</CardDescription>
          </div>
          <Dialog open={isFindingDialogOpen} onOpenChange={(open) => {
            setIsFindingDialogOpen(open);
            if (!open) {
              setEditingFindingId(null);
              resetFindingForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Finding
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingFindingId ? "Edit Finding" : "Add Finding"}</DialogTitle>
                <DialogDescription>Document an inspection finding</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Finding Number</Label>
                    <Input
                      type="number"
                      value={findingForm.findingNumber}
                      onChange={(e) => setFindingForm(p => ({ ...p, findingNumber: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Severity</Label>
                    <Select value={findingForm.severity} onValueChange={(v) => setFindingForm(p => ({ ...p, severity: v as typeof FINDING_SEVERITY[number] }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FINDING_SEVERITY.map(s => (
                          <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Input
                      value={findingForm.category}
                      onChange={(e) => setFindingForm(p => ({ ...p, category: e.target.value }))}
                      placeholder="e.g., Corrosion, Mechanical Damage"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      value={findingForm.location}
                      onChange={(e) => setFindingForm(p => ({ ...p, location: e.target.value }))}
                      placeholder="e.g., Shell, 6 o'clock"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={findingForm.description}
                    onChange={(e) => setFindingForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Describe the finding in detail..."
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsFindingDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmitFinding} disabled={createFindingMutation.isPending || updateFindingMutation.isPending}>
                  {editingFindingId ? "Update" : "Add"} Finding
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {findings && findings.length > 0 ? (
            <div className="space-y-4">
              {findings.map((finding) => (
                <div key={finding.id} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">#{finding.findingNumber}</span>
                      {getSeverityBadge(finding.severity)}
                      {finding.category && <Badge variant="outline">{finding.category}</Badge>}
                    </div>
                    <p className="text-gray-700">{finding.description}</p>
                    {finding.location && (
                      <p className="text-sm text-gray-500">Location: {finding.location}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => {
                      setEditingFindingId(finding.id);
                      setFindingForm({
                        findingNumber: finding.findingNumber?.toString() || "",
                        category: finding.category || "",
                        severity: (finding.severity as typeof FINDING_SEVERITY[number]) || "observation",
                        description: finding.description || "",
                        location: finding.location || "",
                      });
                      setIsFindingDialogOpen(true);
                    }}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteFindingMutation.mutate({ id: finding.id })}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No findings recorded.</p>
          )}
        </CardContent>
      </Card>
      
      {/* Recommendations Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recommendations</CardTitle>
            <CardDescription>Actions to address findings</CardDescription>
          </div>
          <Dialog open={isRecommendationDialogOpen} onOpenChange={(open) => {
            setIsRecommendationDialogOpen(open);
            if (!open) {
              setEditingRecommendationId(null);
              resetRecommendationForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Recommendation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingRecommendationId ? "Edit Recommendation" : "Add Recommendation"}</DialogTitle>
                <DialogDescription>Add an action recommendation</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Recommendation Number</Label>
                    <Input
                      type="number"
                      value={recommendationForm.recommendationNumber}
                      onChange={(e) => setRecommendationForm(p => ({ ...p, recommendationNumber: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={recommendationForm.priority} onValueChange={(v) => setRecommendationForm(p => ({ ...p, priority: v as typeof RECOMMENDATION_PRIORITY[number] }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RECOMMENDATION_PRIORITY.map(p => (
                          <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={recommendationForm.dueDate}
                    onChange={(e) => setRecommendationForm(p => ({ ...p, dueDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={recommendationForm.description}
                    onChange={(e) => setRecommendationForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Describe the recommended action..."
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsRecommendationDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmitRecommendation} disabled={createRecommendationMutation.isPending || updateRecommendationMutation.isPending}>
                  {editingRecommendationId ? "Update" : "Add"} Recommendation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {recommendations && recommendations.length > 0 ? (
            <div className="space-y-4">
              {recommendations.map((rec) => (
                <div key={rec.id} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">#{rec.recommendationNumber}</span>
                      {getPriorityBadge(rec.priority)}
                      {rec.dueDate && (
                        <span className="text-sm text-gray-500">
                          Due: {new Date(rec.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700">{rec.description}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => {
                      setEditingRecommendationId(rec.id);
                      setRecommendationForm({
                        recommendationNumber: rec.recommendationNumber?.toString() || "",
                        priority: (rec.priority as typeof RECOMMENDATION_PRIORITY[number]) || "medium",
                        description: rec.description || "",
                        dueDate: rec.dueDate ? new Date(rec.dueDate).toISOString().split('T')[0] : "",
                      });
                      setIsRecommendationDialogOpen(true);
                    }}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteRecommendationMutation.mutate({ id: rec.id })}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No recommendations recorded.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
