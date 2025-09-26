// src/components/dialogs/NewEmployeeDialog.tsx
import { useState, useEffect, useRef } from 'react';
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

const NewEmployeeDialog: React.FC<NewEmployeeDialogProps> = ({ open, onOpenChange, onEmployeeAdded }) => {
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
  const buttonPressCount = useRef(0);

  // ------------------ Utilities ------------------
  const capitalizeWords = (val: string) => val.replace(/\b\w/g, c => c.toUpperCase());

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

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

  // ------------------ Fetch Departments & Designations ------------------
  const fetchData = async () => {
    try {
      const [departmentsResult, designationsResult] = await Promise.all([
        supabase.from('tbldepartments').select('*').order('department_name'),
        supabase.from('tbldesignations').select('*').order('designation_title'),
      ]);

      if (departmentsResult.error) throw departmentsResult.error;
      if (designationsResult.error) throw designationsResult.error;

      setDepartments(departmentsResult.data || []);
      setDesignations(designationsResult.data || []);
    } catch (error) {
      toast({ title: "Data Loading Issue", description: "Unable to fetch departments and designations" });
    }
  };

  useEffect(() => { if (open) fetchData(); }, [open]);

  // ------------------ Email Check ------------------
  const checkEmailExists = async (email: string) => {
    if (!email || email.length < 3) return setEmailExists('');
    try {
      const { data } = await supabase
        .from('tblemployees')
        .select('employee_id, first_name, last_name')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (data && typeof data === 'object' && 'first_name' in data && 'last_name' in data) {
        setEmailExists(`This email is already registered to ${data.first_name} ${data.last_name}`);
      } else {
        setEmailExists('');
      }
    } catch (error) {
      console.warn('Email check issue:', error);
    }
  };

  // ------------------ Filter Designations ------------------
  const filteredDesignations = departmentId
    ? designations.filter(d => d.department_id === parseInt(departmentId))
    : [];

  // ------------------ Form Submission ------------------
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
      if (profilePicture) fileData = await toBase64(profilePicture);

      const employeeData: any = {
        first_name: firstName,
        last_name: lastName,
        email: email.toLowerCase(),
        hire_date: hireDate,
        salary: salaryValue || null,
        department_id: parseInt(departmentId),
        designation_id: parseInt(designationId),
        ...(fileData ? { file_data: fileData } : {}),
      };

      const { data, error } = await supabase.from('tblemployees').insert(employeeData).select().single();
      if (error) throw error;

      toast({ title: "Success", description: "Employee added successfully." });
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

  // ------------------ Keyboard Navigation (SSR-safe) ------------------
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const form = target.closest("form");
      if (!form) return;

      const focusable = Array.from(
        form.querySelectorAll<HTMLElement>("input, select, textarea, button, [tabindex]:not([tabindex='-1'])")
      ).filter(el => !el.hasAttribute("disabled") && el.offsetParent !== null);

      const index = focusable.indexOf(target);

      if (e.key === "Enter") {
        if (target.tagName === "BUTTON") {
          e.preventDefault();
          buttonPressCount.current += 1;
          if (buttonPressCount.current === 2) {
            (target as HTMLButtonElement).click();
            buttonPressCount.current = 0;
          }
          return;
        }
        if (target.tagName === "INPUT" && (target as HTMLInputElement).type === "file") {
          e.preventDefault();
          (target as HTMLInputElement).click();
          return;
        }
        e.preventDefault();
        buttonPressCount.current = 0;
        const next = focusable[index + 1];
        if (next) next.focus();
      }

      if (["ArrowDown", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const next = focusable[index + 1];
        if (next) next.focus();
      }
      if (["ArrowUp", "ArrowLeft"].includes(e.key)) {
        e.preventDefault();
        const prev = focusable[index - 1];
        if (prev) prev.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ------------------ JSX ------------------
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] rounded-xl shadow-lg border border-gray-200"
        style={{ background: "linear-gradient(-45deg, #ffffff, #c9d0fb)" }}>
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {/* First & Last Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                maxLength={25}
                onChange={e => /^[A-Za-z ]*$/.test(e.target.value) && setFirstName(capitalizeWords(e.target.value))}
                onPaste={e => e.preventDefault()}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                maxLength={25}
                onChange={e => /^[A-Za-z ]*$/.test(e.target.value) && setLastName(capitalizeWords(e.target.value))}
                onPaste={e => e.preventDefault()}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value.toLowerCase()); checkEmailExists(e.target.value); }}
              onPaste={e => e.preventDefault()}
              required
            />
            {emailExists && <p className="text-sm text-orange-600">{emailExists}</p>}
          </div>

          {/* Hire Date */}
          <div className="space-y-2">
            <Label htmlFor="hireDate">Hire Date</Label>
            <Input
              id="hireDate"
              type="date"
              value={hireDate}
              min="2000-01-01"
              max={new Date().toISOString().split("T")[0]}
              onChange={e => setHireDate(e.target.value)}
              required
            />
          </div>

          {/* Department & Designation */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select value={departmentId} onValueChange={val => { setDepartmentId(val); setDesignationId(''); }} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept.department_id} value={dept.department_id.toString()}>{dept.department_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="designation">Designation *</Label>
              <Select value={designationId} onValueChange={setDesignationId} required disabled={!departmentId || filteredDesignations.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder="Select designation" />
                </SelectTrigger>
                <SelectContent>
                  {filteredDesignations.map(des => (
                    <SelectItem key={des.designation_id} value={des.designation_id.toString()}>{des.designation_title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Profile Picture */}
          <div className="space-y-2">
            <Label htmlFor="profilePicture">Profile Picture</Label>
            <Input id="profilePicture" type="file" accept="image/*" onChange={e => setProfilePicture(e.target.files?.[0] || null)} />
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => { onOpenChange(false); resetForm(); }}>
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
