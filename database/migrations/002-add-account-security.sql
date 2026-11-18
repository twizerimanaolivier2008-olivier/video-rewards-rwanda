ALTER TABLE users
    ADD COLUMN profile_image_url VARCHAR(500) NULL,
    ADD COLUMN email_verified_at TIMESTAMP NULL DEFAULT NULL;

CREATE TABLE IF NOT EXISTS account_email_verification_codes (
    user_id INT NOT NULL,
    purpose VARCHAR(32) NOT NULL,
    email VARCHAR(100) NOT NULL,
    code_hash CHAR(64) NOT NULL,
    attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, purpose),
    CONSTRAINT fk_account_email_verification_codes_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
