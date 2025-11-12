import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

function MonthlyReport() {
  const [records, setRecords] = useState<any[]>([]);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState<boolean>(false);
  const [employeeId, setEmployeeId] = useState<number | null>(null);

  // ✅ Load employee_id from the same localStorage object used in EmployeeDashboard
  useEffect(() => {
    const storedEmployee = localStorage.getItem("employee");
    if (storedEmployee) {
      const emp = JSON.parse(storedEmployee);
      if (emp?.employee_id) {
        setEmployeeId(emp.employee_id);
      }
    }
  }, []);

  // ✅ Fetch attendance when employeeId/month/year changes
  useEffect(() => {
    if (employeeId !== null) fetchAttendance();
  }, [employeeId, month, year]);

  const fetchAttendance = async () => {
    if (employeeId === null) return;

    try {
      setLoading(true);

      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;

      const { data, error } = await supabase
        .from("tblattendance")
        .select("date, check_in, check_out, status")
        .eq("employee_id", employeeId)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true });

      if (error) throw error;

      setRecords(data || []);
    } catch (err: any) {
      console.error("Error fetching report:", err);
      toast({
        title: "Error fetching report",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle logout cleanly
  const handleLogout = () => {
    localStorage.removeItem("employee");
    window.location.href = "/login";
  };

  if (employeeId === null)
    return (
      <div className="min-h-screen flex justify-center items-center flex-col gap-4">
        <p className="text-gray-500 text-lg">
          Please log in to view your attendance report.
        </p>
        <Button onClick={() => (window.location.href = "/login")}>
          Go to Login
        </Button>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-grow flex justify-center items-start py-10">
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 w-full max-w-4xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-blue-900 text-center w-full">
              Monthly Attendance Report
            </h2>
            {/*<Button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Logout
            </Button>*/}
          </div>

          {/* Month-Year Filters */}
          <div className="flex flex-wrap gap-4 mb-6 justify-center">
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="border border-blue-900 rounded-lg px-3 py-2 text-blue-900"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString("default", { month: "long" })}
                </option>
              ))}
            </select>

            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="border border-blue-900 rounded-lg px-3 py-2 text-blue-900"
            >
              {[2024, 2025, 2026].map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>

            <Button
              onClick={fetchAttendance}
              disabled={loading}
              className="bg-blue-900 hover:bg-blue-800 text-white"
            >
              {loading ? "Loading..." : "Refresh"}
            </Button>
          </div>

          {/* Attendance Table */}
          {records.length > 0 ? (
            <table className="w-full border-collapse border border-gray-300 text-center">
              <thead className="bg-blue-900 text-white">
                <tr>
                  <th className="border p-2">Date</th>
                  <th className="border p-2">Check-In</th>
                  <th className="border p-2">Check-Out</th>
                  <th className="border p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec, index) => (
                  <tr key={index} className="hover:bg-gray-100">
                    <td className="border p-2">
                      {new Date(rec.date).toLocaleDateString("en-IN")}
                    </td>
                    <td className="border p-2">
                      {rec.check_in
                        ? new Date(rec.check_in).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })
                        : "—"}
                    </td>
                    <td className="border p-2">
                      {rec.check_out
                        ? new Date(rec.check_out).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })
                        : "—"}
                    </td>
                    <td className="border p-2">{rec.status || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500 text-center mt-6">
              No records found for this month.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

export default MonthlyReport;
