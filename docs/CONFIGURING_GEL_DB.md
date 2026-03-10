# Configuring GEL DB

## First steps (initial setup)

Run these in order to set up auth from scratch:

1. Create extension pgcrypto (required for auth):

   ```edgeql
   CREATE EXTENSION pgcrypto;
   ```

2. Create extension auth:

   ```edgeql
   CREATE EXTENSION auth;
   ```

3. Set auth signing key:

   ```edgeql
   CONFIGURE CURRENT DATABASE SET ext::auth::AuthConfig::auth_signing_key := 'PASTE_COOKIE_SECRET';
   ```

4. Set token time to live:

   ```edgeql
   CONFIGURE CURRENT DATABASE SET ext::auth::AuthConfig::token_time_to_live := <duration>'4 hours';
   ```

5. Insert EmailPassword provider config with Code (OTP) verification:

   ```edgeql
   CONFIGURE CURRENT DATABASE INSERT ext::auth::EmailPasswordProviderConfig {
     require_verification := true,
     verification_method := ext::auth::VerificationMethod.Code
   };
   ```

6. Set allowed redirect URLs. For local dev without Docker you can use:
   `{'http://localhost:5173/auth/verify', 'http://0.0.0.0:5173/auth/verify', 'http://127.0.0.1:5173/auth/verify'}`. With Gel in Docker and app on host, use `{'http://host.docker.internal:5173/verify'}` (or your app URL).
   ```edgeql
   CONFIGURE CURRENT DATABASE SET ext::auth::AuthConfig::allowed_redirect_urls := {'http://host.docker.internal:5173/verify'};
   ```

---

## AuthConfig

- Set auth signing key (at least 32 characters in production):
  ```edgeql
  CONFIGURE CURRENT DATABASE SET ext::auth::AuthConfig::auth_signing_key := 'PASTE_COOKIE_SECRET';
  ```
- Set token time to live:
  ```edgeql
  CONFIGURE CURRENT DATABASE SET ext::auth::AuthConfig::token_time_to_live := <duration>'4 hours';
  ```
- Set allowed redirect URLs:
  ```edgeql
  CONFIGURE CURRENT DATABASE SET ext::auth::AuthConfig::allowed_redirect_urls := {'http://host.docker.internal:5173/verify'};
  ```
- Get token time to live:
  ```edgeql
  SELECT cfg::Config.extensions[is ext::auth::AuthConfig] {
    token_time_to_live
  }
  ```
- Reset allowed redirect URLs:
  ```edgeql
  CONFIGURE CURRENT DATABASE RESET ext::auth::AuthConfig::allowed_redirect_urls;
  ```
- Reset token time to live:
  ```edgeql
  CONFIGURE CURRENT DATABASE RESET ext::auth::AuthConfig::token_time_to_live;
  ```

## Providers

- Insert EmailPassword provider config:
  ```edgeql
  CONFIGURE CURRENT DATABASE INSERT ext::auth::EmailPasswordProviderConfig { require_verification := true };
  ```
- Insert EmailPassword provider config with Code (OTP) verification:
  ```edgeql
  CONFIGURE CURRENT DATABASE RESET ext::auth::EmailPasswordProviderConfig;
  CONFIGURE CURRENT DATABASE INSERT ext::auth::EmailPasswordProviderConfig {
    require_verification := true,
    verification_method := ext::auth::VerificationMethod.Code
  };
  ```
- Get all available provider types:
  ```edgeql
  SELECT schema::ObjectType {
    name
  }
  FILTER .name LIKE 'ext::auth::%ProviderConfig%'
  OR .name LIKE 'ext::auth::%OAuthProvider%'
  ```
- Get active providers:
  ```edgeql
  SELECT cfg::Config.extensions[is ext::auth::AuthConfig].providers { name }
  ```
- Read current EmailPassword provider config (require_verification, verification_method):
  ```edgeql
  SELECT cfg::Config.extensions[is ext::auth::AuthConfig].providers[is ext::auth::EmailPasswordProviderConfig] {
    name,
    require_verification,
    verification_method
  };
  ```
  If config is on the branch only:
  ```edgeql
  SELECT cfg::BranchConfig.extensions[is ext::auth::AuthConfig].providers[is ext::auth::EmailPasswordProviderConfig] {
    name,
    require_verification,
    verification_method
  };
  ```
