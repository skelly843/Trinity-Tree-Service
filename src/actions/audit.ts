'use server';

import { createClient } from '@/utils/supabase/server';

export async function createAuditLog(
  actionType: string,
  entityType: string,
  entityId: string | null,
  summary: string,
  previousValues: Record<string, any> | null = null,
  newValues: Record<string, any> | null = null
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  await supabase.from('audit_logs').insert({
    user_id: user?.id || null,
    action_type: actionType,
    entity_type: entityType,
    entity_id: entityId,
    summary,
    previous_values: previousValues,
    new_values: newValues,
  });
}
