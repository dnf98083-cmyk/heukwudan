import { createClient } from "@supabase/supabase-js";

// service_role 키 사용 — API Route 서버에서만 호출할 것
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
