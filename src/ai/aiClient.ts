import { getSupabase } from "../lib/supabase";

type AiFunctionName =
  | "classify-transaction"
  | "generate-diagnostic"
  | "generate-action-plan"
  | "generate-report-text";

export async function invokeAiFunction<TPayload extends Record<string, unknown>, TResult>(
  name: AiFunctionName,
  payload: TPayload,
) {
  const { data, error } = await getSupabase().functions.invoke<TResult>(name, {
    body: payload,
  });

  if (error) throw error;
  return data;
}
