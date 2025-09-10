import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { EditEmployeeDialog } from '@/components/dashboard/EditEmployeeDialog';
import { NewEmployeeDialog } from '@/components/dashboard/NewEmployeeDialog';

interface Employee {
  employee_id: number;
  first_name: string;
  last_name: string;
  email: string;
  hire_date: string;
  salary: number | null;
  department_id: number | null;
  designation_id: number | null;
}

interface Department {
  department_id: number;
  department_name: string;
}

interface Designation {
  designation_id: number;
  designation_title: string;
}

const Employees = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [emailExists, setEmailExists] = useState<string>('');
  const { toast } = useToast();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    fetchData();
  }, []);

  const checkEmailExists = async (email: string, excludeId?: number) => {
    if (!email || email.length < 3) {
      setEmailExists('');
      return;
    }

    try {
      let query = supabase
        .from('tblemployees')
        .select('employee_id, first_name, last_name')
        .eq('email', email.toLowerCase());
      
      if (excludeId) {
        query = query.neq('employee_id', excludeId);
      }

      const { data } = await query.maybeSingle();
      
      if (data) {
        setEmailExists(`This email is already registered to ${data.first_name} ${data.last_name}`);
      } else {
        setEmailExists('');
      }
    } catch (error) {
      console.warn('Email check issue:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [employeesResult, departmentsResult, designationsResult] = await Promise.all([
        supabase.from('tblemployees').select('*').order('employee_id', { ascending: false }),
        supabase.from('tbldepartments').select('*').order('department_name'),
        supabase.from('tbldesignations').select('*').order('designation_title')
      ]);

      if (employeesResult.error) throw employeesResult.error;
      if (departmentsResult.error) throw departmentsResult.error;
      if (designationsResult.error) throw designationsResult.error;

      setEmployees(employeesResult.data || []);
      setDepartments(departmentsResult.data || []);
      setDesignations(designationsResult.data || []);
    } catch (error) {
      toast({
        title: "Data Loading Issue",
        description: "Unable to fetch employee information",
        variant: "default"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (employeeId: number) => {
    if (!confirm('Are you sure you want to remove this employee?')) return;

    try {
      const { error } = await supabase
        .from('tblemployees')
        .delete()
        .eq('employee_id', employeeId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Employee removed successfully",
      });
      fetchData();
    } catch (error) {
      toast({
        title: "Removal Issue",
        description: "Unable to remove employee",
        variant: "default"
      });
    }
  };

  const getDepartmentName = (departmentId: number | null) => {
    if (!departmentId) return 'Not Assigned';
    const dept = departments.find(d => d.department_id === departmentId);
    return dept?.department_name || 'Unknown';
  };

  const getDesignationTitle = (designationId: number | null) => {
    if (!designationId) return 'Not Assigned';
    const designation = designations.find(d => d.designation_id === designationId);
    return designation?.designation_title || 'Unknown';
  };

  const filteredEmployees = employees.filter(employee =>
    employee.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center p-8">Loading employees</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => window.history.back()}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">Employee Management</h1>
                <p className="text-sm text-muted-foreground">Manage all employee records</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Card className="shadow-elegant">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Employee Records</CardTitle>
                <CardDescription>
                  View and manage all employee information
                </CardDescription>
              </div>
              <Button onClick={() => setShowNewDialog(true)} className="bg-gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add New Employee
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search employee"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold">Full Name</TableHead>
                      <TableHead className="font-bold">Email</TableHead>
                      <TableHead className="font-bold">Department</TableHead>
                      <TableHead className="font-bold">Designation</TableHead>
                      <TableHead className="font-bold">Hire Date</TableHead>
                      <TableHead className="font-bold">Salary</TableHead>
                      <TableHead className="font-bold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((employee) => (
                      <TableRow key={employee.employee_id}>
                        <TableCell className="font-medium">
                          {employee.first_name} {employee.last_name}
                        </TableCell>
                        <TableCell>{employee.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {getDepartmentName(employee.department_id)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getDesignationTitle(employee.designation_id)}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(employee.hire_date).toLocaleDateString('en-GB')}</TableCell>
                        <TableCell>
                          {employee.salary ? `₹${employee.salary.toLocaleString('en-IN')}` : 'Not Set'}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingEmployee(employee)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(employee.employee_id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredEmployees.length === 0 && (
                <div className="text-center p-8 text-muted-foreground">
                  {searchTerm ? 'No employees found matching your search.' : 'No employees found.'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Dialogs */}
      <EditEmployeeDialog
        employee={editingEmployee}
        departments={departments}
        designations={designations}
        open={!!editingEmployee}
        onOpenChange={(open) => !open && setEditingEmployee(null)}
        onSuccess={fetchData}
      />

      <NewEmployeeDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
      />
    </div>
  );
};

export default Employees;