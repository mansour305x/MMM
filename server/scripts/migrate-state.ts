import { db } from '../src/config/database.js';

async function run() {
  await db.query('BEGIN');
  try {
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(60) UNIQUE`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS state_name VARCHAR(120)`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_state_account BOOLEAN NOT NULL DEFAULT FALSE`);

    await db.query(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS state_name VARCHAR(120)`);
    await db.query(`ALTER TABLE custom_fields ADD COLUMN IF NOT EXISTS state_name VARCHAR(120)`);
    await db.query(`ALTER TABLE modules ADD COLUMN IF NOT EXISTS state_name VARCHAR(120)`);
    await db.query(`ALTER TABLE sms_messages ADD COLUMN IF NOT EXISTS state_name VARCHAR(120)`);
    await db.query(`ALTER TABLE scheduled_messages ADD COLUMN IF NOT EXISTS state_name VARCHAR(120)`);

    await db.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_or_phone_required`);
    await db.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_or_phone_or_username_required`);
    await db.query(`
      ALTER TABLE users
      ADD CONSTRAINT users_email_or_phone_or_username_required
      CHECK (email IS NOT NULL OR phone IS NOT NULL OR username IS NOT NULL)
    `);

    await db.query(`ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_national_id_key`);
    await db.query(`ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_phone_key`);
    await db.query(`ALTER TABLE custom_fields DROP CONSTRAINT IF EXISTS custom_fields_field_key_key`);

    await db.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_clients_state_national ON clients(state_name, national_id)`);
    await db.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_clients_state_phone ON clients(state_name, phone)`);
    await db.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_custom_fields_state_key ON custom_fields(state_name, field_key)`);

    await db.query(`
      CREATE TABLE IF NOT EXISTS state_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        state_name VARCHAR(120) UNIQUE NOT NULL,
        settings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_by UUID REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS feature_registry (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        kind VARCHAR(20) NOT NULL CHECK (kind IN ('feature', 'page', 'button', 'action')),
        code VARCHAR(120) UNIQUE NOT NULL,
        name VARCHAR(150) NOT NULL,
        description TEXT,
        state_name VARCHAR(120),
        config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
        enabled BOOLEAN NOT NULL DEFAULT TRUE,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await db.query(`CREATE INDEX IF NOT EXISTS idx_users_state_name ON users(state_name)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_clients_state_name ON clients(state_name)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_custom_fields_state_name ON custom_fields(state_name)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_modules_state_name ON modules(state_name)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_sms_state_name ON sms_messages(state_name)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_scheduled_state_name ON scheduled_messages(state_name)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_state_settings_state_name ON state_settings(state_name)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_feature_registry_kind_enabled ON feature_registry(kind, enabled)`);

    await db.query('COMMIT');
    console.log('State migration completed successfully');
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  } finally {
    await db.end();
  }
}

run().catch(async (error) => {
  console.error(error);
  await db.end();
  process.exit(1);
});
