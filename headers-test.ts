import axios, { AxiosError } from "axios";

const PASS = "password";

// Base URL of the server
const BASE_URL = "http://localhost:5173";

// Expected rate limit headers
const EXPECTED_HEADERS = [
  "x-ratelimit-limit",
  "x-ratelimit-remaining",
  "x-ratelimit-reset",
  "retry-after",
] as const;

// Test endpoint that will trigger rate limiting quickly
const TEST_ENDPOINT = {
  method: "POST",
  path: "/auth/signin",
  body: { email: "test@example.com", [PASS]: "password123" },
};

// Function to make a single request
async function makeRequest(
  endpoint: typeof TEST_ENDPOINT,
  attemptNumber: number
) {
  const url = `${BASE_URL}${endpoint.path}`;
  const config = {
    method: endpoint.method,
    url: url,
    headers: {
      "Content-Type": "application/json",
    },
    timeout: 10000,
  };

  if (endpoint.body) {
    Reflect.set(config, "data", endpoint.body);
  }

  try {
    const response = await axios(config);

    return {
      success: true,
      status: response.status,
      attempt: attemptNumber,
      headers: response.headers,
      responseType: "success" as const,
    };
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      return {
        success: false,
        status: error.response.status,
        attempt: attemptNumber,
        headers: error.response.headers,
        responseType: "error" as const,
      };
    }

    return {
      success: false,
      status: "TIMEOUT",
      attempt: attemptNumber,
      headers: {},
      responseType: "timeout" as const,
    };
  }
}

// Function to check if all expected headers are present
function checkRateLimitHeaders(headers: Record<string, unknown>): {
  allPresent: boolean;
  presentHeaders: string[];
  missingHeaders: string[];
} {
  const presentHeaders: string[] = [];
  const missingHeaders: string[] = [];

  for (const header of EXPECTED_HEADERS) {
    if (Reflect.has(headers, header)) {
      presentHeaders.push(header);
    } else {
      missingHeaders.push(header);
    }
  }

  return {
    allPresent: missingHeaders.length === 0,
    presentHeaders,
    missingHeaders,
  };
}

// Helper function to log headers status for successful requests
function logHeadersStatus(
  headersCheck: ReturnType<typeof checkRateLimitHeaders>
) {
  if (headersCheck.allPresent) {
    console.info(`     ✅ All rate limit headers present`);
  } else {
    console.info(
      `     ⚠️  Missing headers: ${headersCheck.missingHeaders.join(", ")}`
    );
    console.info(
      `     ✅ Present headers: ${headersCheck.presentHeaders.join(", ")}`
    );
  }
}

// Helper function to log headers for rate limited requests
function logRateLimitedHeaders(
  headersCheck: ReturnType<typeof checkRateLimitHeaders>,
  headers: Record<string, unknown>
) {
  if (headersCheck.allPresent) {
    console.info(`     ✅ All rate limit headers present`);
    console.info(`     📊 Header values:`);
    EXPECTED_HEADERS.forEach((header) => {
      console.info(`        ${header}: ${Reflect.get(headers, header)}`);
    });
  } else {
    console.info(
      `     ❌ Missing headers: ${headersCheck.missingHeaders.join(", ")}`
    );
    console.info(
      `     ✅ Present headers: ${headersCheck.presentHeaders.join(", ")}`
    );
  }
}

// Helper function to log individual request results
function logRequestResult(
  attempt: number,
  result: Awaited<ReturnType<typeof makeRequest>>,
  headersCheck: ReturnType<typeof checkRateLimitHeaders>
) {
  if (result.success) {
    console.info(`  ✅ Request ${attempt} - Success (${result.status})`);
    logHeadersStatus(headersCheck);
  } else if (result.status === 429) {
    console.info(`  🚫 Request ${attempt} - RATE LIMITED (${result.status})`);
    logRateLimitedHeaders(headersCheck, result.headers);
  } else {
    console.info(`  ❌ Request ${attempt} - Error (${result.status})`);
  }
}

