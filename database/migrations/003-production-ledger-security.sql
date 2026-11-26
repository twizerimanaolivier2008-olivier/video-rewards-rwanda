-- Apply this migration to a verified backup/staging database first.
-- Requires MySQL 8.0+ (JSON, enforced CHECK constraints, InnoDB).

CREATE TABLE IF NOT EXISTS api_rate_limits (
    scope VARCHAR(64) NOT NULL,
    client_hash CHAR(64) NOT NULL,
    window_start BIGINT UNSIGNED NOT NULL,
    request_count INT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (scope, client_hash, window_start),
    INDEX idx_api_rate_limits_window (window_start)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS video_watch_sessions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    video_id INT NOT NULL,
    session_hash CHAR(64) NOT NULL UNIQUE,
    started_at_ms BIGINT UNSIGNED NOT NULL,
    last_heartbeat_at_ms BIGINT UNSIGNED NOT NULL,
    last_position_ms BIGINT UNSIGNED NOT NULL DEFAULT 0,
    watched_ms BIGINT UNSIGNED NOT NULL DEFAULT 0,
    expires_at_ms BIGINT UNSIGNED NOT NULL,
    completed_at_ms BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_watch_session_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_watch_session_video FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    INDEX idx_watch_session_user_video (user_id, video_id, completed_at_ms),
    INDEX idx_watch_session_expiry (expires_at_ms)
) ENGINE=InnoDB;

ALTER TABLE withdrawals
    ADD COLUMN funds_reserved BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS ledger_accounts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    account_code VARCHAR(128) NOT NULL UNIQUE,
    user_id INT NULL,
    account_type ENUM('asset', 'liability', 'equity', 'income', 'expense') NOT NULL,
    currency CHAR(3) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ledger_account_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_ledger_account_user_currency (user_id, currency)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ledger_journals (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    event_id VARCHAR(128) NOT NULL UNIQUE,
    event_type VARCHAR(64) NOT NULL,
    reference VARCHAR(128) NULL,
    currency CHAR(3) NOT NULL,
    metadata_json JSON NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ledger_journal_created (created_at),
    INDEX idx_ledger_journal_reference (reference)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ledger_entries (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    journal_id BIGINT UNSIGNED NOT NULL,
    account_id BIGINT UNSIGNED NOT NULL,
    side ENUM('debit', 'credit') NOT NULL,
    amount_minor BIGINT UNSIGNED NOT NULL,
    currency CHAR(3) NOT NULL,
    entry_hash CHAR(64) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ledger_entry_journal FOREIGN KEY (journal_id) REFERENCES ledger_journals(id) ON DELETE RESTRICT,
    CONSTRAINT fk_ledger_entry_account FOREIGN KEY (account_id) REFERENCES ledger_accounts(id) ON DELETE RESTRICT,
    CONSTRAINT chk_ledger_entry_positive CHECK (amount_minor > 0),
    INDEX idx_ledger_entries_journal (journal_id),
    INDEX idx_ledger_entries_account (account_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ledger_outbox (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    event_id VARCHAR(128) NOT NULL UNIQUE,
    event_type VARCHAR(64) NOT NULL,
    payload_json JSON NOT NULL,
    attempts INT UNSIGNED NOT NULL DEFAULT 0,
    available_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ledger_outbox_pending (published_at, available_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    actor_id INT NULL,
    action VARCHAR(96) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(128) NULL,
    request_id VARCHAR(128) NULL,
    metadata_json JSON NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_audit_actor_created (actor_id, created_at),
    INDEX idx_audit_entity (entity_type, entity_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS idempotency_keys (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    principal_id VARCHAR(128) NOT NULL,
    route_key VARCHAR(128) NOT NULL,
    key_hash CHAR(64) NOT NULL,
    response_status SMALLINT UNSIGNED NULL,
    response_json JSON NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_idempotency_principal_route (principal_id, route_key, key_hash),
    INDEX idx_idempotency_expiry (expires_at)
) ENGINE=InnoDB;

CREATE INDEX idx_transactions_payment_reference ON transactions(payment_reference);
CREATE INDEX idx_videos_active_category_created ON videos(is_active, category, created_at);

DELIMITER $$
CREATE TRIGGER ledger_entries_no_update
BEFORE UPDATE ON ledger_entries
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Ledger entries are append-only';
END$$

CREATE TRIGGER ledger_entries_no_delete
BEFORE DELETE ON ledger_entries
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Ledger entries are append-only';
END$$

CREATE TRIGGER ledger_journals_no_update
BEFORE UPDATE ON ledger_journals
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Ledger journals are append-only';
END$$

CREATE TRIGGER ledger_journals_no_delete
BEFORE DELETE ON ledger_journals
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Ledger journals are append-only';
END$$
DELIMITER ;

-- Retention: schedule deletion of expired api_rate_limits and idempotency_keys.
-- Keep audit_logs and ledger tables according to your legal/finance retention policy.
