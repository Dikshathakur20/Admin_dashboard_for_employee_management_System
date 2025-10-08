import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  try {
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check OTP
    const { data: record, error } = await supabase
      .from("otps")
      .select("*")
      .eq("email", email)
      .eq("otp", otp)
      .single();

    if (error || !record) {
      return new Response(JSON.stringify({ error: "Invalid OTP" }), {
        status: 400,
      });
    }

    // Reset password using Admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(record.user_id, {
      password: newPassword,
    });

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
