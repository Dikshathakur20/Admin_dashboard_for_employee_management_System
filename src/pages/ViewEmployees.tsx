import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Employee {
  employee_id: number;
  first_name: string;
  last_name: string;
  email: string;
  hire_date: string | null;
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

// Employee Card Component
const EmployeeCard = ({
  emp,
  getDepartmentName,
  getDesignationTitle,
}: {
  emp: Employee;
  getDepartmentName: (id: number | null) => string;
  getDesignationTitle: (id: number | null) => string;
}) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col justify-between hover:shadow-xl transition">
      <div>
        <h2 className="text-xl font-bold mb-2">
          {emp.first_name} {emp.last_name}
        </h2>
        <p className="text-sm text-gray-600 mb-1">
          <strong>Email:</strong> {emp.email}
        </p>
        <p className="text-sm text-gray-600 mb-1">
          <strong>Hire Date:</strong>{" "}
          {emp.hire_date ? new Date(emp.hire_date).toLocaleDateString("en-GB") : "-"}
        </p>
        <p className="text-sm text-gray-600 mb-1">
          <strong>Salary:</strong> {emp.salary ? `₹${emp.salary}` : "Not Set"}
        </p>
        <p className="text-sm text-gray-600 mb-1">
          <strong>Department:</strong> {getDepartmentName(emp.department_id)}
        </p>
        <p className="text-sm text-gray-600">
          <strong>Designation:</strong> {getDesignationTitle(emp.designation_id)}
        </p>
      </div>
    </div>
  );
};

const ViewEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [employeesResult, departmentsResult, designationsResult] =
        await Promise.all([
          supabase.from("tblemployees").select("*").order("employee_id", { ascending: false }),
          supabase.from("tbldepartments").select("*").order("department_name"),
          supabase.from("tbldesignations").select("*").order("designation_title"),
        ]);

      if (employeesResult.error) throw employeesResult.error;
      if (departmentsResult.error) throw departmentsResult.error;
      if (designationsResult.error) throw designationsResult.error;

      setEmployees(employeesResult.data || []);
      setDepartments(departmentsResult.data || []);
      setDesignations(designationsResult.data || []);
    } catch (error) {
      console.error("Data fetch error:", error);
    }
  };

  const getDepartmentName = (departmentId: number | null) => {
    if (!departmentId) return "Not Assigned";
    const dept = departments.find((d) => d.department_id === departmentId);
    return dept?.department_name || "Unknown";
  };

  const getDesignationTitle = (designationId: number | null) => {
    if (!designationId) return "Not Assigned";
    const desig = designations.find((d) => d.designation_id === designationId);
    return desig?.designation_title || "Unknown";
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Employee Management</h1>

      {/* Employee Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.length > 0 ? (
          employees.map((emp) => (
            <EmployeeCard
              key={emp.employee_id}
              emp={emp}
              getDepartmentName={getDepartmentName}
              getDesignationTitle={getDesignationTitle}
            />
          ))
        ) : (
          <p className="text-gray-500 col-span-full">No employees found.</p>
        )}
      </div>
    </div>
  );
};

export default ViewEmployees;
