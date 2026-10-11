// Fictional product: Northwind Notes. No real brand, person or data.
import { SettingsAccountExample } from "./demo";

const email = "robin@okafor.example";

function FieldErrors() {
  return (
    <SettingsAccountExample
      initialState={{
        values: { name: "", email: "robin@okafor" },
        showErrors: true,
      }}
    />
  );
}

function Saved() {
  return (
    <SettingsAccountExample
      initialState={{
        values: { name: "Robin Okafor", email },
        save: "saved",
      }}
    />
  );
}

function SaveError() {
  return (
    <SettingsAccountExample
      initialState={{
        values: { name: "Robin A. Okafor", email },
        save: "error",
      }}
    />
  );
}

function ConfirmDelete() {
  return <SettingsAccountExample initialState={{ confirmOpen: true }} />;
}

function DeleteError() {
  return (
    <SettingsAccountExample
      initialState={{
        confirmOpen: true,
        confirmText: email,
        deleteError: true,
      }}
    />
  );
}

function DeletionStarted() {
  return <SettingsAccountExample initialState={{ deletionStarted: true }} />;
}

/** Extra states, keyed by the names in notes.md `states` (after the first). */
export const states = {
  "field-errors": FieldErrors,
  saved: Saved,
  "save-error": SaveError,
  "confirm-delete": ConfirmDelete,
  "delete-error": DeleteError,
  "deletion-started": DeletionStarted,
};
