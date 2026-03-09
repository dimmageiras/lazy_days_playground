step 1. create extension pgcrypto; it is needed to install the auth
step 2. create extension auth;

step 3. CONFIGURE CURRENT DATABASE SET ext::auth::AuthConfig::auth_signing_key := 'your-super-secret-jwt-key-change-in-production-32-chars-min';
step 4. CONFIGURE CURRENT DATABASE SET ext::auth::AuthConfig::token_time_to_live := <duration>'168 hours';

step 5. CONFIGURE CURRENT DATABASE INSERT ext::auth::EmailPasswordProviderConfig {require_verification := false};
delete to change setting: CONFIGURE CURRENT DATABASE RESET ext::auth::EmailPasswordProviderConfig;

step 6. CONFIGURE CURRENT DATABASE SET ext::auth::AuthConfig::allowed_redirect_urls := {'http://localhost:5173/auth/verify', 'http://0.0.0.0:5173/auth/verify', 'http://127.0.0.1:5173/auth/verify'};

webhook (Gel calls POST /auth/webhook; use RESET then INSERT to change)
remove all webhook configs (use this instead of DELETE; WebhookConfig is a view):
CONFIGURE CURRENT BRANCH RESET ext::auth::WebhookConfig;

insert single webhook with signing secret (set GEL_WEBHOOK_SIGNING_SECRET in .env to same value):
CONFIGURE CURRENT BRANCH INSERT ext::auth::WebhookConfig {
url := 'http://localhost:5173/auth/webhook',
events := {
ext::auth::WebhookEvent.PasswordResetRequested,
ext::auth::WebhookEvent.EmailVerificationRequested,
},
signing_secret_key := 'YOUR_SIGNING_SECRET_HERE',
};

--- Webhook URL by environment ---

- Gel and app on same machine (no Docker): use url := 'http://localhost:5173/auth/webhook'
- Gel in Docker, app on host (e.g. dev): Gel cannot reach localhost; use the host from the container:
  url := 'http://host.docker.internal:5173/auth/webhook'
  (On Linux you may need the host IP, e.g. 172.17.0.1, if host.docker.internal is not available.)
