import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getPasskeyRelyingParty, PASSKEY_CHALLENGE_COOKIE } from "@/lib/passkeys";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";

export async function GET() {
  return NextResponse.json({ status: "ready" });
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  console.log("[Passkey Auth Options] Request received.");
  try {
    console.time("[Passkey Auth Options] DB Query");
    const supabase = createSupabaseAdmin();
    const { data: passkeys, error } = await (supabase
      .from("admin_passkeys") as any)
      .select("credential_id");
    console.timeEnd("[Passkey Auth Options] DB Query");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!passkeys || passkeys.length === 0) {
      return NextResponse.json({ error: "Chưa có passkey" }, { status: 400 });
    }

    const validPasskeys = (passkeys as any[]).filter((item: any) => {
      if (typeof item.credential_id !== "string" || item.credential_id.length === 0) {
        console.error("Invalid credential_id row", {
          credentialIdType: typeof item.credential_id,
          credentialIdValue: item.credential_id,
        });
        return false;
      }
      return true;
    });

    if (validPasskeys.length === 0) {
      return NextResponse.json({ error: "Passkey không hợp lệ" }, { status: 400 });
    }

    const { rpID: rawRpID } = getPasskeyRelyingParty(req);
    const rpID = typeof rawRpID === "string" ? rawRpID.trim() : "";
    if (!rpID) {
      console.error("Invalid rpID", { rpID: rawRpID, rpIdType: typeof rawRpID });
      return NextResponse.json({ error: "RP ID không hợp lệ" }, { status: 500 });
    }
    const allowCredentials = validPasskeys
      .map((item: any) => {
        try {
          return {
            id: item.credential_id,
            type: "public-key" as const,
          };
        } catch (err) {
          console.error("Invalid credential_id", err);
          return null;
        }
      })
      .filter(Boolean) as Array<{ id: string; type: "public-key" }>;

    if (allowCredentials.length === 0) {
      return NextResponse.json({ error: "Passkey không hợp lệ" }, { status: 400 });
    }

    console.time("[Passkey Auth Options] GenerateOptions");
    const options = await generateAuthenticationOptions({
      rpID,
      timeout: 60000,
      userVerification: "required",
      allowCredentials,
    });
    console.timeEnd("[Passkey Auth Options] GenerateOptions");

    const response = NextResponse.json(options);
    response.cookies.set(PASSKEY_CHALLENGE_COOKIE.auth, options.challenge, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 5,
      path: "/",
    });

    console.log(`[Passkey Auth Options] Successfully completed in ${Date.now() - startTime}ms`);
    return response;
  } catch (error) {
    console.error("Passkey auth options error:", error);
    const message = error instanceof Error ? error.message : "Không thể tạo yêu cầu xác thực";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

