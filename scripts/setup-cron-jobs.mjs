#!/usr/bin/env node

import "dotenv/config";

const CRON_JOB_ORG_API_BASE_URL = "https://api.cron-job.org";
const DEFAULT_TIMEZONE = "Africa/Lagos";
const POST_REQUEST_METHOD = 1;
const REQUEST_DELAY_MS = 1200;
const MAX_RATE_LIMIT_RETRIES = 3;

const jobs = [
  {
    key: "property-plan-reminders",
    title: "Catcher Property Plan Reminders",
    path: "/api/internal/cron/property-plan-reminders",
    schedule: {
      hours: [8],
      minutes: [0],
    },
  },
  {
    key: "property-lifecycle",
    title: "Catcher Property Lifecycle",
    path: "/api/internal/cron/property-lifecycle",
    schedule: {
      hours: [0],
      minutes: [15],
    },
  },
  {
    key: "property-restores",
    title: "Catcher Property Restores",
    path: "/api/internal/cron/property-restores",
    schedule: {
      hours: [9],
      minutes: [0],
    },
  },
];

function getStringEnv(name) {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function getTargetBaseUrl() {
  const value =
    getStringEnv("CRON_JOB_TARGET_BASE_URL") ||
    getStringEnv("APP_BASE_URL") ||
    getStringEnv("NEXT_PUBLIC_APP_URL") ||
    getStringEnv("NEXT_PUBLIC_SITE_URL") ||
    getStringEnv("VERCEL_PROJECT_PRODUCTION_URL") ||
    getStringEnv("VERCEL_URL");

  if (!value) {
    throw new Error(
      "Missing target base URL. Set CRON_JOB_TARGET_BASE_URL to your deployed app URL.",
    );
  }

  const normalized = value.startsWith("http") ? value : `https://${value}`;
  const url = new URL(normalized);
  const host = url.hostname.toLowerCase();

  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "::1"
  ) {
    throw new Error(
      "CRON_JOB_TARGET_BASE_URL must point to a deployed app, not localhost.",
    );
  }

  return url.origin;
}

function buildSchedule(partial) {
  return {
    timezone: getStringEnv("CRON_JOB_TIMEZONE") || DEFAULT_TIMEZONE,
    expiresAt: 0,
    hours: partial.hours,
    mdays: [-1],
    minutes: partial.minutes,
    months: [-1],
    wdays: [-1],
  };
}

function buildJobPayload(job, targetBaseUrl, cronSecret) {
  return {
    enabled: true,
    title: job.title,
    saveResponses: true,
    url: `${targetBaseUrl}${job.path}`,
    requestMethod: POST_REQUEST_METHOD,
    requestTimeout: 60,
    redirectSuccess: false,
    schedule: buildSchedule(job.schedule),
    notification: {
      onFailure: true,
      onFailureCount: 1,
      onSuccess: true,
      onDisable: true,
    },
    extendedData: {
      headers: {
        "x-catcher-cron-secret": cronSecret,
      },
    },
  };
}

async function cronJobOrgRequest(path, options = {}) {
  if (cronJobOrgRequest.lastRequestAt) {
    const elapsed = Date.now() - cronJobOrgRequest.lastRequestAt;
    if (elapsed < REQUEST_DELAY_MS) {
      await new Promise((resolve) =>
        setTimeout(resolve, REQUEST_DELAY_MS - elapsed),
      );
    }
  }

  const apiKey = getStringEnv("CRON_JOB_ORG_API_KEY");

  if (!apiKey) {
    throw new Error(
      "Missing CRON_JOB_ORG_API_KEY. Add your cron-job.org API key to the environment.",
    );
  }

  for (
    let attempt = 0;
    attempt <= MAX_RATE_LIMIT_RETRIES;
    attempt += 1
  ) {
    cronJobOrgRequest.lastRequestAt = Date.now();

    const response = await fetch(`${CRON_JOB_ORG_API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...(options.headers || {}),
      },
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (response.status === 429 && attempt < MAX_RATE_LIMIT_RETRIES) {
      const retryAfterHeader = response.headers.get("retry-after");
      const retryDelaySeconds = Number.parseInt(retryAfterHeader || "", 10);
      const retryDelayMs =
        Number.isFinite(retryDelaySeconds) && retryDelaySeconds > 0
          ? retryDelaySeconds * 1000
          : REQUEST_DELAY_MS * (attempt + 2);

      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      continue;
    }

    if (!response.ok) {
      throw new Error(
        `cron-job.org API request failed (${response.status}): ${JSON.stringify(data)}`,
      );
    }

    return data;
  }

  throw new Error("cron-job.org API request failed after repeated retries.");
}

cronJobOrgRequest.lastRequestAt = 0;

async function listExistingJobs() {
  const data = await cronJobOrgRequest("/jobs", {
    method: "GET",
  });

  return Array.isArray(data.jobs) ? data.jobs : [];
}

function findMatchingJob(existingJobs, payload) {
  return (
    existingJobs.find((job) => job.title === payload.title) ||
    existingJobs.find((job) => job.url === payload.url)
  );
}

async function createJob(payload) {
  const data = await cronJobOrgRequest("/jobs", {
    method: "PUT",
    body: JSON.stringify({ job: payload }),
  });

  return data.jobId;
}

async function updateJob(jobId, payload) {
  await cronJobOrgRequest(`/jobs/${jobId}`, {
    method: "PATCH",
    body: JSON.stringify({ job: payload }),
  });
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const targetBaseUrl = getTargetBaseUrl();
  const cronSecret = getStringEnv("CRON_SECRET");

  if (!cronSecret) {
    throw new Error(
      "Missing CRON_SECRET. Add it before configuring cron-job.org jobs.",
    );
  }

  const jobPayloads = jobs.map((job) => ({
    key: job.key,
    payload: buildJobPayload(job, targetBaseUrl, cronSecret),
  }));

  if (dryRun) {
    console.log(
      JSON.stringify(
        {
          dryRun: true,
          targetBaseUrl,
          jobs: jobPayloads,
        },
        null,
        2,
      ),
    );
    return;
  }

  const existingJobs = await listExistingJobs();
  const results = [];

  for (const job of jobPayloads) {
    const existing = findMatchingJob(existingJobs, job.payload);

    if (existing) {
      await updateJob(existing.jobId, job.payload);
      results.push({
        key: job.key,
        action: "updated",
        jobId: existing.jobId,
        url: job.payload.url,
      });
      continue;
    }

    const jobId = await createJob(job.payload);
    results.push({
      key: job.key,
      action: "created",
      jobId,
      url: job.payload.url,
    });
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        targetBaseUrl,
        timezone: getStringEnv("CRON_JOB_TIMEZONE") || DEFAULT_TIMEZONE,
        results,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Failed to configure cron-job.org jobs.",
  );
  process.exitCode = 1;
});
