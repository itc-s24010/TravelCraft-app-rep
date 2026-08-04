import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "メールアドレスとパスワードは必須です" }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // Step 1: Regular signUp — works even when email confirmation is required.
    // Returns the user object even for existing unconfirmed accounts.
    const anonClient = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: signUpData, error: signUpError } = await anonClient.auth.signUp({
      email,
      password,
    });

    const userId = signUpData?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: signUpError?.message ?? "ユーザーを作成できませんでした" },
        { status: 400 }
      );
    }

    // Step 2: Use admin to immediately confirm the email — no email needed.
    const adminClient = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error: confirmError } = await adminClient.auth.admin.updateUserById(userId, {
      email_confirm: true,
    });

    if (confirmError) {
      // Confirmation failed but user was created — surface the error
      return NextResponse.json({ error: confirmError.message }, { status: 400 });
    }

    return NextResponse.json({ userId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "サーバーエラーが発生しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
