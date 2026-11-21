"use server";

import { createClient } from "@/utils/supabase/server";
import { getCustomerId } from "@/utils/paddle/get-customer-id";
import { type MirroredSubscription } from "@/utils/paddle/access";
import { queryDb } from "@/utils/db/postgres";

export async function getUserSubscription(): Promise<MirroredSubscription | null> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) return null;

  const customerId = await getCustomerId();

  try {
    const match = customerId
      ? `user_id.eq.${userId},customer_id.eq.${customerId}`
      : `user_id.eq.${userId}`;

    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .or(match)
      .order("paddle_created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      return data as MirroredSubscription;
    }
  } catch {
    // Fall back to direct queryDb
  }

  try {
    let sql: string;
    let params: any[];
    if (customerId) {
      sql = `SELECT * FROM subscriptions WHERE user_id = $1 OR customer_id = $2 ORDER BY paddle_created_at DESC LIMIT 1;`;
      params = [userId, customerId];
    } else {
      sql = `SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY paddle_created_at DESC LIMIT 1;`;
      params = [userId];
    }
    const rows = await queryDb<MirroredSubscription>(sql, params);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}
