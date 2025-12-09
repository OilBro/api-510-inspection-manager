import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, FileText, Calendar, Building2, Gauge } from "lucide-react";
import { format } from "date-fns";

export default function Inspections() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: inspections, isLoading } = trpc.inspection.list.useQuery();
  
  const filteredInspections = inspections?.filter(inspection => {
    const query = searchQuery.toLowerCase();
    return (
      inspection.vesselTagNumber?.toLowerCase().includes(query) ||
      inspection.vesselName?.toLowerCase().includes(query) ||
      inspection.manufacturer?.toLowerCase().includes(query) ||
      inspection.clientName?.toLowerCase().includes(query)
    );
  });
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };
  
  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inspections</h1>
          <p className="text-gray-600 mt-1">Manage pressure vessel inspections</p>
        </div>
        <Button onClick={() => setLocation("/inspections/new")} className="gap-2">
          <Plus className="h-4 w-4" />
          New Inspection
        </Button>
      </div>
      
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by vessel tag, name, manufacturer, or client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredInspections && filteredInspections.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredInspections.map((inspection) => (
            <Link key={inspection.id} href={`/inspections/${inspection.id}`}>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {inspection.vesselTagNumber || 'Unnamed Vessel'}
                      </CardTitle>
                      <CardDescription>
                        {inspection.vesselName || 'No description'}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(inspection.status)}>
                      {inspection.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building2 className="h-4 w-4" />
                    <span>{inspection.manufacturer || 'Unknown manufacturer'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Gauge className="h-4 w-4" />
                    <span>
                      {inspection.designPressure ? `${inspection.designPressure} psi` : 'N/A'} / 
                      {inspection.designTemperature ? ` ${inspection.designTemperature}°F` : ' N/A'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {inspection.inspectionDate 
                        ? format(new Date(inspection.inspectionDate), 'MMM d, yyyy')
                        : 'No date set'}
                    </span>
                  </div>
                  {inspection.clientName && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FileText className="h-4 w-4" />
                      <span>{inspection.clientName}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No inspections found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery 
                ? "No inspections match your search criteria."
                : "Get started by creating your first inspection."}
            </p>
            {!searchQuery && (
              <Button onClick={() => setLocation("/inspections/new")} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Inspection
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
