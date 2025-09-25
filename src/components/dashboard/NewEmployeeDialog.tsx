import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface NewEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmployeeAdded?: (employee: any) => void;
}

interface Department {
  department_id: number;
  department_name: string;
}

interface Designation {
  designation_id: number;
  designation_title: string;
  department_id: number | null;
}

export const NewEmployeeDialog = ({ open, onOpenChange, onEmployeeAdded }: NewEmployeeDialogProps) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [hireDate, setHireDate] = useState('');
  const [salary, setSalary] = useState('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [designationId, setDesignationId] = useState<string>('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(false);
  const [emailExists, setEmailExists] = useState<string>('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const { toast } = useToast();

  // Convert file to data URI (base64)
  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file); // Converts file to 'data:image/...;base64,...'
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  useEffect(() => {
    if (open) fetchData();
  }, [open]);

  const fetchData = async () => {
    try {
      const [departmentsResult, designationsResult] = await Promise.all([
        supabase.from('tbldepartments').select('*').order('department_name'),
        supabase.from('tbldesignations').select('*').order('designation_title')
      ]);

      if (departmentsResult.error) throw departmentsResult.error;
      if (designationsResult.error) throw designationsResult.error;

      setDepartments(departmentsResult.data || []);
      setDesignations(designationsResult.data || []);
    } catch (error) {
      toast({ title: "Data Loading Issue", description: "Unable to fetch departments and designations", duration: 1500 });
    }
  };

  const checkEmailExists = async (email: string) => {
    if (!email || email.length < 3) return setEmailExists('');
    try {
      const { data } = await supabase
        .from('tblemployees')
        .select('employee_id, first_name, last_name')
        .eq('email', email.toLowerCase())
        .maybeSingle();
      setEmailExists(data ? `This email is already registered to ${data.first_name} ${data.last_name}` : '');
    } catch (error) {
      console.warn('Email check issue:', error);
    }
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setHireDate('');
    setSalary('');
    setDepartmentId('');
    setDesignationId('');
    setEmailExists('');
    setProfilePicture(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailExists) {
      toast({ title: "Email Already Exists", description: emailExists });
      return;
    }

    if (!departmentId || !designationId) {
      toast({ title: "Missing Selection", description: "Please select both Department and Designation" });
      return;
    }

    const salaryValue = salary ? parseFloat(salary) : 0;
    if (salaryValue > 10000000) {
      toast({ title: "Salary Limit Exceeded", description: "Salary cannot exceed ₹10,000,000" });
      return;
    }

    setLoading(true);

    try {
      let fileData: string | null = null;

      if (profilePicture) {
        fileData = await toBase64(profilePicture); // Convert to 'data:image/...;base64,...'
      }

      const employeeData: any = {
        first_name: firstName,
        last_name: lastName,
        email: email.toLowerCase(),
        hire_date: hireDate,
        salary: salary ? parseFloat(salary) : null,
        department_id: departmentId ? parseInt(departmentId) : null,
        designation_id: designationId ? parseInt(designationId) : null,
      };

      if (fileData) {
        employeeData.file_data = fileData; // store as data URI
      }

      const { data, error } = await supabase
        .from('tblemployees')
        .insert(employeeData)
        .select()
        .single();

      if (error) throw error;

      toast({ title: "Success", description: `Employee added successfully.` });
      if (onEmployeeAdded && data) onEmployeeAdded(data);

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast({ title: "Addition Issue", description: "Unable to add employee" });
    } finally {
      setLoading(false);
    }
  };

  const filteredDesignations = departmentId
    ? designations.filter(d => d.department_id === parseInt(departmentId))
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-white text-black rounded-xl shadow-lg border border-gray-200" style={{
            background: "linear-gradient(-45deg, #ffffff, #c9d0fb)",
          }} >
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 p-6"style={{
            background: "linear-gradient(-45deg, #ffffff, #c9d0fb)",
          }}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                maxLength={25}
                className="border border-blue-500 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-blue-50 text-blue-900 placeholder-blue-400 rounded-md"
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
                className="border border-blue-500 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-blue-50 text-blue-900 placeholder-blue-400 rounded-md"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              className="border border-blue-500 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-blue-50 text-blue-900 placeholder-blue-400 rounded-md"
              onChange={(e) => { setEmail(e.target.value.toLowerCase()); checkEmailExists(e.target.value); }}
              required
            />
            {emailExists && <p className="text-sm text-orange-600">{emailExists}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="hireDate">Hire Date</Label>
            <Input
              id="hireDate"
              type="date"
              value={hireDate}
              className="border border-blue-500 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-blue-50 text-blue-900 placeholder-blue-400 rounded-md"
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
              className="border border-blue-500 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-blue-50 text-blue-900 placeholder-blue-400 rounded-md"
              placeholder="Enter salary (max 10,000,000)"
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (!isNaN(value) && value <= 10000000) setSalary(e.target.value);
                else if (e.target.value === '') setSalary('');
              }}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select
                value={departmentId}
                onValueChange={(val) => { setDepartmentId(val); setDesignationId(''); }}
                required
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
              <Label htmlFor="designation">Designation *</Label>
              <Select
                value={designationId}
                onValueChange={setDesignationId}
                required
                disabled={!departmentId || filteredDesignations.length === 0}
              >
                <SelectTrigger className="w-full bg-blue-900 text-white hover:bg-blue-700">
                  <SelectValue placeholder="Select designation" />
                </SelectTrigger>
                <SelectContent  className="z-50 bg-white shadow-lg">
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
            <Button type="button" variant="outline" onClick={() => { onOpenChange(false); resetForm(); }} className="bg-white text-blue-900 border border-blue-900 hover:bg-blue-50">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-900 text-white hover:bg-blue-700">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewEmployeeDialog;
