import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

export default function Notifications() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState("All");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!title) {
      toast({
        title: "Missing title",
        description: "Please enter a notification title.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.from("tblnotifications").insert([
        {
          title,
          message,
          target_audience: target || "All",
        },
      ]);

      if (error) throw error;

      toast({
        title: "Notification sent",
        description: "Your notification has been added successfully!",
      });

      setTitle("");
      setMessage("");
      setTarget("All");
    } catch (err: any) {
      toast({
        title: "Error sending notification",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-md border border-gray-200">
      <h2 className="text-xl font-semibold text-blue-900 mb-4">
        Create Notification
      </h2>

      <div className="space-y-4">
        <Input
          placeholder="Enter Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border-blue-900 focus:ring-0 focus:border-blue-900"
        />

        <Textarea
          placeholder="Enter Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="border-blue-900 focus:ring-0 focus:border-blue-900"
        />

        <select
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="border border-blue-900 rounded-lg px-3 py-2 text-blue-900 focus:outline-none focus:ring-0"
        >
          <option value="All">All Employees</option>
          <option value="HR">HR Department</option>
          <option value="IT">IT Department</option>
          <option value="Finance">Finance Department</option>
        </select>

        <Button
          onClick={handleSend}
          disabled={loading}
          className="bg-blue-900 hover:bg-blue-800 text-white"
        >
          {loading ? "Sending..." : "Send Notification"}
        </Button>
      </div>
    </div>
  );
}
