import { createClient } from "@supabase/supabase-js";

// service_role 키 사용 — API Route 서버에서만 호출할 것
export function createAdminClient() {
  // BOM(﻿) 및 공백 제거 — PowerShell 파이프 환경변수 등록 시 삽입될 수 있음
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/^﻿/, "").trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!.replace(/^﻿/, "").trim();
  return createClient(url, key);
}