- Reset EmailPassword provider config:
  ```edgeql
  CONFIGURE CURRENT DATABASE RESET ext::auth::EmailPasswordProviderConfig;
  ```
  **Re-apply config:** If provider or webhook config shows wrong or empty values, run the corresponding RESET then INSERT above (e.g. Provider with Code + require verification, then Webhook with OneTimeCodeRequested).

## Webhooks

- Insert webhook with signing secret (set GEL_WEBHOOK_SIGNING_SECRET in .env to same value):

  ```edgeql
  CONFIGURE CURRENT BRANCH INSERT ext::auth::WebhookConfig {
    url := 'http://localhost:5173/auth/webhook',
    events := {
      ext::auth::WebhookEvent.PasswordResetRequested,
      ext::auth::WebhookEvent.EmailVerificationRequested,
    },
    signing_secret_key := 'YOUR_SIGNING_SECRET_HERE',
  };
  ```

  For Code (OTP) verification flow use OneTimeCodeRequested:

  ```edgeql
  CONFIGURE CURRENT BRANCH RESET ext::auth::WebhookConfig;
  CONFIGURE CURRENT BRANCH INSERT ext::auth::WebhookConfig {
    url := 'http://host.docker.internal:5173/auth/webhook',
    events := { ext::auth::WebhookEvent.OneTimeCodeRequested },
    signing_secret_key := 'YOUR_SIGNING_SECRET_HERE',
  };
  ```

  (Use localhost or a public URL instead of host.docker.internal if that matches your setup.)

- **Webhook URL by environment:**
  - Gel and app on same machine (no Docker): `url := 'http://localhost:5173/auth/webhook'`
  - Gel in Docker, app on host: Gel cannot reach localhost; use `url := 'http://host.docker.internal:5173/auth/webhook'` (on Linux you may need the host IP, e.g. `172.17.0.1`, if host.docker.internal is not available)
  - Gel in cloud / app behind NAT: use a public URL (e.g. ngrok: `https://YOUR_SUBDOMAIN.ngrok.io/auth/webhook`)

- Check from inside the Gel container that the app is reachable:

  ```bash
  curl -s -o /dev/null -w "%{http_code}" http://host.docker.internal:5173/
  ```

  (200 = OK; 000 = no connection.)

- Get all webhook event types:
  ```edgeql
  SELECT schema::ScalarType.enum_values
  FILTER schema::ScalarType.name = 'ext::auth::WebhookEvent'
  ```
- Get active webhooks (branch config):
  ```edgeql
  SELECT cfg::BranchConfig.extensions[is ext::auth::AuthConfig].webhooks {
    url,
    events
  };
  ```
  If that returns {}, try database-level config:
  ```edgeql
  SELECT cfg::Config.extensions[is ext::auth::AuthConfig].webhooks {
    url,
    events
  };
  ```
  **Note:** `signing_secret_key` is secret and cannot be selected.
- Reset webhook config:
  ```edgeql
  CONFIGURE CURRENT BRANCH RESET ext::auth::WebhookConfig;
  ```
  **Note:** Use RESET then INSERT to change webhooks; `WebhookConfig` is a view (no DELETE).

## Users and identity

**Debug: verification email not received** — Run in order: (1) Unverified users (recent first), (2) Resolve email by identity_id, (3) Identity list, (4) Read current EmailPassword provider config (Providers section), (5) Read current webhook config (Webhooks section). If (4) or (5) show wrong or empty values, re-apply config (see note in Providers).

- Delete all users (EmailPassword factors, identities, attempts):
  ```edgeql
  DELETE ext::auth::EmailPasswordFactor;
  DELETE ext::auth::Identity;
  DELETE ext::auth::AuthenticationAttempt;
  ```
- Get user identity_id by email:
  ```edgeql
  SELECT ext::auth::EmailPasswordFactor {
    email,
    identity: { id }
  }
  FILTER .email = 'PASTE_USER_EMAIL_HERE'
  ```
