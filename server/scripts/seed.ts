import { db } from '../src/config/database.js';
import { hashPassword } from '../src/utils/crypto.js';

async function seed() {
  const ownerRole = await db.query("SELECT id FROM roles WHERE code = 'owner' LIMIT 1");
  const supervisorRole = await db.query("SELECT id FROM roles WHERE code = 'supervisor' LIMIT 1");
  const memberRole = await db.query("SELECT id FROM roles WHERE code = 'member' LIMIT 1");

  const ownerHash = await hashPassword('Owner@12345');
  const fixedOwnerHash = await hashPassword('Aa123456');
  const supervisorHash = await hashPassword('Supervisor@12345');
  const memberHash = await hashPassword('Member@12345');
  const stateHash = await hashPassword('State@12345');

  await db.query(
    `
      INSERT INTO users(role_id, full_name, email, phone, password_hash, is_email_verified, is_phone_verified)
      VALUES
        ($1, 'مالك النظام', 'owner@mmm.com', '+966500000001', $2, TRUE, TRUE),
        ($3, 'مشرف النظام', 'supervisor@mmm.com', '+966500000002', $4, TRUE, TRUE),
        ($5, 'عضو النظام', 'member@mmm.com', '+966500000003', $6, TRUE, TRUE)
      ON CONFLICT (email) DO NOTHING
    `,
    [
      ownerRole.rows[0].id,
      ownerHash,
      supervisorRole.rows[0].id,
      supervisorHash,
      memberRole.rows[0].id,
      memberHash
    ]
  );

  await db.query(
    `
      INSERT INTO users(role_id, full_name, username, password_hash, state_name, is_state_account)
      VALUES ($1, 'Danger Owner', 'danger', $2, NULL, FALSE)
      ON CONFLICT (username) DO NOTHING
    `,
    [ownerRole.rows[0].id, fixedOwnerHash]
  );

  await db.query(
    `
      INSERT INTO users(role_id, full_name, username, password_hash, state_name, is_state_account)
      VALUES ($1, 'حساب ولاية الرياض', 'state:riyadh', $2, 'Riyadh', TRUE)
      ON CONFLICT (username) DO NOTHING
    `,
    [supervisorRole.rows[0].id, stateHash]
  );

  const permissions = await db.query('SELECT id, code FROM permissions');
  const ownerPerms = permissions.rows.map((p) => p.id);
  const supervisorPerms = permissions.rows.filter((p) => !['users.delete', 'roles.manage', 'modules.manage'].includes(p.code)).map((p) => p.id);
  const memberPerms = permissions.rows.filter((p) => ['clients.read', 'messages.send_single'].includes(p.code)).map((p) => p.id);

  const ownerRoleId = ownerRole.rows[0].id;
  const supervisorRoleId = supervisorRole.rows[0].id;
  const memberRoleId = memberRole.rows[0].id;

  await db.query('DELETE FROM role_permissions WHERE role_id IN ($1,$2,$3)', [ownerRoleId, supervisorRoleId, memberRoleId]);

  for (const permId of ownerPerms) {
    await db.query('INSERT INTO role_permissions(role_id, permission_id) VALUES($1,$2)', [ownerRoleId, permId]);
  }
  for (const permId of supervisorPerms) {
    await db.query('INSERT INTO role_permissions(role_id, permission_id) VALUES($1,$2)', [supervisorRoleId, permId]);
  }
  for (const permId of memberPerms) {
    await db.query('INSERT INTO role_permissions(role_id, permission_id) VALUES($1,$2)', [memberRoleId, permId]);
  }

  await db.query(
    `
      INSERT INTO clients(full_name, national_id, phone, email, region, state_name, created_by)
      SELECT
        x.full_name,
        x.national_id,
        x.phone,
        x.email,
        x.region,
        x.state_name,
        u.id
      FROM (
        VALUES
          ('سالم العمري', '1001001001', '+966511111111', 'salem@client.com', 'الرياض', 'Riyadh'),
          ('منيرة الجهني', '1001001002', '+966522222222', 'muneera@client.com', 'جدة', 'Jeddah'),
          ('فهد القرني', '1001001003', '+966533333333', 'fahad@client.com', 'الدمام', 'Dammam')
      ) AS x(full_name, national_id, phone, email, region, state_name)
      CROSS JOIN (SELECT id FROM users WHERE email = 'owner@mmm.com' LIMIT 1) u
      ON CONFLICT (state_name, national_id) DO NOTHING
    `
  );

  console.log('Seed completed successfully');
  await db.end();
}

seed().catch(async (error) => {
  console.error(error);
  await db.end();
  process.exit(1);
});
