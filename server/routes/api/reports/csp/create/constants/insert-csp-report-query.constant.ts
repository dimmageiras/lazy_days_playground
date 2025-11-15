const INSERT_CSP_REPORT_QUERY = `
  INSERT default::CspReport {
    blocked_uri := <str>$blocked_uri,
    column_number := <optional int32>$column_number,
    disposition := <optional str>$disposition,
    document_uri := <str>$document_uri,
    effective_directive := <str>$effective_directive,
    identity_id := <optional str>$identity_id,
    ip_address := <optional str>$ip_address,
    line_number := <optional int32>$line_number,
    original_policy := <str>$original_policy,
    referrer := <str>$referrer,
    source_file := <optional str>$source_file,
    status_code := <int16>$status_code,
    user_agent := <optional str>$user_agent
  }
` as const;

export { INSERT_CSP_REPORT_QUERY };