// Helper function to log results summary for a category
function logResultsSummary(
  title: string,
  results: Array<{
    attempt: number;
    headersCheck: ReturnType<typeof checkRateLimitHeaders>;
  }>,
  missingText: string,
  showPresentForMissing: boolean
) {
  console.info(`\n📋 ${title} (${results.length}):`);
  results.forEach((result) => {
    const check = result.headersCheck;
    const status = check.allPresent ? "✅ ALL PRESENT" : missingText;

    console.info(`   Request ${result.attempt}: ${status}`);

    if (!check.allPresent) {
      if (showPresentForMissing) {
        console.info(`     Present: ${check.presentHeaders.join(", ")}`);
      }

      console.info(`     Missing: ${check.missingHeaders.join(", ")}`);
    }
  });
}

// Helper function to perform final analysis
function performFinalAnalysis(testResults: {
  totalRequests: number;
  rateLimitedRequests: number;
  headersCheckResults: Array<{
    attempt: number;
    status: number | string;
    responseType: "success" | "error" | "timeout";
    headersCheck: ReturnType<typeof checkRateLimitHeaders>;
  }>;
}) {
  console.info("\n" + "=".repeat(60));
  console.info("🎯 HEADERS TEST SUMMARY");
  console.info("=".repeat(60));

  console.info(`📊 Total requests made: ${testResults.totalRequests}`);
  console.info(`🚫 Rate limited requests: ${testResults.rateLimitedRequests}`);

  const rateLimitedResults = testResults.headersCheckResults.filter(
    (r) => r.status === 429
  );
  const successfulResults = testResults.headersCheckResults.filter(
    (r) => r.responseType === "success"
  );

  logResultsSummary(
    "Rate Limited Responses",
    rateLimitedResults,
    "❌ MISSING SOME",
    false
  );
  logResultsSummary(
    "Successful Responses",
    successfulResults,
    "⚠️  SOME MISSING",
    true
  );

  const allRateLimitedHaveHeaders = rateLimitedResults.every(
    (r) => r.headersCheck.allPresent
  );

  console.info(`\n🏆 ASSESSMENT:`);
  console.info(
    `   Rate Limited Responses: ${
      allRateLimitedHaveHeaders ? "✅" : "❌"
    } All have complete headers`
  );
  console.info(
    `   Successful Responses: ${
      successfulResults.every((r) => r.headersCheck.allPresent) ? "✅" : "⚠️"
    } All have complete headers`
  );

  if (allRateLimitedHaveHeaders) {
    console.info(
      `\n🎉 EXCELLENT! Rate limiting headers are working correctly!`
    );
  } else {
    console.info(`\n⚠️  ISSUE: Some rate limit headers are missing!`);
  }

  console.info("\n✨ Headers test completed!");
}

// Function to run the headers test
async function runHeadersTest() {
  console.info("🧪 Starting Rate Limit Headers Test");
  console.info(`🌐 Server: ${BASE_URL}`);
  console.info(
    `🎯 Testing endpoint: ${TEST_ENDPOINT.method} ${TEST_ENDPOINT.path}`
  );
  console.info(`📋 Expected headers: ${EXPECTED_HEADERS.join(", ")}\n`);

  const testResults = {
    totalRequests: 0,
    rateLimitedRequests: 0,
    headersCheckResults: [] as Array<{
      attempt: number;
      status: number | string;
      responseType: "success" | "error" | "timeout";
      headersCheck: ReturnType<typeof checkRateLimitHeaders>;
    }>,
  };

  // Make enough requests to trigger rate limiting
  for (let i = 1; i <= 10; i++) {
    console.info(`📤 Making request ${i}/10...`);
    const result = await makeRequest(TEST_ENDPOINT, i);

    testResults.totalRequests++;

    if (result.status === 429) {
      testResults.rateLimitedRequests++;
    }

    const headersCheck = checkRateLimitHeaders(result.headers);

    testResults.headersCheckResults.push({
      attempt: i,
      status: result.status,
      responseType: result.responseType,
      headersCheck,
    });

    logRequestResult(i, result, headersCheck);

    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  performFinalAnalysis(testResults);
}

// Run the test
runHeadersTest().catch((error) => {
  console.error("💥 Headers test failed:", error);
  process.exit(1);
});