- Gel in cloud / app behind NAT: use a public URL (e.g. ngrok: https://YOUR_SUBDOMAIN.ngrok.io/auth/webhook)

Check from inside the Gel container that the app is reachable:
curl -s -o /dev/null -w "%{http_code}" http://host.docker.internal:5173/
(200 = OK; 000 = no connection.)

For Code (OTP) verification flow, use Code method and OneTimeCodeRequested (see WEBHOOK_EMAIL_VERIFICATION_PLAN.md):
CONFIGURE CURRENT DATABASE RESET ext::auth::EmailPasswordProviderConfig;
CONFIGURE CURRENT DATABASE INSERT ext::auth::EmailPasswordProviderConfig {
require_verification := true,
verification_method := ext::auth::VerificationMethod.Code
};
CONFIGURE CURRENT BRANCH RESET ext::auth::WebhookConfig;
CONFIGURE CURRENT BRANCH INSERT ext::auth::WebhookConfig {
url := 'http://host.docker.internal:5173/auth/webhook',
events := { ext::auth::WebhookEvent.OneTimeCodeRequested },
signing_secret_key := 'YOUR_SIGNING_SECRET_HERE',
};
(Use localhost or a public URL instead of host.docker.internal if that matches your setup.)

--- Debug: verification email not received ---
Run these in order to check all DB-side areas.

1. Unverified users (recent first) — confirm signup created a factor and identity:
   SELECT ext::auth::EmailPasswordFactor {
   email,
   identity_id := .identity.id,
   created_at,
   verified_at,
   is_verified := EXISTS .verified_at
   } ORDER BY .created_at DESC;

2. Resolve email by identity_id (same logic as the webhook; replace ID with a real identity id from (1)):
   SELECT ext::auth::EmailPasswordFactor { email }
   FILTER .identity.id = <uuid>'PASTE_IDENTITY_ID_HERE'
   LIMIT 1;

3. Identity list (should match factor identities):
   SELECT ext::auth::Identity {
   id,
   subject,
   created_at
   } ORDER BY .created_at DESC;

4. Read current EmailPassword provider config (require_verification, verification_method):
   SELECT cfg::Config.extensions[is ext::auth::AuthConfig].providers[is ext::auth::EmailPasswordProviderConfig] {
   name,
   require_verification,
   verification_method
   };

If your auth config is on the branch only, try:
SELECT cfg::BranchConfig.extensions[is ext::auth::AuthConfig].providers[is ext::auth::EmailPasswordProviderConfig] {
name,
require_verification,
verification_method
};

5. Read current webhook config (url, events). Note: signing_secret_key is secret and cannot be selected.
   SELECT cfg::BranchConfig.extensions[is ext::auth::AuthConfig].webhooks {
   url,
   events
   };

If that returns {}, try database-level config:
SELECT cfg::Config.extensions[is ext::auth::AuthConfig].webhooks {
url,
events
};

--- Re-apply config (use if 4 or 5 show wrong values or empty) ---
Provider (Code + require verification):
CONFIGURE CURRENT DATABASE RESET ext::auth::EmailPasswordProviderConfig;
CONFIGURE CURRENT DATABASE INSERT ext::auth::EmailPasswordProviderConfig {
require_verification := true,
verification_method := ext::auth::VerificationMethod.Code
};

Webhook (OneTimeCodeRequested + URL). Use host.docker.internal if Gel runs in Docker and app on host; otherwise localhost or your public URL:
CONFIGURE CURRENT BRANCH RESET ext::auth::WebhookConfig;
CONFIGURE CURRENT BRANCH INSERT ext::auth::WebhookConfig {
url := 'http://host.docker.internal:5173/auth/webhook',
events := { ext::auth::WebhookEvent.OneTimeCodeRequested },
signing_secret_key := 'SAME_AS_GEL_WEBHOOK_SIGNING_SECRET_IN_ENV',
};

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

--- One-time codes (Code verification method) ---
Codes are stored as hashes (code_hash); the plaintext code cannot be retrieved from the DB.
List recent one-time code records (factor, identity, expires_at):
SELECT ext::auth::OneTimeCode {
id,
created_at,
expires_at,
factor: {
id,
[is ext::auth::EmailPasswordFactor].email,
identity: { id }
}
} ORDER BY .created_at DESC;

By identity_id (replace UUID):
SELECT ext::auth::OneTimeCode {
created_at,
expires_at,
factor: { [is ext::auth::EmailPasswordFactor].email }
} FILTER .factor.identity.id = <uuid>'PASTE_IDENTITY_ID_HERE'
ORDER BY .created_at DESC;

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

create CspReport
CREATE TYPE default::CspReport {
CREATE REQUIRED PROPERTY blocked_uri -> std::str;
CREATE PROPERTY column_number -> std::int32;
CREATE REQUIRED PROPERTY created_at -> std::datetime { SET default := std::datetime_current(); SET readonly := true; };
CREATE PROPERTY disposition -> std::str { SET default := "enforce"; };
CREATE REQUIRED PROPERTY document_uri -> std::str;
CREATE REQUIRED PROPERTY effective_directive -> std::str;
CREATE PROPERTY identity_id -> std::str;
CREATE PROPERTY ip_address -> std::str;
CREATE PROPERTY line_number -> std::int32;
CREATE REQUIRED PROPERTY original_policy -> std::str;
CREATE REQUIRED PROPERTY referrer -> std::str { SET default := ""; };
CREATE PROPERTY source_file -> std::str;
CREATE REQUIRED PROPERTY status_code -> std::int16 { SET default := 0; };
CREATE PROPERTY user_agent -> std::str;
};

create an easy CSP violation

<div>
  <script>
    alert('This will trigger CSP!');
  </script>
</div>

find CspReports
SELECT default::CspReport {
blocked_uri,
document_uri,
effective_directive,
original_policy,
referrer,
status_code,
disposition,
source_file,
identity_id,
line_number,
column_number,
user_agent,
ip_address,
created_at
} ORDER BY .created_at DESC;

deleted the reports
DELETE CspReport;

drop the reports
DROP TYPE default::CspReport;
