import { createServerClient } from "@/lib/supabase/server";
import { ensureUserProfile, requireUser } from "@/lib/auth";
import { scanCreateRatelimit } from "@/lib/ratelimit";
import type { CreateScanRequest, Tool } from "@/types";
import { TOOL_OPTIONS } from "@/types";

export const dynamic = "force-dynamic";

const VALID_TOOLS: Tool[] = TOOL_OPTIONS.map((tool) => tool.id);

function validateCreateScanRequest(body: unknown): {
  valid: boolean;
  data?: CreateScanRequest;
  missingFields?: string[];
} {
  console.log("[scan/create] Validating request body:", body);

  if (!body || typeof body !== "object") {
    return { valid: false, missingFields: ["body"] };
  }

  const data = body as Record<string, unknown>;
  const missingFields: string[] = [];

  if (typeof data.repo_name !== "string" || data.repo_name.trim().length === 0) {
    missingFields.push("repo_name");
  }

  if (typeof data.repo_url !== "string" || data.repo_url.trim().length === 0) {
    missingFields.push("repo_url");
  } else {
    try {
      const u = new URL((data.repo_url as string).trim());
      if (!["https:"].includes(u.protocol)) missingFields.push("repo_url");
    } catch {
      missingFields.push("repo_url");
    }
  }

  if (
    typeof data.tool_selected !== "string" ||
    !VALID_TOOLS.includes(data.tool_selected as Tool)
  ) {
    missingFields.push("tool_selected");
  }

  if (
    typeof data.discovery_response !== "string" ||
    data.discovery_response.trim().length === 0
  ) {
    missingFields.push("discovery_response");
  }

  if (missingFields.length > 0) {
    console.log("[scan/create] Validation failed. Missing/invalid fields:", missingFields);
    return { valid: false, missingFields };
  }

  const validated: CreateScanRequest = {
    repo_name: (data.repo_name as string).trim(),
    repo_url: (data.repo_url as string).trim(),
    tool_selected: data.tool_selected as Tool,
    discovery_response: (data.discovery_response as string).trim(),
    domain:
      typeof data.domain === "string" && data.domain.trim().length > 0
        ? data.domain.trim()
        : undefined,
  };

  if (validated.domain) {
    try {
      const d = new URL(
        validated.domain.startsWith("http")
          ? validated.domain
          : "https://" + validated.domain
      );
      if (
        !["https:", "http:"].includes(d.protocol) ||
        /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|169\.254\.)/.test(
          d.hostname
        )
      ) {
        validated.domain = undefined;
      }
    } catch {
      validated.domain = undefined;
    }
  }

  console.log("[scan/create] Validation passed:", {
    repo_name: validated.repo_name,
    repo_url: validated.repo_url,
    tool_selected: validated.tool_selected,
    discovery_response_length: validated.discovery_response.length,
  });

  return { valid: true, data: validated };
}

export async function POST(request: Request) {
  console.log("[scan/create] POST request received");

  try {
    console.log("[scan/create] Creating server Supabase client (cookie-based)");
    const supabase = createServerClient();

    console.log("[scan/create] Fetching authenticated user via getUser()");
    const auth = await requireUser(supabase);

    if ("error" in auth) {
      console.log("[scan/create] Auth failed — no valid user session");
      return auth.error;
    }

    const identifier = `scan_create_${auth.user.id}`;
    const { success } = await scanCreateRatelimit.limit(identifier);
    if (!success) {
      return Response.json(
        { error: "Too many requests. Please wait before scanning again." },
        { status: 429 }
      );
    }

    console.log("[scan/create] User authenticated:", {
      id: auth.user.id,
      email: auth.user.email,
    });

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.log("[scan/create] getSession error:", sessionError.message);
    } else {
      console.log("[scan/create] Session present:", !!session, "expires_at:", session?.expires_at);
    }

    let body: unknown;
    try {
      body = await request.json();
      console.log("[scan/create] Request body parsed successfully");
    } catch (parseError) {
      console.error("[scan/create] Failed to parse request JSON:", parseError);
      return Response.json(
        {
          error: "Invalid JSON in request body",
          details: parseError instanceof Error ? parseError.message : String(parseError),
        },
        { status: 400 }
      );
    }

    const validation = validateCreateScanRequest(body);

    if (!validation.valid || !validation.data) {
      return Response.json(
        {
          error: "Invalid request. All fields are required.",
          missingFields: validation.missingFields,
        },
        { status: 400 }
      );
    }

    console.log("[scan/create] Upserting user profile for:", auth.user.id);
    const profileResult = await ensureUserProfile(supabase, auth.user);

    if (profileResult.error) {
      console.error("[scan/create] User profile upsert failed:", profileResult.error);
      return Response.json(
        {
          error: "Failed to upsert user profile",
          details: profileResult.error.message,
          code: profileResult.error.code,
        },
        { status: 500 }
      );
    }

    console.log("[scan/create] User profile upserted successfully");

    const insertPayload = {
      user_id: auth.user.id,
      repo_name: validation.data.repo_name,
      repo_url: validation.data.repo_url,
      tool_selected: validation.data.tool_selected,
      discovery_response: validation.data.discovery_response,
      domain: validation.data.domain ?? null,
      status: "scanning" as const,
    };

    console.log("[scan/create] Inserting scan record:", insertPayload);

    const { data, error } = await supabase
      .from("scans")
      .insert(insertPayload)
      .select("id")
      .single();

    if (error) {
      console.error("[scan/create] Supabase insert error:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });

      return Response.json(
        {
          error: "Failed to create scan record",
          details: error.message,
          code: error.code,
          hint: error.hint,
        },
        { status: 500 }
      );
    }

    console.log("[scan/create] Scan created successfully:", data.id);

    return Response.json({ id: data.id });
  } catch (error) {
    console.error("[scan/create] Unexpected error:", error);

    return Response.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
