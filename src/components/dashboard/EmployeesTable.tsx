import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EditEmployeeDialog } from './EditEmployeeDialog';

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

export const EmployeesTable = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [employeesResult, departmentsResult, designationsResult] = await Promise.all([
        supabase.from('tblemployees').select('*').order('employee_id'),
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
<<<<<<< HEAD
        title: "Data Loading  Issue",
        description: "Failed to fetch employees data",
        variant: "default"
=======
        title: "Error",
        description: "Failed to fetch employees data",
        variant: "destructive"
>>>>>>> 5f3b3dd5f1cbc64020a543712e1f0472d19548fd
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (employeeId: number) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;

    try {
      const { error } = await supabase
        .from('tblemployees')
        .delete()
        .eq('employee_id', employeeId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Employee deleted successfully",
      });
      fetchData();
    } catch (error) {
      toast({
<<<<<<< HEAD
        title: "Removal Issue",
        description: "Failed to delete employee",
        variant: "default"
=======
        title: "Error",
        description: "Failed to delete employee",
        variant: "destructive"
>>>>>>> 5f3b3dd5f1cbc64020a543712e1f0472d19548fd
      });
    }
  };

  const getDepartmentName = (departmentId: number | null) => {
    if (!departmentId) return 'Not assigned';
    const dept = departments.find(d => d.department_id === departmentId);
    return dept?.department_name || 'Unknown';
  };

  const getDesignationTitle = (designationId: number | null) => {
    if (!designationId) return 'Not assigned';
    const designation = designations.find(d => d.designation_id === designationId);
    return designation?.designation_title || 'Unknown';
  };

  const filteredEmployees = employees.filter(employee =>
    employee.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center p-8">Loading employees...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
<<<<<<< HEAD
            placeholder="Search employee..."
=======
            placeholder="Search employees..."
>>>>>>> 5f3b3dd5f1cbc64020a543712e1f0472d19548fd
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
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Hire Date</TableHead>
              <TableHead>Salary</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.map((employee) => (
              <TableRow key={employee.employee_id}>
                <TableCell>{employee.employee_id}</TableCell>
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
                <TableCell>{new Date(employee.hire_date).toLocaleDateString()}</TableCell>
                <TableCell>
                  {employee.salary ? `$${employee.salary.toLocaleString()}` : 'Not set'}
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

      <EditEmployeeDialog
        employee={editingEmployee}
        departments={departments}
        designations={designations}
        open={!!editingEmployee}
        onOpenChange={(open) => !open && setEditingEmployee(null)}
        onSuccess={fetchData}
      />
    </div>
  );
};