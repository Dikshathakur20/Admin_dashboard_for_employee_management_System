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

  useEffect(() => {
    const storedEmployee = localStorage.getItem("employee");
    if (storedEmployee) {
      const emp = JSON.parse(storedEmployee);
      if (emp?.employee_id) setEmployeeId(emp.employee_id);
    }
  }, []);

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

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case "Present":
        return "bg-green-500";
      case "Absent":
        return "bg-red-500";
      case "Late":
        return "bg-orange-400";
      default:
        return "bg-gray-300";
    }
  };

  const generateCalendarDays = () => {
    const lastDay = new Date(year, month, 0).getDate();
    const firstDayWeekday = new Date(year, month - 1, 1).getDay(); // 0 = Sunday
    const days = [];

    // Empty slots for first week
    for (let i = 0; i < firstDayWeekday; i++) days.push(null);

    // Fill days with data
    for (let day = 1; day <= lastDay; day++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const record = records.find((r) => r.date === dateStr);
      days.push({
        day,
        status: record?.status,
        check_in: record?.check_in,
        check_out: record?.check_out,
      });
    }

    return days;
  };

  if (employeeId === null)
    return (
      <div className="min-h-screen flex justify-center items-center flex-col gap-4">
        <p className="text-gray-500 text-lg">Please log in to view your attendance report.</p>
        <Button onClick={() => (window.location.href = "/login")}>Go to Login</Button>
      </div>
    );

  const calendarDays = generateCalendarDays();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-grow flex justify-center items-start py-10">
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 w-full max-w-4xl"
        style={{ background: "linear-gradient(-45deg, #ffffff, #c9d0fb)" }}>
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-blue-900 text-center w-full md:w-auto mb-4 md:mb-0">
              Monthly Attendance Calendar
            </h2>
          </div>

          {/* Month-Year Filters */}
          <div className="flex flex-wrap gap-4 mb-6 justify-center">
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="border border-black-900 rounded-lg px-3 py-2 bg-blue-900 text-white"
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
              className="border border-black-900 rounded-lg px-3 py-2 bg-blue-900 text-white"
            >
              {[2021,2022,2023,2024, 2025, ].map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>

            {/*<Button
              onClick={fetchAttendance}
              disabled={loading}
              className="bg-blue-900 hover:bg-blue-800 text-white"
            >
              {loading ? "Loading..." : "Refresh"}
            </Button>*/}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center font-semibold text-gray-700">
                {day}
              </div>
            ))}

            {calendarDays.map((d, idx) =>
              d ? (
                <div
                  key={idx}
                  className={`h-20 flex flex-col items-center justify-center rounded-lg text-white text-xs p-1 ${getStatusColor(
                    d.status
                  )}`}
                  title={`Check-in: ${
                    d.check_in
                      ? new Date(d.check_in).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : "—"
                  } | Check-out: ${
                    d.check_out
                      ? new Date(d.check_out).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : "—"
                  } | Status: ${d.status || "N/A"}`}
                >
                  <span className="font-bold">{d.day}</span>
                  <span className="text-[10px]">
                    {d.check_in
                      ? new Date(d.check_in).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : "—"}
                  </span>
                  <span className="text-[10px]">
                    {d.check_out
                      ? new Date(d.check_out).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : "—"}
                  </span>
                </div>
              ) : (
                <div key={idx} />
              )
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default MonthlyReport;
