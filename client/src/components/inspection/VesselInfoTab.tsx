import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, Edit2, X } from "lucide-react";
import { JOINT_EFFICIENCY_MAP, RADIOGRAPHY_TYPES } from "@shared/api510Types";
import type { Inspection } from "@shared/types";

interface VesselInfoTabProps {
  inspection: Inspection;
  onUpdate: () => void;
}

export default function VesselInfoTab({ inspection, onUpdate }: VesselInfoTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    vesselTagNumber: inspection.vesselTagNumber || "",
    vesselName: inspection.vesselName || "",
    manufacturer: inspection.manufacturer || "",
    serialNumber: inspection.serialNumber || "",
    yearBuilt: inspection.yearBuilt || "",
    nationalBoardNumber: inspection.nationalBoardNumber || "",
    designPressure: inspection.designPressure?.toString() || "",
    designTemperature: inspection.designTemperature?.toString() || "",
    mawp: inspection.mawp?.toString() || "",
    mdmt: inspection.mdmt?.toString() || "",
    operatingPressure: inspection.operatingPressure?.toString() || "",
    operatingTemperature: inspection.operatingTemperature?.toString() || "",
    materialSpec: inspection.materialSpec || "",
    allowableStress: inspection.allowableStress?.toString() || "",
    jointEfficiency: inspection.jointEfficiency || "0.85",
    radiographyType: inspection.radiographyType || "RT-2",
    insideDiameter: inspection.insideDiameter || "",
    shellLength: inspection.shellLength || "",
    nominalThickness: inspection.nominalThickness || "",
    corrosionAllowance: inspection.corrosionAllowance || "",
    vesselOrientation: inspection.vesselOrientation || "horizontal",
    headType: inspection.headType || "ellipsoidal",
    constructionCode: inspection.constructionCode || "ASME Section VIII Div. 1",
    vesselConfiguration: inspection.vesselConfiguration || "",
    insulationType: inspection.insulationType || "",
    productService: inspection.productService || "",
    specificGravity: inspection.specificGravity || "",
    inspectionDate: inspection.inspectionDate ? new Date(inspection.inspectionDate).toISOString().split('T')[0] : "",
    previousInspectionDate: inspection.previousInspectionDate ? new Date(inspection.previousInspectionDate).toISOString().split('T')[0] : "",
    inspectorName: inspection.inspectorName || "",
    clientName: inspection.clientName || "",
    reportNumber: inspection.reportNumber || "",
  });
  
  const { data: materials } = trpc.material.getAll.useQuery();
  
  const updateMutation = trpc.inspection.update.useMutation({
    onSuccess: () => {
      toast.success("Inspection updated");
      setIsEditing(false);
      onUpdate();
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });
  
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === "radiographyType") {
      const je = JOINT_EFFICIENCY_MAP[value as keyof typeof JOINT_EFFICIENCY_MAP];
      if (je) {
        setFormData(prev => ({ ...prev, jointEfficiency: je.toString() }));
      }
    }
  };
  
  const handleSave = () => {
    updateMutation.mutate({
      id: inspection.id,
      vesselTagNumber: formData.vesselTagNumber || undefined,
      vesselName: formData.vesselName || undefined,
      manufacturer: formData.manufacturer || undefined,
      serialNumber: formData.serialNumber || undefined,
      yearBuilt: formData.yearBuilt || undefined,
      nationalBoardNumber: formData.nationalBoardNumber || undefined,
      designPressure: formData.designPressure ? parseInt(formData.designPressure) : undefined,
      designTemperature: formData.designTemperature ? parseInt(formData.designTemperature) : undefined,
      mawp: formData.mawp ? parseInt(formData.mawp) : undefined,
      mdmt: formData.mdmt ? parseInt(formData.mdmt) : undefined,
      operatingPressure: formData.operatingPressure ? parseInt(formData.operatingPressure) : undefined,
      operatingTemperature: formData.operatingTemperature ? parseInt(formData.operatingTemperature) : undefined,
      materialSpec: formData.materialSpec || undefined,
      allowableStress: formData.allowableStress ? parseInt(formData.allowableStress) : undefined,
      jointEfficiency: formData.jointEfficiency || undefined,
      radiographyType: formData.radiographyType || undefined,
      insideDiameter: formData.insideDiameter || undefined,
      shellLength: formData.shellLength || undefined,
      nominalThickness: formData.nominalThickness || undefined,
      corrosionAllowance: formData.corrosionAllowance || undefined,
      vesselOrientation: formData.vesselOrientation || undefined,
      headType: formData.headType || undefined,
      constructionCode: formData.constructionCode || undefined,
      vesselConfiguration: formData.vesselConfiguration || undefined,
      insulationType: formData.insulationType || undefined,
      productService: formData.productService || undefined,
      specificGravity: formData.specificGravity || undefined,
      inspectionDate: formData.inspectionDate || undefined,
      previousInspectionDate: formData.previousInspectionDate || undefined,
      inspectorName: formData.inspectorName || undefined,
      clientName: formData.clientName || undefined,
      reportNumber: formData.reportNumber || undefined,
    });
  };
  
  const materialsByCategory = materials?.reduce((acc, m) => {
    const cat = m.materialCategory || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(m);
    return acc;
  }, {} as Record<string, typeof materials>);
  
  const InfoRow = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
    <div className="flex justify-between py-2 border-b border-gray-100">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium">{value || '-'}</span>
    </div>
  );
  
  if (!isEditing) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Vessel Identification</CardTitle>
              <CardDescription>Basic vessel information</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2">
              <Edit2 className="h-4 w-4" />
              Edit
            </Button>
          </CardHeader>
          <CardContent>
            <InfoRow label="Vessel Tag" value={inspection.vesselTagNumber} />
            <InfoRow label="Vessel Name" value={inspection.vesselName} />
            <InfoRow label="Manufacturer" value={inspection.manufacturer} />
            <InfoRow label="Serial Number" value={inspection.serialNumber} />
            <InfoRow label="Year Built" value={inspection.yearBuilt} />
            <InfoRow label="National Board #" value={inspection.nationalBoardNumber} />
            <InfoRow label="Client" value={inspection.clientName} />
            <InfoRow label="Product/Service" value={inspection.productService} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Design Parameters</CardTitle>
            <CardDescription>Pressure and temperature ratings</CardDescription>
          </CardHeader>
          <CardContent>
            <InfoRow label="Design Pressure" value={inspection.designPressure ? `${inspection.designPressure} psi` : null} />
            <InfoRow label="Design Temperature" value={inspection.designTemperature ? `${inspection.designTemperature}°F` : null} />
            <InfoRow label="MAWP" value={inspection.mawp ? `${inspection.mawp} psi` : null} />
            <InfoRow label="MDMT" value={inspection.mdmt ? `${inspection.mdmt}°F` : null} />
            <InfoRow label="Material Spec" value={inspection.materialSpec} />
            <InfoRow label="Allowable Stress" value={inspection.allowableStress ? `${inspection.allowableStress} psi` : null} />
            <InfoRow label="Joint Efficiency" value={inspection.jointEfficiency} />
            <InfoRow label="Radiography Type" value={inspection.radiographyType} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Vessel Geometry</CardTitle>
            <CardDescription>Physical dimensions</CardDescription>
          </CardHeader>
          <CardContent>
            <InfoRow label="Inside Diameter" value={inspection.insideDiameter ? `${inspection.insideDiameter}"` : null} />
            <InfoRow label="Shell Length" value={inspection.shellLength ? `${inspection.shellLength}"` : null} />
            <InfoRow label="Nominal Thickness" value={inspection.nominalThickness ? `${inspection.nominalThickness}"` : null} />
            <InfoRow label="Corrosion Allowance" value={inspection.corrosionAllowance ? `${inspection.corrosionAllowance}"` : null} />
            <InfoRow label="Orientation" value={inspection.vesselOrientation} />
            <InfoRow label="Head Type" value={inspection.headType} />
            <InfoRow label="Construction Code" value={inspection.constructionCode} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Inspection Details</CardTitle>
            <CardDescription>Inspection dates and personnel</CardDescription>
          </CardHeader>
          <CardContent>
            <InfoRow label="Inspection Date" value={inspection.inspectionDate ? new Date(inspection.inspectionDate).toLocaleDateString() : null} />
            <InfoRow label="Previous Inspection" value={inspection.previousInspectionDate ? new Date(inspection.previousInspectionDate).toLocaleDateString() : null} />
            <InfoRow label="Inspector" value={inspection.inspectorName} />
            <InfoRow label="Report Number" value={inspection.reportNumber} />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Edit Vessel Information</CardTitle>
          <CardDescription>Update vessel data and inspection parameters</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} className="gap-2">
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending} className="gap-2">
            <Save className="h-4 w-4" />
            {updateMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Identification */}
          <div className="space-y-4">
            <h3 className="font-semibold">Identification</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vessel Tag Number</Label>
                <Input value={formData.vesselTagNumber} onChange={(e) => handleChange("vesselTagNumber", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Vessel Name</Label>
                <Input value={formData.vesselName} onChange={(e) => handleChange("vesselName", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Manufacturer</Label>
                <Input value={formData.manufacturer} onChange={(e) => handleChange("manufacturer", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Serial Number</Label>
                <Input value={formData.serialNumber} onChange={(e) => handleChange("serialNumber", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Year Built</Label>
                <Input value={formData.yearBuilt} onChange={(e) => handleChange("yearBuilt", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Client Name</Label>
                <Input value={formData.clientName} onChange={(e) => handleChange("clientName", e.target.value)} />
              </div>
            </div>
          </div>
          
          {/* Design Parameters */}
          <div className="space-y-4">
            <h3 className="font-semibold">Design Parameters</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Design Pressure (psi)</Label>
                <Input type="number" value={formData.designPressure} onChange={(e) => handleChange("designPressure", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Design Temperature (°F)</Label>
                <Input type="number" value={formData.designTemperature} onChange={(e) => handleChange("designTemperature", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>MAWP (psi)</Label>
                <Input type="number" value={formData.mawp} onChange={(e) => handleChange("mawp", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Material Specification</Label>
                <Select value={formData.materialSpec} onValueChange={(v) => handleChange("materialSpec", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    {materialsByCategory && Object.entries(materialsByCategory).map(([category, mats]) => (
                      <div key={category}>
                        <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">
                          {category.replace('_', ' ')}
                        </div>
                        {mats?.map(m => (
                          <SelectItem key={m.materialSpec} value={m.materialSpec}>
                            {m.materialSpec}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Allowable Stress (psi)</Label>
                <Input type="number" value={formData.allowableStress} onChange={(e) => handleChange("allowableStress", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Radiography Type</Label>
                <Select value={formData.radiographyType} onValueChange={(v) => handleChange("radiographyType", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RADIOGRAPHY_TYPES.map(rt => (
                      <SelectItem key={rt} value={rt}>
                        {rt} (E = {JOINT_EFFICIENCY_MAP[rt]})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Geometry */}
          <div className="space-y-4">
            <h3 className="font-semibold">Geometry</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Inside Diameter (in)</Label>
                <Input value={formData.insideDiameter} onChange={(e) => handleChange("insideDiameter", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Shell Length (in)</Label>
                <Input value={formData.shellLength} onChange={(e) => handleChange("shellLength", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Nominal Thickness (in)</Label>
                <Input value={formData.nominalThickness} onChange={(e) => handleChange("nominalThickness", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Head Type</Label>
                <Select value={formData.headType} onValueChange={(v) => handleChange("headType", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ellipsoidal">2:1 Ellipsoidal</SelectItem>
                    <SelectItem value="torispherical">Torispherical</SelectItem>
                    <SelectItem value="hemispherical">Hemispherical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Inspection Details */}
          <div className="space-y-4">
            <h3 className="font-semibold">Inspection Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Inspection Date</Label>
                <Input type="date" value={formData.inspectionDate} onChange={(e) => handleChange("inspectionDate", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Previous Inspection Date</Label>
                <Input type="date" value={formData.previousInspectionDate} onChange={(e) => handleChange("previousInspectionDate", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Inspector Name</Label>
                <Input value={formData.inspectorName} onChange={(e) => handleChange("inspectorName", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Report Number</Label>
                <Input value={formData.reportNumber} onChange={(e) => handleChange("reportNumber", e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
