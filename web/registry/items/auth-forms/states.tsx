// Fictional product: Northwind Notes. No real brand, person or data.
import { AuthFormsExample } from "./demo";

const email = "robin@okafor.example";

function SignInErrors() {
  return (
    <AuthFormsExample
      initialState={{
        values: { email: "robin@okafor" },
        blurred: ["email"],
        submitted: true,
      }}
    />
  );
}

function SigningIn() {
  return (
    <AuthFormsExample
      initialState={{
        values: { email, password: "correct horse staple" },
        status: "submitting",
      }}
    />
  );
}

function SignInFailed() {
  return (
    <AuthFormsExample
      initialState={{
        values: { email, password: "correct horse stapel" },
        submitted: true,
        status: "failed",
      }}
    />
  );
}

function SignUp() {
  return <AuthFormsExample mode="sign-up" />;
}

function SignUpErrors() {
  return (
    <AuthFormsExample
      mode="sign-up"
      initialState={{
        values: { name: "Robin Okafor", email, password: "northwind" },
        blurred: ["name", "email", "password"],
        showPassword: true,
      }}
    />
  );
}

function CheckEmail() {
  return (
    <AuthFormsExample
      mode="sign-up"
      initialState={{
        values: { name: "Robin Okafor", email },
        status: "check-email",
      }}
    />
  );
}

/** Extra states, keyed by the names in notes.md `states` (after the first). */
export const states = {
  "sign-in-errors": SignInErrors,
  "signing-in": SigningIn,
  "sign-in-failed": SignInFailed,
  "sign-up": SignUp,
  "sign-up-errors": SignUpErrors,
  "check-email": CheckEmail,
};
