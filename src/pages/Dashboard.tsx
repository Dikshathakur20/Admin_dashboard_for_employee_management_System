import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Users, Building, Briefcase, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [employeeCount, setEmployeeCount] = useState(0);
  const [departmentCount, setDepartmentCount] = useState(0);
  const [designationCount, setDesignationCount] = useState(0);
  const { toast } = useToast();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    try {
      const [employeesResult, departmentsResult, designationsResult] = await Promise.all([
        supabase.from('tblemployees').select('*', { count: 'exact', head: true }),
        supabase.from('tbldepartments').select('*', { count: 'exact', head: true }),
        supabase.from('tbldesignations').select('*', { count: 'exact', head: true })
      ]);

      setEmployeeCount(employeesResult.count || 0);
      setDepartmentCount(departmentsResult.count || 0);
      setDesignationCount(designationsResult.count || 0);
    } catch (error) {
      console.warn('Count fetch issue:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Success",
        description: "You have been successfully signed out",
      });
    } catch (error) {
      toast({
        title: "Sign Out Issue",
        description: "Unable to sign out properly",
        variant: "default"
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
            <Link to="/employees">
              <Card className="bg-gradient-card shadow-card animate-fade-in hover:shadow-elegant transition-all cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{employeeCount}</div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    Active employees <ArrowRight className="h-3 w-3 ml-1" />
                  </p>
                </CardContent>
              </Card>
            </Link>
            
            <Link to="/departments">
              <Card className="bg-gradient-card shadow-card animate-fade-in hover:shadow-elegant transition-all cursor-pointer" style={{ animationDelay: '0.1s' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Departments</CardTitle>
                  <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{departmentCount}</div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    Total departments <ArrowRight className="h-3 w-3 ml-1" />
                  </p>
                </CardContent>
              </Card>
            </Link>
            
            <Link to="/designations">
              <Card className="bg-gradient-card shadow-card animate-fade-in hover:shadow-elegant transition-all cursor-pointer" style={{ animationDelay: '0.2s' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Designations</CardTitle>
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{designationCount}</div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    Available positions <ArrowRight className="h-3 w-3 ml-1" />
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Management Actions */}
          <Card className="shadow-elegant animate-slide-up">
            <CardHeader>
              <CardTitle>Management Actions</CardTitle>
              <CardDescription>
                Click on the cards above to manage specific data tables
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" asChild className="h-20 flex-col">
                  <Link to="/employees">
                    <Users className="h-6 w-6 mb-2" />
                    Manage Employees
                  </Link>
                </Button>
                <Button variant="outline" asChild className="h-20 flex-col">
                  <Link to="/departments">
                    <Building className="h-6 w-6 mb-2" />
                    Manage Departments
                  </Link>
                </Button>
                <Button variant="outline" asChild className="h-20 flex-col">
                  <Link to="/designations">
                    <Briefcase className="h-6 w-6 mb-2" />
                    Manage Designations
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

    </div>
  );
};

export default Dashboard;