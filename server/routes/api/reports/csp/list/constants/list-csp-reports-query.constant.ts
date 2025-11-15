const LIST_CSP_REPORTS_QUERY = `
  SELECT default::CspReport {
    id,
    blocked_uri,
    column_number,
    created_at,
    disposition,
    document_uri,
    effective_directive,
    identity_id,
    ip_address,
    line_number,
    original_policy,
    referrer,
    source_file,
    status_code,
    user_agent
  }
  ORDER BY .created_at DESC
` as const;

export { LIST_CSP_REPORTS_QUERY };
