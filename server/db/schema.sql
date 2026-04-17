CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_status AS ENUM ('active', 'suspended', 'deleted');
CREATE TYPE message_channel AS ENUM ('sms', 'whatsapp', 'email');
CREATE TYPE message_status AS ENUM ('pending', 'queued', 'sending', 'sent', 'failed', 'cancelled');
CREATE TYPE recurrence_type AS ENUM ('none', 'daily', 'weekly', 'monthly');
CREATE TYPE field_type AS ENUM ('text', 'number', 'phone', 'email', 'date', 'select', 'checkbox', 'textarea', 'url');

CREATE TABLE roles (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	code VARCHAR(50) UNIQUE NOT NULL,
	name VARCHAR(100) NOT NULL,
	description TEXT,
	is_system BOOLEAN NOT NULL DEFAULT FALSE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE permissions (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	code VARCHAR(100) UNIQUE NOT NULL,
	module VARCHAR(50) NOT NULL,
	action VARCHAR(50) NOT NULL,
	description TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE role_permissions (
	role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
	permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
	PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE users (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	role_id UUID NOT NULL REFERENCES roles(id),
	full_name VARCHAR(150) NOT NULL,
	email VARCHAR(190) UNIQUE,
	phone VARCHAR(20) UNIQUE,
	password_hash TEXT NOT NULL,
	status user_status NOT NULL DEFAULT 'active',
	is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
	is_phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
	last_login_at TIMESTAMPTZ,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	CONSTRAINT users_email_or_phone_required CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE TABLE auth_otps (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id UUID REFERENCES users(id) ON DELETE CASCADE,
	destination VARCHAR(190) NOT NULL,
	purpose VARCHAR(30) NOT NULL,
	otp_hash TEXT NOT NULL,
	attempts INT NOT NULL DEFAULT 0,
	expires_at TIMESTAMPTZ NOT NULL,
	consumed_at TIMESTAMPTZ,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE auth_refresh_tokens (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	token_hash TEXT NOT NULL,
	user_agent TEXT,
	ip_address VARCHAR(64),
	expires_at TIMESTAMPTZ NOT NULL,
	revoked_at TIMESTAMPTZ,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE modules (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	code VARCHAR(100) UNIQUE NOT NULL,
	name VARCHAR(120) NOT NULL,
	description TEXT,
	enabled BOOLEAN NOT NULL DEFAULT TRUE,
	created_by UUID REFERENCES users(id),
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE clients (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	full_name VARCHAR(150) NOT NULL,
	national_id VARCHAR(30) UNIQUE NOT NULL,
	phone VARCHAR(20) UNIQUE NOT NULL,
	email VARCHAR(190),
	region VARCHAR(120),
	status VARCHAR(20) NOT NULL DEFAULT 'active',
	created_by UUID REFERENCES users(id),
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE custom_fields (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	field_key VARCHAR(100) UNIQUE NOT NULL,
	label VARCHAR(150) NOT NULL,
	type field_type NOT NULL,
	required BOOLEAN NOT NULL DEFAULT FALSE,
	unique_value BOOLEAN NOT NULL DEFAULT FALSE,
	show_in_list BOOLEAN NOT NULL DEFAULT TRUE,
	filterable BOOLEAN NOT NULL DEFAULT TRUE,
	options_json JSONB,
	sort_order INT NOT NULL DEFAULT 0,
	is_active BOOLEAN NOT NULL DEFAULT TRUE,
	created_by UUID REFERENCES users(id),
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE client_field_values (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
	field_id UUID NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
	value_text TEXT,
	value_number NUMERIC,
	value_date DATE,
	value_bool BOOLEAN,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	UNIQUE (client_id, field_id)
);

CREATE TABLE sms_messages (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	channel message_channel NOT NULL DEFAULT 'sms',
	sender_id VARCHAR(30),
	recipient_phone VARCHAR(20),
	recipient_client_id UUID REFERENCES clients(id),
	body TEXT NOT NULL,
	status message_status NOT NULL DEFAULT 'pending',
	provider_message_id VARCHAR(120),
	error_code VARCHAR(50),
	error_message TEXT,
	attempts INT NOT NULL DEFAULT 0,
	scheduled_message_id UUID,
	created_by UUID REFERENCES users(id),
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	sent_at TIMESTAMPTZ
);

CREATE TABLE scheduled_messages (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	name VARCHAR(150) NOT NULL,
	channel message_channel NOT NULL DEFAULT 'sms',
	body_template TEXT NOT NULL,
	target_type VARCHAR(20) NOT NULL,
	target_payload JSONB NOT NULL,
	scheduled_at TIMESTAMPTZ NOT NULL,
	recurrence recurrence_type NOT NULL DEFAULT 'none',
	recurrence_payload JSONB,
	active BOOLEAN NOT NULL DEFAULT TRUE,
	last_run_at TIMESTAMPTZ,
	next_run_at TIMESTAMPTZ,
	created_by UUID REFERENCES users(id),
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE sms_messages
	ADD CONSTRAINT fk_scheduled_messages
	FOREIGN KEY (scheduled_message_id)
	REFERENCES scheduled_messages(id)
	ON DELETE SET NULL;

CREATE TABLE audit_logs (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	actor_user_id UUID REFERENCES users(id),
	action VARCHAR(100) NOT NULL,
	entity_type VARCHAR(80) NOT NULL,
	entity_id UUID,
	metadata JSONB,
	ip_address VARCHAR(64),
	user_agent TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_otps_destination ON auth_otps(destination);
CREATE INDEX idx_otps_expires_at ON auth_otps(expires_at);
CREATE INDEX idx_refresh_user_id ON auth_refresh_tokens(user_id);
CREATE INDEX idx_modules_enabled ON modules(enabled);
CREATE INDEX idx_clients_region ON clients(region);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_custom_fields_active_sort ON custom_fields(is_active, sort_order);
CREATE INDEX idx_field_values_client ON client_field_values(client_id);
CREATE INDEX idx_field_values_field ON client_field_values(field_id);
CREATE INDEX idx_sms_status_created_at ON sms_messages(status, created_at DESC);
CREATE INDEX idx_sms_recipient_phone ON sms_messages(recipient_phone);
CREATE INDEX idx_scheduled_next_run ON scheduled_messages(next_run_at) WHERE active = TRUE;
CREATE INDEX idx_audit_actor_created_at ON audit_logs(actor_user_id, created_at DESC);

INSERT INTO roles (code, name, description, is_system)
VALUES
	('owner', 'مالك', 'صلاحيات كاملة على النظام', TRUE),
	('supervisor', 'مشرف', 'إدارة العمليات اليومية بدون صلاحيات المالك', TRUE),
	('member', 'عضو', 'وصول محدود للمهام الأساسية', TRUE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO permissions (code, module, action, description)
VALUES
	('users.read', 'users', 'read', 'قراءة المستخدمين'),
	('users.create', 'users', 'create', 'إضافة مستخدم'),
	('users.update', 'users', 'update', 'تعديل مستخدم'),
	('users.delete', 'users', 'delete', 'حذف مستخدم'),
	('roles.manage', 'roles', 'manage', 'إدارة الأدوار والصلاحيات'),
	('clients.read', 'clients', 'read', 'قراءة العملاء'),
	('clients.create', 'clients', 'create', 'إضافة عميل'),
	('clients.update', 'clients', 'update', 'تعديل عميل'),
	('clients.delete', 'clients', 'delete', 'حذف عميل'),
	('fields.manage', 'fields', 'manage', 'إدارة الحقول الديناميكية'),
	('messages.send_single', 'messages', 'send_single', 'إرسال رسالة فردية'),
	('messages.send_bulk', 'messages', 'send_bulk', 'إرسال رسالة جماعية'),
	('messages.schedule', 'messages', 'schedule', 'جدولة الرسائل'),
	('modules.manage', 'modules', 'manage', 'إدارة الميزات'),
	('settings.manage', 'settings', 'manage', 'إدارة الإعدادات')
ON CONFLICT (code) DO NOTHING;

INSERT INTO modules (code, name, description, enabled)
VALUES
	('dashboard', 'لوحة التحكم', 'إحصائيات ومؤشرات الأداء', TRUE),
	('clients', 'العملاء', 'إدارة العملاء والحقول الثابتة', TRUE),
	('dynamic_fields', 'الحقول الديناميكية', 'بناء الحقول بدون برمجة', TRUE),
	('messaging', 'الرسائل', 'إرسال وجدولة الرسائل', TRUE),
	('rbac', 'الصلاحيات', 'إدارة الأدوار والوصول', TRUE),
	('settings', 'الإعدادات', 'إعدادات النظام العامة', TRUE)
ON CONFLICT (code) DO NOTHING;
