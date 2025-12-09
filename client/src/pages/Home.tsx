import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { 
  ClipboardCheck, 
  Calculator, 
  FileText, 
  Database, 
  Upload, 
  Camera,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  Plus
} from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  
  const { data: inspections } = trpc.inspection.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  
  // Calculate stats
  const totalInspections = inspections?.length || 0;
  const completedInspections = inspections?.filter((i: { status: string }) => i.status === 'completed').length || 0;
  const inProgressInspections = inspections?.filter((i: { status: string }) => i.status === 'in_progress').length || 0;
  const draftInspections = inspections?.filter((i: { status: string }) => i.status === 'draft').length || 0;
  
  // Get recent inspections
  const recentInspections = inspections?.slice(0, 5) || [];
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-6">
              <ClipboardCheck className="h-12 w-12 text-blue-400" />
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                API 510 Inspection Manager
              </h1>
            </div>
            <p className="text-xl text-blue-200 max-w-3xl mx-auto mb-8">
              Professional pressure vessel inspection management system with ASME Section VIII calculations, 
              AI-powered document parsing, and comprehensive compliance reporting.
            </p>
            <Button size="lg" onClick={() => window.location.href = getLoginUrl()} className="gap-2">
              Get Started
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Features Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            <Card className="bg-white/10 border-white/20 text-white">
              <CardHeader>
                <Calculator className="h-8 w-8 text-blue-400 mb-2" />
                <CardTitle>ASME Calculations</CardTitle>
                <CardDescription className="text-blue-200">
                  Accurate Section VIII formulas for t_min, MAWP, corrosion rates, and remaining life
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="bg-white/10 border-white/20 text-white">
              <CardHeader>
                <Upload className="h-8 w-8 text-green-400 mb-2" />
                <CardTitle>AI-Powered Import</CardTitle>
                <CardDescription className="text-blue-200">
                  Intelligent PDF/Excel parsing with LLM vision to extract vessel data automatically
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="bg-white/10 border-white/20 text-white">
              <CardHeader>
                <FileText className="h-8 w-8 text-purple-400 mb-2" />
                <CardTitle>Professional Reports</CardTitle>
                <CardDescription className="text-blue-200">
                  Generate comprehensive inspection reports with executive summaries and findings
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="bg-white/10 border-white/20 text-white">
              <CardHeader>
                <Database className="h-8 w-8 text-yellow-400 mb-2" />
                <CardTitle>Material Database</CardTitle>
                <CardDescription className="text-blue-200">
                  187+ materials with temperature-based stress values and linear interpolation
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="bg-white/10 border-white/20 text-white">
              <CardHeader>
                <Camera className="h-8 w-8 text-pink-400 mb-2" />
                <CardTitle>Photo Management</CardTitle>
                <CardDescription className="text-blue-200">
                  Upload and organize inspection photos with annotations and categorization
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="bg-white/10 border-white/20 text-white">
              <CardHeader>
                <AlertTriangle className="h-8 w-8 text-orange-400 mb-2" />
                <CardTitle>Validation Dashboard</CardTitle>
                <CardDescription className="text-blue-200">
                  Discrepancy detection with dual corrosion rate analysis and anomaly alerts
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    );
  }
  
  // Authenticated Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">API 510 Inspection Manager</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Welcome, {user?.name || 'User'}</span>
            <Button variant="outline" onClick={() => setLocation("/materials")}>
              <Database className="h-4 w-4 mr-2" />
              Materials
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Inspections</CardDescription>
              <CardTitle className="text-3xl">{totalInspections}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1 text-green-700">
                <CheckCircle className="h-4 w-4" /> Completed
              </CardDescription>
              <CardTitle className="text-3xl text-green-700">{completedInspections}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1 text-blue-700">
                <Clock className="h-4 w-4" /> In Progress
              </CardDescription>
              <CardTitle className="text-3xl text-blue-700">{inProgressInspections}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-gray-200 bg-gray-50">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1 text-gray-600">
                <FileText className="h-4 w-4" /> Drafts
              </CardDescription>
              <CardTitle className="text-3xl text-gray-600">{draftInspections}</CardTitle>
            </CardHeader>
          </Card>
        </div>
        
        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Button 
            size="lg" 
            className="h-auto py-6 flex-col gap-2"
            onClick={() => setLocation("/inspection/new")}
          >
            <Plus className="h-6 w-6" />
            New Inspection
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="h-auto py-6 flex-col gap-2"
            onClick={() => setLocation("/inspections")}
          >
            <ClipboardCheck className="h-6 w-6" />
            View All Inspections
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="h-auto py-6 flex-col gap-2"
            onClick={() => setLocation("/materials")}
          >
            <Database className="h-6 w-6" />
            Material Lookup
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="h-auto py-6 flex-col gap-2"
            onClick={() => window.open('/api/export/template', '_blank')}
          >
            <FileText className="h-6 w-6" />
            Download Template
          </Button>
        </div>
        
        {/* Recent Inspections */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Inspections</CardTitle>
                <CardDescription>Your latest inspection activities</CardDescription>
              </div>
              <Button variant="outline" onClick={() => setLocation("/inspections")}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentInspections.length > 0 ? (
              <div className="space-y-4">
                {recentInspections.map((inspection: { id: number; vesselTagNumber: string | null; vesselName: string | null; manufacturer: string | null; status: string }) => (
                  <div 
                    key={inspection.id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => setLocation(`/inspection/${inspection.id}`)}
                  >
                    <div>
                      <p className="font-medium">{inspection.vesselTagNumber || 'No Tag Number'}</p>
                      <p className="text-sm text-gray-500">
                        {inspection.vesselName || 'Unnamed Vessel'} • {inspection.manufacturer || 'Unknown Manufacturer'}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        inspection.status === 'completed' ? 'bg-green-100 text-green-800' :
                        inspection.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {inspection.status?.replace('_', ' ').toUpperCase()}
                      </span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ClipboardCheck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">No inspections yet. Create your first inspection to get started.</p>
                <Button onClick={() => setLocation("/inspection/new")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Inspection
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
