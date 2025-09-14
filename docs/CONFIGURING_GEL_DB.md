step 1. create extension pgcrypto; it is needed to install the auth
step 2. create extension auth;

step 3. CONFIGURE CURRENT DATABASE SET ext::auth::AuthConfig::auth_signing_key := 'your-super-secret-jwt-key-change-in-production-32-chars-min';
step 4. CONFIGURE CURRENT DATABASE SET ext::auth::AuthConfig::token_time_to_live := <duration>'168 hours';

step 5. CONFIGURE CURRENT DATABASE INSERT ext::auth::EmailPasswordProviderConfig {require_verification := false};
delete to change setting: CONFIGURE CURRENT DATABASE RESET ext::auth::EmailPasswordProviderConfig;

step 6. CONFIGURE CURRENT DATABASE SET ext::auth::AuthConfig::allowed_redirect_urls := {'http://localhost:5173/auth/verify', 'http://0.0.0.0:5173/auth/verify', 'http://127.0.0.1:5173/auth/verify'};

list of users:
option 1
SELECT ext::auth::EmailPasswordFactor {
email,
verified_at,
identity: {
id,
subject,
created_at,
issuer
}
};

option 2
SELECT ext::auth::Identity {
id,
subject,
created_at,
issuer
};

count total users:
SELECT count(ext::auth::EmailPasswordFactor);

delete all users
DELETE ext::auth::EmailPasswordFactor;
DELETE ext::auth::Identity;
DELETE ext::auth::AuthenticationAttempt;

check all identity records:
SELECT ext::auth::Identity {
id,
subject,
issuer,
created_at
} ORDER BY .created_at DESC;

verified vs unverified users
SELECT ext::auth::EmailPasswordFactor {
email,
is_verified := EXISTS .verified_at,
created_at,
verified_at
} ORDER BY .created_at DESC;

user registration statistics
SELECT {
total_users := count(ext::auth::EmailPasswordFactor),
verified_users := count(ext::auth::EmailPasswordFactor FILTER EXISTS .verified_at),
unverified_users := count(ext::auth::EmailPasswordFactor FILTER NOT EXISTS .verified_at),
newest_user := (SELECT ext::auth::EmailPasswordFactor ORDER BY .created_at DESC LIMIT 1).email,
oldest_user := (SELECT ext::auth::EmailPasswordFactor ORDER BY .created_at ASC LIMIT 1).email,
};

recent activity (last 24 hours)
SELECT ext::auth::EmailPasswordFactor {
email,
created_at,
verified_at
}
FILTER .created_at > datetime_of_statement() - <duration>'24 hours'
ORDER BY .created_at DESC;

users by registration date
SELECT ext::auth::EmailPasswordFactor {
email,
registration_date := <str>.created_at,
days_since_registration := datetime_of_statement() - .created_at
} ORDER BY .created_at DESC;

check all auth-related tables
SELECT schema::ObjectType {
name
} FILTER .name LIKE 'ext::auth::%'
ORDER BY .name;

comprehensive overview
SELECT ext::auth::EmailPasswordFactor {
email,
is_verified := EXISTS .verified_at,
created_at,
verified_at,
identity: {
id,
subject,
issuer,
created_at
}
} ORDER BY .created_at DESC;
