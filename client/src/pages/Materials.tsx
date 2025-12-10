import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, Calculator, Database, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function Materials() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [lookupMaterial, setLookupMaterial] = useState("");
  const [lookupTemperature, setLookupTemperature] = useState("");
  
  const { data: materials, isLoading } = trpc.material.getAll.useQuery();
  
  const lookupQuery = trpc.material.getStressValue.useQuery(
    { materialSpec: lookupMaterial, temperature: parseInt(lookupTemperature) || 200 },
    { enabled: !!lookupMaterial && !!lookupTemperature }
  );
  
  // Get unique categories
  const categories = materials 
    ? Array.from(new Set(materials.map(m => m.materialCategory).filter(Boolean)))
    : [];
  
  // Filter materials
  const filteredMaterials = materials?.filter(m => {
    const matchesSearch = !searchTerm || 
      m.materialSpec.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.materialCategory?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || m.materialCategory === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  
  // Get unique materials for display
  const uniqueMaterials = filteredMaterials?.reduce((acc, m) => {
    if (!acc.find(x => x.materialSpec === m.materialSpec)) {
      acc.push(m);
    }
    return acc;
  }, [] as typeof filteredMaterials) || [];
  
  const materialList = uniqueMaterials;
  
  if (isLoading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => setLocation("/inspections")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Material Stress Lookup</h1>
          <p className="text-gray-600">
            ASME Section II Part D allowable stress values for 187+ materials
          </p>
        </div>
      </div>
      
      {/* Stress Lookup Calculator */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Allowable Stress Calculator
          </CardTitle>
          <CardDescription>
            Look up allowable stress for a specific material and temperature with linear interpolation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Material Specification</Label>
              <Select value={lookupMaterial} onValueChange={setLookupMaterial}>
                <SelectTrigger>
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent>
                  {materialList.map(m => (
                    <SelectItem key={m.materialSpec} value={m.materialSpec}>
                      {m.materialSpec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Temperature (°F)</Label>
              <Input
                type="number"
                value={lookupTemperature}
                onChange={(e) => setLookupTemperature(e.target.value)}
                placeholder="e.g., 450"
              />
            </div>
            <div className="space-y-2">
              <Label>Allowable Stress (psi)</Label>
              <div className="h-10 flex items-center px-3 bg-gray-100 rounded-md font-mono text-lg">
                {lookupQuery.isLoading ? (
                  <span className="text-gray-400">Loading...</span>
                ) : lookupQuery.data?.allowableStress ? (
                  <span className="text-green-700 font-bold">
                    {lookupQuery.data.allowableStress.toLocaleString()}
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Interpolation</Label>
              <div className="h-10 flex items-center px-3 bg-gray-100 rounded-md text-sm">
                {lookupQuery.data?.allowableStress ? (
                  <Badge variant="outline">Calculated</Badge>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Material Database */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Material Database
          </CardTitle>
          <CardDescription>
            {materials?.length || 0} stress values across {materialList.length} materials
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search materials..."
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat || ''} className="capitalize">
                    {cat?.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material Specification</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Temperature Range</TableHead>
                <TableHead>Stress Range (psi)</TableHead>
                <TableHead>Data Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materialList.slice(0, 50).map((m) => (
                  <TableRow key={m.materialSpec}>
                    <TableCell className="font-medium">{m.materialSpec}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {m.materialCategory?.replace('_', ' ') || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell>-100°F - 1000°F</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          
          {materialList.length > 50 && (
            <p className="text-center text-gray-500 mt-4">
              Showing 50 of {materialList.length} materials. Use search to find specific materials.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
