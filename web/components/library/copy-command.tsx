"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

import styles from "./library.module.css";

export function CopyCommand({ command }: Readonly<{ command: string }>) {
  const [message, setMessage] = useState("");

  async function copy() {
    setMessage("");
    try {
      await navigator.clipboard.writeText(command);
      setMessage("Install command copied.");
    } catch {
      setMessage("Copy failed. Select the command and copy it yourself.");
    }
  }

  return (
    <div className={styles.command}>
      <pre className={styles.commandText} data-install-command>
        <code>{command}</code>
      </pre>
      <Button variant="secondary" onClick={copy} data-copy-install>
        Copy
      </Button>
      <p className={styles.copyStatus} role="status" aria-live="polite">
        {message}
      </p>
    </div>
  );
}
