// src/pages/ViewEmployees.tsx
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Employee {
  employee_id: number;
  first_name: string;
  last_name: string;
  email: string;
  hire_date: string | null;
  salary: number | null;
}

// Standalone Employee Card for grid display
const EmployeeCard = ({ emp }: { emp: Employee }) => {
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
          <strong>Hire Date:</strong> {emp.hire_date || "-"}
        </p>
        <p className="text-sm text-gray-600">
          <strong>Salary:</strong> ₹{emp.salary || "-"}
        </p>
      </div>
    </div>
  );
};

const ViewEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from("tblemployees")
      .select("employee_id, first_name, last_name, email, hire_date, salary")
      .order("employee_id", { ascending: false });

    if (error) console.error(error);
    else setEmployees(data || []);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Employee Management</h1>

      {/* Employee Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.length > 0 ? (
          employees.map((emp) => <EmployeeCard key={emp.employee_id} emp={emp} />)
        ) : (
          <p className="text-gray-500 col-span-full">No employees found.</p>
        )}
      </div>
    </div>
  );
};

export default ViewEmployees;
