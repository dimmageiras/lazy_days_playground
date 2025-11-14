const DELETE_CSP_REPORT_QUERY = `
  DELETE default::CspReport
  FILTER .id = <uuid>$id
` as const;

export { DELETE_CSP_REPORT_QUERY };
