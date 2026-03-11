const UPDATE_OTP_QUERY = `
  UPDATE (
    SELECT ext::auth::OneTimeCode
    FILTER .factor.identity.id = <uuid>$identity_id
    ORDER BY .created_at DESC
    LIMIT 1
  )
  SET {
    code_hash := <bytes>$hash,
    expires_at := <datetime>$expiresAt,
  }
` as const;

export { UPDATE_OTP_QUERY };
