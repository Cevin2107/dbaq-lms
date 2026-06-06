import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getPasskeyRelyingParty, PASSKEY_CHALLENGE_COOKIE } from "@/lib/passkeys";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { generateToken } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  console.log("[Passkey Auth Verify] Request received.");
  const challenge = req.cookies.get(PASSKEY_CHALLENGE_COOKIE.auth)?.value;
  if (!challenge) {
    return NextResponse.json({ error: "Missing challenge" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const assertionResponse = body?.assertionResponse;
    const credentialId = assertionResponse?.id;

    if (!credentialId) {
      return NextResponse.json({ error: "Missing credential id" }, { status: 400 });
    }

    console.time("[Passkey Auth Verify] DB Query");
    const supabase = createSupabaseAdmin();
    const { data: passkey, error } = await (supabase
      .from("admin_passkeys") as any)
      .select("id, credential_id, public_key, counter")
      .eq("credential_id", credentialId)
      .maybeSingle();
    console.timeEnd("[Passkey Auth Verify] DB Query");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!passkey) {
      return NextResponse.json({ error: "Passkey not found" }, { status: 404 });
    }

    const publicKeyBytes = typeof passkey.public_key === "string" ? isoBase64URL.toBuffer(passkey.public_key) : passkey.public_key;

    const { rpID, rpOrigin } = getPasskeyRelyingParty(req);
    
    console.time("[Passkey Auth Verify] VerifyAuthenticationResponse");
    const verification = await verifyAuthenticationResponse({
      response: assertionResponse,
      expectedChallenge: challenge,
      expectedOrigin: rpOrigin,
      expectedRPID: rpID,
      credential: {
        id: passkey.credential_id,
        publicKey: publicKeyBytes,
        counter: passkey.counter,
      },
      requireUserVerification: true,
    });
    console.timeEnd("[Passkey Auth Verify] VerifyAuthenticationResponse");

    if (!verification.verified) {
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
    }

    console.time("[Passkey Auth Verify] Update DB and Cookie");
    const newCounter = verification.authenticationInfo?.newCounter ?? passkey.counter;
    if (newCounter !== passkey.counter) {
      await (supabase.from("admin_passkeys") as any).update({ counter: newCounter }).eq("id", passkey.id);
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set("admin_auth", await generateToken(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    response.cookies.set(PASSKEY_CHALLENGE_COOKIE.auth, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });
    console.timeEnd("[Passkey Auth Verify] Update DB and Cookie");

    console.log(`[Passkey Auth Verify] Successfully verified in ${Date.now() - startTime}ms`);
    return response;
  } catch (error: any) {
    console.error("Passkey auth verify error:", error);
    const message = error instanceof Error ? error.message : "Khong the xac thuc";
    return NextResponse.json({ error: message, stack: error?.stack, rawError: String(error) }, { status: 500 });
  }
}
