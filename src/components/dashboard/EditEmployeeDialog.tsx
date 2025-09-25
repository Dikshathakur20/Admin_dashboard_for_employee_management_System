import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface Employee {
  employee_id: number;
  first_name: string;
  last_name: string;
  email: string;
  hire_date: string;
  salary: number | null;
  department_id: number | null;
  designation_id: number | null;
  file_data?: string | null;
}

interface Department {
  department_id: number;
  department_name: string;
}

interface Designation {
  designation_id: number;
  designation_title: string;
  department_id: number;
}

interface EditEmployeeDialogProps {
  employee: Employee | null;
  departments: Department[];
  designations: Designation[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const EditEmployeeDialog = ({
  employee,
  departments,
  designations,
  open,
  onOpenChange,
  onSuccess
}: EditEmployeeDialogProps) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [hireDate, setHireDate] = useState('');
  const [salary, setSalary] = useState('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [designationId, setDesignationId] = useState<string>('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (employee) {
      setFirstName(employee.first_name);
      setLastName(employee.last_name);
      setEmail(employee.email);
      setHireDate(employee.hire_date);
      setSalary(employee.salary?.toString() || '');
      setDepartmentId(employee.department_id?.toString() || '');
      setDesignationId(employee.designation_id?.toString() || '');
    }
  }, [employee]);

  useEffect(() => {
    if (!open) setProfilePicture(null);
  }, [open]);

  // Convert file to base64 data URL
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;

    if (!departmentId || !designationId) {
      toast({
        title: "Missing Selection",
        description: "Please select both Department and Designation",
        duration: 2000
      });
      return;
    }

    const salaryValue = salary ? parseFloat(salary) : 0;
    if (salaryValue > 10000000) {
      toast({
        title: "Salary Limit Exceeded",
        description: "Salary cannot exceed ₹10,000,000",
        duration: 2000
      });
      return;
    }

    setLoading(true);

    try {
      const employeeData: any = {
        first_name: firstName,
        last_name: lastName,
        email,
        hire_date: hireDate,
        salary: salary ? parseFloat(salary) : null,
        department_id: departmentId ? parseInt(departmentId) : null,
        designation_id: designationId ? parseInt(designationId) : null,
      };

      // ✅ Convert image to base64 and store directly in file_data
      if (profilePicture) {
        const base64String = await fileToBase64(profilePicture);
        employeeData.file_data = base64String;
      }

      const { error } = await supabase
        .from('tblemployees')
        .update(employeeData)
        .eq('employee_id', employee.employee_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Employee updated successfully",
        duration: 2000
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast({
        title: "Update Issue",
        description: "Failed to update employee",
        duration: 2000
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredDesignations = designations.filter(
    (d) => d.department_id === Number(departmentId)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-white text-black rounded-xl shadow-lg border border-gray-200"style={{
            background: "linear-gradient(-45deg, #ffffff, #c9d0fb)",
          }}>
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                maxLength={25}
                onChange={(e) => /^[A-Za-z]*$/.test(e.target.value) && setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                maxLength={25}
                onChange={(e) => /^[A-Za-z]*$/.test(e.target.value) && setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value.toLowerCase())}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hireDate">Hire Date</Label>
            <Input
              id="hireDate"
              type="date"
              value={hireDate}
              onChange={(e) => setHireDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="salary">Salary</Label>
            <Input
              id="salary"
              type="number"
              step="0.01"
              value={salary}
              placeholder="Enter salary (max 10,000,000)"
              required
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (!isNaN(value) && value <= 10000000) setSalary(e.target.value);
                else if (e.target.value === '') setSalary('');
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 relative z-10">
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={departmentId}
                onValueChange={(val) => {
                  setDepartmentId(val);
                  if (!filteredDesignations.find(d => d.designation_id === parseInt(designationId || '0'))) {
                    setDesignationId('');
                  }
                }}
              >
                <SelectTrigger className="w-full bg-blue-900 text-white hover:bg-blue-700">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-white shadow-lg">
                  {departments.map((dept) => (
                    <SelectItem key={dept.department_id} value={dept.department_id.toString()}>
                      {dept.department_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="designation">Designation</Label>
              <Select
                value={designationId || ''}
                onValueChange={setDesignationId}
                disabled={!departmentId || filteredDesignations.length === 0}
              >
                <SelectTrigger className="w-full bg-blue-900 text-white hover:bg-blue-700">
                  <SelectValue placeholder="Select designation" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-white shadow-lg">
                  {filteredDesignations.map((des) => (
                    <SelectItem key={des.designation_id} value={des.designation_id.toString()}>
                      {des.designation_title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profilePicture">Profile Picture</Label>
            <Input
              id="profilePicture"
              type="file"
              accept="image/*"
              onChange={(e) => setProfilePicture(e.target.files?.[0] || null)}
            />
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-white text-blue-900 border border-blue-900 hover:bg-blue-50"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-900 text-white hover:bg-blue-700"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Employee
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditEmployeeDialog;
