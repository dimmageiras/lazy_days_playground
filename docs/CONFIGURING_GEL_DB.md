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

delete all users
DELETE ext::auth::EmailPasswordFactor;
DELETE ext::auth::Identity;
DELETE ext::auth::AuthenticationAttempt;
