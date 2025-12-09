import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import { JOINT_EFFICIENCY_MAP, RADIOGRAPHY_TYPES } from "@shared/api510Types";

export default function NewInspection() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  
  const [formData, setFormData] = useState({
    vesselTagNumber: "",
    vesselName: "",
    manufacturer: "",
    serialNumber: "",
    yearBuilt: "",
    nationalBoardNumber: "",
    designPressure: "",
    designTemperature: "",
    mawp: "",
    mdmt: "",
    operatingPressure: "",
    operatingTemperature: "",
    materialSpec: "",
    allowableStress: "",
    jointEfficiency: "0.85",
    radiographyType: "RT-2",
    insideDiameter: "",
    shellLength: "",
    nominalThickness: "",
    corrosionAllowance: "",
    vesselOrientation: "horizontal",
    headType: "ellipsoidal",
    constructionCode: "ASME Section VIII Div. 1",
    vesselConfiguration: "",
    insulationType: "",
    productService: "",
    specificGravity: "",
    inspectionDate: "",
    previousInspectionDate: "",
    inspectorName: "",
    clientName: "",
    reportNumber: "",
  });
  
  const { data: materials } = trpc.material.getAll.useQuery();
  
  const createMutation = trpc.inspection.create.useMutation({
    onSuccess: (data) => {
      toast.success("Inspection created successfully");
      utils.inspection.list.invalidate();
      setLocation(`/inspections/${data.id}`);
    },
    onError: (error) => {
      toast.error(`Failed to create inspection: ${error.message}`);
    },
  });
  
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-populate joint efficiency based on radiography type
    if (field === "radiographyType") {
      const je = JOINT_EFFICIENCY_MAP[value as keyof typeof JOINT_EFFICIENCY_MAP];
      if (je) {
        setFormData(prev => ({ ...prev, jointEfficiency: je.toString() }));
      }
    }
  };
  
  const stressQuery = trpc.material.getStressValue.useQuery(
    { materialSpec: formData.materialSpec, temperature: parseInt(formData.designTemperature) || 200 },
    { enabled: !!formData.materialSpec && !!formData.designTemperature }
  );
  
  const handleMaterialChange = (materialSpec: string) => {
    setFormData(prev => ({ ...prev, materialSpec }));
  };
  
  // Auto-populate allowable stress when stress query returns
  useEffect(() => {
    if (stressQuery.data?.allowableStress && formData.materialSpec) {
      setFormData(prev => ({ ...prev, allowableStress: stressQuery.data!.allowableStress!.toString() }));
    }
  }, [stressQuery.data, formData.materialSpec]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    createMutation.mutate({
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
  
  // Group materials by category
  const materialsByCategory = materials?.reduce((acc, m) => {
    const cat = m.materialCategory || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(m);
    return acc;
  }, {} as Record<string, typeof materials>);
  
  return (
    <div className="container py-8 max-w-4xl">
      <Button variant="ghost" onClick={() => setLocation("/inspections")} className="mb-4 gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Inspections
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle>New Inspection</CardTitle>
          <CardDescription>
            Create a new pressure vessel inspection record
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="identification" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="identification">Identification</TabsTrigger>
                <TabsTrigger value="design">Design Parameters</TabsTrigger>
                <TabsTrigger value="geometry">Geometry</TabsTrigger>
                <TabsTrigger value="inspection">Inspection</TabsTrigger>
              </TabsList>
              
              <TabsContent value="identification" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vesselTagNumber">Vessel Tag Number *</Label>
                    <Input
                      id="vesselTagNumber"
                      value={formData.vesselTagNumber}
                      onChange={(e) => handleChange("vesselTagNumber", e.target.value)}
                      placeholder="e.g., 54-11-067"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vesselName">Vessel Name</Label>
                    <Input
                      id="vesselName"
                      value={formData.vesselName}
                      onChange={(e) => handleChange("vesselName", e.target.value)}
                      placeholder="e.g., Reactor Feed Tank"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="manufacturer">Manufacturer</Label>
                    <Input
                      id="manufacturer"
                      value={formData.manufacturer}
                      onChange={(e) => handleChange("manufacturer", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serialNumber">Serial Number</Label>
                    <Input
                      id="serialNumber"
                      value={formData.serialNumber}
                      onChange={(e) => handleChange("serialNumber", e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="yearBuilt">Year Built</Label>
                    <Input
                      id="yearBuilt"
                      value={formData.yearBuilt}
                      onChange={(e) => handleChange("yearBuilt", e.target.value)}
                      placeholder="e.g., 2010"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nationalBoardNumber">National Board Number</Label>
                    <Input
                      id="nationalBoardNumber"
                      value={formData.nationalBoardNumber}
                      onChange={(e) => handleChange("nationalBoardNumber", e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientName">Client Name</Label>
                    <Input
                      id="clientName"
                      value={formData.clientName}
                      onChange={(e) => handleChange("clientName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="productService">Product/Service</Label>
                    <Input
                      id="productService"
                      value={formData.productService}
                      onChange={(e) => handleChange("productService", e.target.value)}
                      placeholder="e.g., Crude Oil"
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="design" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="designPressure">Design Pressure (psi)</Label>
                    <Input
                      id="designPressure"
                      type="number"
                      value={formData.designPressure}
                      onChange={(e) => handleChange("designPressure", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="designTemperature">Design Temperature (°F)</Label>
                    <Input
                      id="designTemperature"
                      type="number"
                      value={formData.designTemperature}
                      onChange={(e) => handleChange("designTemperature", e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mawp">MAWP (psi)</Label>
                    <Input
                      id="mawp"
                      type="number"
                      value={formData.mawp}
                      onChange={(e) => handleChange("mawp", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mdmt">MDMT (°F)</Label>
                    <Input
                      id="mdmt"
                      type="number"
                      value={formData.mdmt}
                      onChange={(e) => handleChange("mdmt", e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="materialSpec">Material Specification</Label>
                    <Select value={formData.materialSpec} onValueChange={handleMaterialChange}>
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
                    <Label htmlFor="allowableStress">Allowable Stress (psi)</Label>
                    <Input
                      id="allowableStress"
                      type="number"
                      value={formData.allowableStress}
                      onChange={(e) => handleChange("allowableStress", e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="radiographyType">Radiography Type</Label>
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
                  <div className="space-y-2">
                    <Label htmlFor="jointEfficiency">Joint Efficiency</Label>
                    <Input
                      id="jointEfficiency"
                      value={formData.jointEfficiency}
                      onChange={(e) => handleChange("jointEfficiency", e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="specificGravity">Specific Gravity</Label>
                    <Input
                      id="specificGravity"
                      value={formData.specificGravity}
                      onChange={(e) => handleChange("specificGravity", e.target.value)}
                      placeholder="e.g., 0.85"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="constructionCode">Construction Code</Label>
                    <Input
                      id="constructionCode"
                      value={formData.constructionCode}
                      onChange={(e) => handleChange("constructionCode", e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="geometry" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="insideDiameter">Inside Diameter (inches)</Label>
                    <Input
                      id="insideDiameter"
                      value={formData.insideDiameter}
                      onChange={(e) => handleChange("insideDiameter", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shellLength">Shell Length (inches)</Label>
                    <Input
                      id="shellLength"
                      value={formData.shellLength}
                      onChange={(e) => handleChange("shellLength", e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nominalThickness">Nominal Thickness (inches)</Label>
                    <Input
                      id="nominalThickness"
                      value={formData.nominalThickness}
                      onChange={(e) => handleChange("nominalThickness", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="corrosionAllowance">Corrosion Allowance (inches)</Label>
                    <Input
                      id="corrosionAllowance"
                      value={formData.corrosionAllowance}
                      onChange={(e) => handleChange("corrosionAllowance", e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vesselOrientation">Vessel Orientation</Label>
                    <Select value={formData.vesselOrientation} onValueChange={(v) => handleChange("vesselOrientation", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="horizontal">Horizontal</SelectItem>
                        <SelectItem value="vertical">Vertical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="headType">Head Type</Label>
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
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="insulationType">Insulation Type</Label>
                    <Input
                      id="insulationType"
                      value={formData.insulationType}
                      onChange={(e) => handleChange("insulationType", e.target.value)}
                      placeholder="e.g., Mineral Wool"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vesselConfiguration">Vessel Configuration</Label>
                    <Input
                      id="vesselConfiguration"
                      value={formData.vesselConfiguration}
                      onChange={(e) => handleChange("vesselConfiguration", e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="inspection" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="inspectionDate">Inspection Date</Label>
                    <Input
                      id="inspectionDate"
                      type="date"
                      value={formData.inspectionDate}
                      onChange={(e) => handleChange("inspectionDate", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="previousInspectionDate">Previous Inspection Date</Label>
                    <Input
                      id="previousInspectionDate"
                      type="date"
                      value={formData.previousInspectionDate}
                      onChange={(e) => handleChange("previousInspectionDate", e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="inspectorName">Inspector Name</Label>
                    <Input
                      id="inspectorName"
                      value={formData.inspectorName}
                      onChange={(e) => handleChange("inspectorName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reportNumber">Report Number</Label>
                    <Input
                      id="reportNumber"
                      value={formData.reportNumber}
                      onChange={(e) => handleChange("reportNumber", e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end gap-4 mt-8 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setLocation("/inspections")}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} className="gap-2">
                <Save className="h-4 w-4" />
                {createMutation.isPending ? "Creating..." : "Create Inspection"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
