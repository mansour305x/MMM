import { db } from '../config/database.js';

export async function writeAudit(input: {
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: unknown;
  ipAddress?: string;
  userAgent?: string;
}) {
  await db.query(
    `
      INSERT INTO audit_logs(actor_user_id, action, entity_type, entity_id, metadata, ip_address, user_agent)
      VALUES($1,$2,$3,$4,$5,$6,$7)
    `,
    [
      input.actorUserId ?? null,
      input.action,
      input.entityType,
      input.entityId ?? null,
      JSON.stringify(input.metadata ?? null),
      input.ipAddress ?? null,
      input.userAgent ?? null
    ]
  );
}
