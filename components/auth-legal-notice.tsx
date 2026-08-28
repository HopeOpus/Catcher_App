import Link from "next/link";

const linkClass =
  "font-medium text-[#36689e] underline underline-offset-2 transition-colors hover:text-[#0F2651]";

/**
 * Shown beneath the Clerk sign-in and sign-up widgets so account creation and
 * access are tied to the published Catcher legal documents.
 */
export function AuthLegalNotice({ mode }: { mode: "signIn" | "signUp" }) {
  return (
    <p className="text-center text-xs leading-6 text-slate-500">
      {mode === "signUp" ? "By creating an account you agree to our " : "By signing in you agree to our "}
      <Link href="/legal/terms" className={linkClass}>
        Terms of Service
      </Link>
      {mode === "signUp" ? (
        <>
          {" and "}
          <Link href="/legal/acceptable-use" className={linkClass}>
            Acceptable Use Policy
          </Link>
          {", and confirm you have read our "}
        </>
      ) : (
        <>{" and confirm you have read our "}</>
      )}
      <Link href="/legal/privacy" className={linkClass}>
        Privacy Policy
      </Link>
      {". See the full "}
      <Link href="/legal" className={linkClass}>
        Legal Centre
      </Link>
      {"."}
    </p>
  );
}
