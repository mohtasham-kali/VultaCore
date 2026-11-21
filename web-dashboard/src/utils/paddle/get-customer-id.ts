import { createClient } from "@/utils/supabase/server";
import { queryDb } from "@/utils/db/postgres";

export async function getCustomerId(): Promise<string> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const email = userData?.user?.email;
  if (!email) return "";

  try {
    const { data } = await supabase
      .from("customers")
      .select("customer_id")
      .eq("email", email)
      .single();

    if (data?.customer_id) {
      return data.customer_id;
    }
  } catch {
    // Fall back to direct queryDb
  }

  try {
    const rows = await queryDb<{ customer_id: string }>(
      `SELECT customer_id FROM customers WHERE email = $1 LIMIT 1;`,
      [email],
    );
    return rows[0]?.customer_id ?? "";
  } catch {
    return "";
  }
}
