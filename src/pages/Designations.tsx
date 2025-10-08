'use client';

import { useState, useEffect, useRef } from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useLogin } from '@/contexts/LoginContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Edit, Trash2, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { EditDesignationDialog } from '@/components/dashboard/EditDesignationDialog';
import { NewDesignationDialog } from '@/components/dashboard/NewDesignationDialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Designation {
  designation_id: number;
  designation_title: string;
  department_id: number | null;
  total_employees?: number;
}

interface Department {
  department_id: number;
  department_name: string;
}

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

type SortOption = 'name-asc' | 'name-desc' | 'id-asc' | 'id-desc';

const Designations = () => {
  const { user } = useLogin();
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingDesignation, setEditingDesignation] = useState<Designation | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const { toast } = useToast();
  const [sortOption, setSortOption] = useState<SortOption>('id-desc');

  // Infinite scroll
  const [visibleCount, setVisibleCount] = useState(10);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const departmentFilter = params.get("department");

  if (!user) return <Navigate to="/login" replace />;

  // Fetch designations
  useEffect(() => {
    if (typeof window === 'undefined') return;
    fetchDesignations();
  }, []);

  const fetchDesignations = async () => {
    setLoading(true);
    try {
      const [designationsResult, departmentsResult, employeesResult] = await Promise.all([
        supabase.from('tbldesignations').select('*'),
        supabase.from('tbldepartments').select('*').order('department_name'),
        supabase.from('tblemployees').select('employee_id, designation_id')
      ]);

      if (designationsResult.error) throw designationsResult.error;
      if (departmentsResult.error) throw departmentsResult.error;
      if (employeesResult.error) throw employeesResult.error;

      setDepartments(departmentsResult.data || []);

      const designationsWithCount = (designationsResult.data || []).map(des => ({
        ...des,
        total_employees: employeesResult.data?.filter(
          (e: Employee) => e.designation_id === des.designation_id
        ).length || 0
      }));

      setDesignations(designationsWithCount);
    } catch (err: unknown) {
      const error = err as Error;
      console.error(error);
      if (typeof window !== 'undefined') {
        toast({
          title: "Data Loading Issue",
          description: error.message || "Unable to fetch designation information",
          variant: "default"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (designationId: number) => {
    if (typeof window === 'undefined') return;
    try {
      const { count, error: countError } = await supabase
        .from("tblemployees")
        .select("employee_id", { count: "exact", head: true })
        .eq("designation_id", designationId);

      if (countError) throw countError;

      if (count && count > 0) {
        toast({
          title: "Cannot delete",
          description: `This designation has ${count} active employee(s). Reassign them first.`,
          variant: "destructive",
        });
        return;
      }

      setConfirmDelete(designationId);
    } catch (err: unknown) {
      const error = err as Error;
      console.error(error);
      if (typeof window !== 'undefined') {
        toast({
          title: "Error",
          description: error.message || "Something went wrong while checking designation dependencies.",
          variant: "destructive",
        });
      }
    }
  };

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return;
    if (typeof window === 'undefined') return;

    try {
      const { error } = await supabase
        .from("tbldesignations")
        .delete()
        .eq("designation_id", confirmDelete);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "Designation removed successfully",
      });

      fetchDesignations();
    } catch (err: unknown) {
      const error = err as Error;
      console.error(error);
      toast({
        title: "Deletion Failed",
        description: error.message || "Unable to remove designation.",
        variant: "destructive",
      });
    } finally {
      setConfirmDelete(null);
    }
  };

  const getDepartmentName = (departmentId: number | null) => {
    if (!departmentId) return 'Not Assigned';
    const dept = departments.find(d => d.department_id === departmentId);
    return dept?.department_name || 'Unknown';
  };

  // Filtering & sorting
  const filteredDesignations = designations
    .filter(designation =>
      designation.designation_title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(designation =>
      departmentFilter ? designation.department_id === Number(departmentFilter) : true
    );

  const sortedDesignations = [...filteredDesignations].sort((a, b) => {
    switch (sortOption) {
      case 'name-asc':
        return a.designation_title.toLowerCase().localeCompare(b.designation_title.toLowerCase());
      case 'name-desc':
        return b.designation_title.toLowerCase().localeCompare(a.designation_title.toLowerCase());
      case 'id-asc':
        return a.designation_id - b.designation_id;
      case 'id-desc':
        return b.designation_id - a.designation_id;
      default:
        return 0;
    }
  });

  // Infinite scroll observer
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + 10, sortedDesignations.length));
        }
      },
      { threshold: 1 }
    );

    if (loaderRef.current) observer.observe(loaderRef.current);

    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [sortedDesignations.length]);

  const visibleDesignations = sortedDesignations.slice(0, visibleCount);

  if (loading) return <div className="flex justify-center p-8">Loading designations...</div>;

  return (
    <div className="min-h-screen bg-background">
      {/* --- Rest of your UI remains completely unchanged --- */}
      {/* Table, Buttons, Dialogs, Infinite Scroll etc. */}
    </div>
  );
};

export default Designations;