- Get latest OTP by identity_id:
  ```edgeql
  SELECT ext::auth::OneTimeCode {
    code_hash,
    expires_at,
    created_at,
    factor: { identity: { id } }
  }
  FILTER .factor.identity.id = <uuid>'PASTE_IDENTITY_ID_HERE'
  ORDER BY .created_at DESC
  LIMIT 1
  ```
- Resolve email by identity_id:
  ```edgeql
  SELECT ext::auth::EmailPasswordFactor { email }
  FILTER .identity.id = <uuid>'PASTE_IDENTITY_ID_HERE'
  LIMIT 1;
  ```
- Unverified users (recent first; for debug):
  ```edgeql
  SELECT ext::auth::EmailPasswordFactor {
    email,
    identity_id := .identity.id,
    created_at,
    verified_at,
    is_verified := EXISTS .verified_at
  } ORDER BY .created_at DESC;
  ```
- Identity list (minimal: id, subject, created_at):
  ```edgeql
  SELECT ext::auth::Identity {
    id,
    subject,
    created_at
  } ORDER BY .created_at DESC;
  ```
- Identity list with issuer (all identity records):
  ```edgeql
  SELECT ext::auth::Identity {
    id,
    subject,
    issuer,
    created_at
  } ORDER BY .created_at DESC;
  ```
- Count total users:
  ```edgeql
  SELECT count(ext::auth::EmailPasswordFactor);
  ```
- Unverified / verified users (recent first; omit `identity_id` for a simpler overview):
  ```edgeql
  SELECT ext::auth::EmailPasswordFactor {
    email,
    identity_id := .identity.id,
    created_at,
    verified_at,
    is_verified := EXISTS .verified_at
  } ORDER BY .created_at DESC;
  ```
- User registration statistics:
  ```edgeql
  SELECT {
    total_users := count(ext::auth::EmailPasswordFactor),
    verified_users := count(ext::auth::EmailPasswordFactor FILTER EXISTS .verified_at),
    unverified_users := count(ext::auth::EmailPasswordFactor FILTER NOT EXISTS .verified_at),
    newest_user := (SELECT ext::auth::EmailPasswordFactor ORDER BY .created_at DESC LIMIT 1).email,
    oldest_user := (SELECT ext::auth::EmailPasswordFactor ORDER BY .created_at ASC LIMIT 1).email,
  };
  ```
- Recent activity (last 24 hours):
  ```edgeql
  SELECT ext::auth::EmailPasswordFactor {
    email,
    created_at,
    verified_at
  }
  FILTER .created_at > datetime_of_statement() - <duration>'24 hours'
  ORDER BY .created_at DESC;
  ```
- Users by registration date:
  ```edgeql
  SELECT ext::auth::EmailPasswordFactor {
    email,
    registration_date := <str>.created_at,
    days_since_registration := datetime_of_statement() - .created_at
  } ORDER BY .created_at DESC;
  ```
- List users with factor and identity (comprehensive overview):
  ```edgeql
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
  ```

## One-time codes

Codes are stored as hashes (`code_hash`); plaintext cannot be retrieved from the DB.

- List recent one-time code records:
  ```edgeql
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
  ```
- One-time codes by identity_id (with email):
  ```edgeql
  SELECT ext::auth::OneTimeCode {
    created_at,
    expires_at,
    factor: { [is ext::auth::EmailPasswordFactor].email }
  }
  FILTER .factor.identity.id = <uuid>'PASTE_IDENTITY_ID_HERE'
  ORDER BY .created_at DESC;
  ```

## Schema

- List all auth-related object types:
  ```edgeql
  SELECT schema::ObjectType {
    name
  } FILTER .name LIKE 'ext::auth::%'
  ORDER BY .name;
  ```

## CspReport

- Create `CspReport` type:
  ```edgeql
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
  ```
- Find CspReports:
  ```edgeql
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
  ```
- Delete all CspReports:
  ```edgeql
  DELETE default::CspReport;
  ```
- Drop CspReport type:
  ```edgeql
  DROP TYPE default::CspReport;
  ```
- To trigger a CSP violation (HTML, for testing):
  ```html
  <div>
    <script>
      alert("This will trigger CSP!");
    </script>
  </div>
  ```
