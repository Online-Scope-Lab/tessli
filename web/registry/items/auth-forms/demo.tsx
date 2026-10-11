// Fictional product: Northwind Notes. A UI pattern only: nothing is sent and
// no account exists. .example addresses are reserved and never deliver.
import { AuthForms, type AuthFormsProps } from "./auth-forms";

const linkClass =
  "rounded-sm font-medium text-foreground underline underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none";

export function AuthFormsExample({
  mode = "sign-in",
  initialState,
}: Partial<Pick<AuthFormsProps, "mode" | "initialState">>) {
  const isSignUp = mode === "sign-up";
  return (
    <AuthForms
      // The preview page already has its own h1. In an app, leave
      // headingLevel at its default (1): this is the page title.
      headingLevel={2}
      mode={mode}
      productName="Northwind Notes"
      homeHref="#home"
      title={
        isSignUp
          ? "Create your Northwind Notes account"
          : "Sign in to Northwind Notes"
      }
      description={
        isSignUp
          ? "Free for one person. You can invite your team later."
          : undefined
      }
      switchMode={
        isSignUp
          ? {
              prompt: "Already have an account?",
              label: "Sign in",
              href: "#sign-in",
            }
          : {
              prompt: "No account yet?",
              label: "Create an account",
              href: "#create-account",
            }
      }
      forgotPasswordHref="#reset-password"
      nameHint="Shown to people you share notebooks with."
      legal={
        <>
          By creating an account you agree to the{" "}
          <a href="#terms" className={linkClass}>
            Terms of Service
          </a>{" "}
          and the{" "}
          <a href="#privacy" className={linkClass}>
            Privacy Policy
          </a>
          .
        </>
      }
      signedInMessage="Signed in. Opening your notebooks…"
      note={
        <p>
          A UI pattern for a fictional product. Nothing you type is sent or
          stored, and no account is created.
        </p>
      }
      initialState={initialState}
    />
  );
}

export default function AuthFormsDemo() {
  return <AuthFormsExample />;
}
