import axios, { AxiosError } from "axios";

const PASS = "password";

// Base URL of the server
const BASE_URL = "http://localhost:5173";

// List of all available endpoints with their HTTP methods
const endpoints = [
  // Auth endpoints (POST requests - require body)
  {
    method: "POST",
    path: "/auth/signin",
    body: { email: "test@example.com", [PASS]: "password123" },
  },
  {
    method: "POST",
    path: "/auth/signup",
    body: { email: "test@example.com", [PASS]: "password123" },
  },
  { method: "POST", path: "/auth/logout", body: {} },
  { method: "POST", path: "/auth/verify", body: { token: "dummy-token" } },
  { method: "GET", path: "/auth/verify-auth" },

  // User endpoints (POST requests - require body)
  {
    method: "POST",
    path: "/user/check-email",
    body: { email: "test@example.com" },
  },

  // API Health endpoints (GET requests)
  { method: "GET", path: "/api/health/server" },
  { method: "GET", path: "/api/health/database" },

  // API Reports endpoints
  {
    method: "POST",
    path: "/api/reports/csp/report",
    body: {
      "csp-report": {
        "blocked-uri": "http://example.com",
        "column-number": 1,
        disposition: "enforce",
        "document-uri": "http://localhost:5173",
        "effective-directive": "script-src",
        "line-number": 1,
        "original-policy": "default-src 'self'",
        referrer: "",
        "source-file": "http://localhost:5173",
        "status-code": 200,
      },
    },
  },
  { method: "GET", path: "/api/reports/csp/list" },
  { method: "DELETE", path: "/api/reports/csp/delete/dummy-id" },
  { method: "DELETE", path: "/api/reports/csp/clear" },
];

// Function to make a request to an endpoint
async function makeRequest(
  endpoint: { method: string; path: string; body?: Record<string, unknown> },
  attemptNumber: number
) {
  const url = `${BASE_URL}${endpoint.path}`;
  const config = {
    method: endpoint.method,
    url: url,
    headers: {
      "Content-Type": "application/json",
      // Add CSP report content type for CSP endpoints
      ...(endpoint.path.includes("/csp/report") && {
        "Content-Type": "application/csp-report",
      }),
    },
    timeout: 10000, // 10 second timeout
  };

  // Add body for POST/DELETE requests that require it
  if (endpoint.body && ["POST", "DELETE"].includes(endpoint.method)) {
    Reflect.set(config, "data", endpoint.body);
  }

  try {
    const response = await axios(config);

    return {
      success: true,
      status: response.status,
      endpoint: endpoint.path,
      attempt: attemptNumber,
      headers: {
        "x-ratelimit-limit": response.headers["x-ratelimit-limit"],
        "x-ratelimit-remaining": response.headers["x-ratelimit-remaining"],
        "x-ratelimit-reset": response.headers["x-ratelimit-reset"],
        "retry-after": response.headers["retry-after"],
      },
    };
  } catch (error) {
    if (error instanceof AxiosError) {
      return {
        success: false,
        status: error.response?.status || "TIMEOUT",
        endpoint: endpoint.path,
        attempt: attemptNumber,
        error: error.response?.data || error.message,
        headers: error.response?.headers
          ? {
              "x-ratelimit-limit": error.response.headers["x-ratelimit-limit"],
              "x-ratelimit-remaining":
                error.response.headers["x-ratelimit-remaining"],
              "x-ratelimit-reset": error.response.headers["x-ratelimit-reset"],
              "retry-after": error.response.headers["retry-after"],
            }
          : {},
      };
    }
  }
}

// Process individual request result and update counters
function processRequestResult(
  result: Awaited<ReturnType<typeof makeRequest>>,
  results: {
    successful: number;
    rateLimited: number;
    otherErrors: number;
  }
) {
  if (result?.success) {
    results.successful++;
  } else if (result?.status === 429) {
    results.rateLimited++;
  } else {
    results.otherErrors++;
  }
}

// Log progress for a request
function logRequestProgress(
  result: Awaited<ReturnType<typeof makeRequest>>,
  requestNumber: number,
  totalRequests: number
) {
  if (!result) {
    return;
  }

  if (result.success) {
    if (requestNumber % 50 === 0) {
      console.info(
        `  ✅ Request ${requestNumber}/${totalRequests} - Success (${result.status})`
      );
    }
  } else if (result.status === 429) {
    if (requestNumber === 1) {
      console.info(
        `  🚫 Request ${requestNumber}/${totalRequests} - RATE LIMITED! (${result.status})`
      );
      console.info(`     Rate limit headers:`, result.headers);
    }
  } else if (requestNumber % 50 === 0) {
    console.info(
      `  ❌ Request ${requestNumber}/${totalRequests} - Error (${result.status})`
    );
  }
}

