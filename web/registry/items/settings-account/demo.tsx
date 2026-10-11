// Fictional product: Northwind Notes. The person, address and counts are
// invented for the demo; .example addresses are reserved and never deliver.
import { SettingsAccount, type SettingsAccountProps } from "./settings-account";

const profile = { name: "Robin Okafor", email: "robin@okafor.example" };

export function SettingsAccountExample({
  initialState,
}: Pick<SettingsAccountProps, "initialState">) {
  return (
    <SettingsAccount
      // The preview page already has its own h1. In an app, leave
      // headingLevel at its default (1): this is the page title.
      headingLevel={2}
      title="Account"
      description="Change how you appear to people you share notes with, download your notes, or close your account."
      productName="Northwind Notes"
      profile={profile}
      exportHref="#export"
      exportLabel="Download my notes (.zip)"
      exportDescription="Every note you own, as Markdown files with their attachments, in one .zip. Version history is not included."
      deletes={[
        "Your profile and sign-in.",
        "The 4 notebooks you own, with their 212 notes, attachments and version history.",
        "Invitations you sent that haven’t been accepted yet.",
      ]}
      keeps={[
        "Notebooks other people own stay with them. Your comments there show as “Former member”.",
      ]}
      deletionStartedMessage={`Deletion has started. You’ll be signed out shortly, and we’ll email ${profile.email} when it’s finished.`}
      initialState={initialState}
    />
  );
}

export default function SettingsAccountDemo() {
  return <SettingsAccountExample />;
}
