import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Plus, Users, Building, Briefcase } from 'lucide-react';
import { EmployeesTable } from '@/components/dashboard/EmployeesTable';
import { DepartmentsTable } from '@/components/dashboard/DepartmentsTable';
import { DesignationsTable } from '@/components/dashboard/DesignationsTable';
import { NewEmployeeDialog } from '@/components/dashboard/NewEmployeeDialog';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [showNewEmployeeDialog, setShowNewEmployeeDialog] = useState(false);
  const { toast } = useToast();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Building className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Employee Management System</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => setShowNewEmployeeDialog(true)}
                className="bg-gradient-primary shadow-elegant"
              >
                <Plus className="h-4 w-4 mr-2" />
                NewUserAdd
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-card shadow-card animate-fade-in">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-</div>
                <p className="text-xs text-muted-foreground">Active employees</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card shadow-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Departments</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-</div>
                <p className="text-xs text-muted-foreground">Total departments</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card shadow-card animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Designations</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-</div>
                <p className="text-xs text-muted-foreground">Available positions</p>
              </CardContent>
            </Card>
          </div>

          {/* Data Tables */}
          <Card className="shadow-elegant animate-slide-up">
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>
                Manage employees, departments, and designations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="employees" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="employees" className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>Employees</span>
                  </TabsTrigger>
                  <TabsTrigger value="departments" className="flex items-center space-x-2">
                    <Building className="h-4 w-4" />
                    <span>Departments</span>
                  </TabsTrigger>
                  <TabsTrigger value="designations" className="flex items-center space-x-2">
                    <Briefcase className="h-4 w-4" />
                    <span>Designations</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="employees">
                  <EmployeesTable />
                </TabsContent>
                
                <TabsContent value="departments">
                  <DepartmentsTable />
                </TabsContent>
                
                <TabsContent value="designations">
                  <DesignationsTable />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* New Employee Dialog */}
      <NewEmployeeDialog 
        open={showNewEmployeeDialog}
        onOpenChange={setShowNewEmployeeDialog}
      />
    </div>
  );
};

export default Dashboard;