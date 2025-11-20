-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,                -- UUID
    -- Identity
    email_hash TEXT UNIQUE NOT NULL,         -- sha256(email)
    email_cipher TEXT NOT NULL,              -- AES encrypted email
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    -- Authentication
    password_hash TEXT NOT NULL,             -- bcrypt
    password_changed_at DATETIME,            -- invalidate old tokens on password change
    -- Optional Contact Info
    phone_cipher TEXT,                       -- AES encrypted phone
    -- Profile
    addresses_cipher TEXT,                   -- AES encrypted JSON array of addresses
    profile_image_url TEXT,                  -- avatar URL
    language TEXT DEFAULT 'en',              -- locale preference
    default_currency TEXT DEFAULT 'USD',     -- currency preference
    -- Membership
    is_member BOOLEAN DEFAULT 0,             -- membership flag
    status TEXT DEFAULT 'active',            -- active, disabled, banned
    disabled_reason TEXT,                    -- reason for disabling account
    -- Audit / Logs
    created_ip TEXT,                         -- IP at signup
    last_login_ip TEXT,                      -- IP at last login
    user_agent TEXT,                         -- device info at signup
    last_login_at DATETIME,                  -- timestamp of last login
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email_hash ON users(email_hash);

-- REFRESH TOKENS TABLE
CREATE TABLE IF NOT EXISTS refresh_tokens (
    token_id TEXT PRIMARY KEY,               -- UUID for this refresh token record
    user_id TEXT NOT NULL,                   -- FK to users.user_id
    token_hash TEXT NOT NULL,                -- sha256(refresh_token)
    user_agent TEXT,                         -- device/browser used for issuing token
    ip_address TEXT,                         -- IP at issuance
    expires_at DATETIME NOT NULL,            -- expires in 7 days
    revoked_at DATETIME,                     -- when user logs out / token rotated
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at);


