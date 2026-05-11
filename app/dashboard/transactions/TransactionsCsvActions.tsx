"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownload,
  faUpload,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

type Props = {
  filters: Record<string, string | undefined>;
};

export default function TransactionsCsvActions({ filters }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const query = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => value != null) as [
      string,
      string,
    ][],
  ).toString();

  const openPicker = () => inputRef.current?.click();

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    const isCsv =
      file.name.toLowerCase().endsWith(".csv") || file.type === "text/csv";
    if (!isCsv) {
      setMessage("Please choose a CSV file.");
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/import/csv", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to import CSV");
      }

      setMessage(
        `Imported ${payload.importedCount} transaction${payload.importedCount === 1 ? "" : "s"}.`,
      );
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to import CSV",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap justify-end">
      <a href={`/api/export/csv?${query}`} download>
        <Button variant="outline" size="sm" className="gap-1.5">
          <FontAwesomeIcon icon={faDownload} className="h-3.5 w-3.5" />
          Export CSV
        </Button>
      </a>

      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={openPicker}
        disabled={uploading}
      >
        {uploading ? (
          <FontAwesomeIcon
            icon={faSpinner}
            className="h-3.5 w-3.5 animate-spin"
          />
        ) : (
          <FontAwesomeIcon icon={faUpload} className="h-3.5 w-3.5" />
        )}
        Import CSV
      </Button>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleFileChange}
      />

      {message ? (
        <p className="w-full text-right text-xs text-muted-foreground">
          {message}
        </p>
      ) : null}
    </div>
  );
}