// Calculate and log summary for endpoint
function logEndpointSummary(
  endpoint: { method: string; path: string },
  results: {
    total: number;
    successful: number;
    rateLimited: number;
    otherErrors: number;
  }
) {
  console.info(`\n📈 Results for ${endpoint.method} ${endpoint.path}:`);
  console.info(`   ✅ Successful: ${results.successful}`);
  console.info(`   🚫 Rate Limited: ${results.rateLimited}`);
  console.info(`   ❌ Other Errors: ${results.otherErrors}`);

  if (results.rateLimited > 0) {
    console.info(
      `   🎯 Rate limiter activated after ~${
        results.total - results.rateLimited + 1
      } requests`
    );
  } else {
    console.info(
      `   ⚠️  No rate limiting detected with ${results.total} requests`
    );
  }
}

// Function to stress test a single endpoint
async function stressTestEndpoint(
  endpoint: { method: string; path: string; body?: Record<string, unknown> },
  targetRequests = 200
) {
  console.info(`\n🧪 Testing endpoint: ${endpoint.method} ${endpoint.path}`);
  console.info(`📊 Making ${targetRequests} requests...`);

  const results = {
    total: targetRequests,
    successful: 0,
    rateLimited: 0,
    otherErrors: 0,
    responses: [],
  };

  // Make requests sequentially to avoid overwhelming the server too quickly
  for (let i = 1; i <= targetRequests; i++) {
    const result = await makeRequest(endpoint, i);

    results.responses.push(result as never);
    processRequestResult(result, results);
    logRequestProgress(result, i, targetRequests);

    // Small delay between requests to simulate realistic traffic
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  // Summary for this endpoint
  logEndpointSummary(endpoint, results);

  return results;
}

// Main function
async function main() {
  console.info("🚀 Starting comprehensive rate limit stress test");
  console.info(`🌐 Server: ${BASE_URL}`);
  console.info(
    `📋 Testing ${endpoints.length} endpoints with 200 requests each`
  );
  console.info(`⏱️  This may take several minutes...\n`);

  const overallResults = {
    endpointsTested: 0,
    rateLimitedEndpoints: 0,
    totalRequests: 0,
    totalRateLimited: 0,
    endpointResults: [],
  };

  // Test each endpoint
  for (const endpoint of endpoints) {
    try {
      const result = await stressTestEndpoint(endpoint, 200);

      Reflect.set(overallResults, "endpointResults", [
        ...overallResults.endpointResults,
        {
          endpoint: `${endpoint.method} ${endpoint.path}`,
          ...result,
        },
      ]);
      overallResults.endpointsTested++;
      overallResults.totalRequests += result.total;
      overallResults.totalRateLimited += result.rateLimited;

      if (result.rateLimited > 0) {
        overallResults.rateLimitedEndpoints++;
      }
    } catch (error) {
      console.error(
        `💥 Failed to test endpoint ${endpoint.method} ${endpoint.path}:`,
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  // Final summary
  console.info("\n" + "=".repeat(60));
  console.info("🎯 FINAL STRESS TEST SUMMARY");
  console.info("=".repeat(60));
  console.info(`📊 Endpoints tested: ${overallResults.endpointsTested}`);
  console.info(
    `🚫 Endpoints that triggered rate limiting: ${overallResults.rateLimitedEndpoints}`
  );
  console.info(
    `📈 Total requests made: ${overallResults.totalRequests.toLocaleString()}`
  );
  console.info(
    `⛔ Total requests rate limited: ${overallResults.totalRateLimited.toLocaleString()}`
  );

  const rateLimitedPercentage = (
    (overallResults.totalRateLimited / overallResults.totalRequests) *
    100
  ).toFixed(1);

  console.info(`📊 Rate limiting percentage: ${rateLimitedPercentage}%`);

  console.info("\n📋 Detailed Results:");
  overallResults.endpointResults.forEach(
    (result: { rateLimited: number; total: number; endpoint: string }) => {
      const rateLimitedPercent = (
        (result.rateLimited / result.total) *
        100
      ).toFixed(1);
      const status = result.rateLimited > 0 ? "🚫 LIMITED" : "✅ OK";

      console.info(
        `   ${status} ${result.endpoint}: ${result.rateLimited}/${result.total} (${rateLimitedPercent}%)`
      );
    }
  );

  console.info("\n✨ Stress test completed!");
}

// Run the stress test
main().catch((error) => {
  console.error("💥 Stress test failed:", error);
  process.exit(1);
});
