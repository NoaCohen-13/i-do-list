import { requireWedding } from "@/lib/wedding";
import { AppShell } from "@/components/AppShell";
import { updateWeddingSettings } from "@/app/(app)/actions";
import { SyncButton } from "@/components/SyncButton";
import { ImportForm } from "@/components/ImportForm";

export default async function SettingsPage() {
  const wedding = await requireWedding();

  return (
    <AppShell active="/settings">
      <header className="pt-9 pb-6">
        <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-coral-strong">
          Settings
        </span>
        <h1 className="text-3xl">Your wedding details</h1>
      </header>

      <form action={updateWeddingSettings} className="mb-9 grid gap-5 rounded-[22px] border border-border bg-surface p-6 sm:grid-cols-2">
        <Field label="Wedding date">
          <input
            name="weddingDate"
            type="date"
            defaultValue={wedding.weddingDate ?? ""}
            className="input"
          />
        </Field>
        <Field label="Venue">
          <input name="venueName" defaultValue={wedding.venueName ?? ""} className="input" placeholder="e.g. Eco" />
        </Field>

        <div className="sm:col-span-2 mt-2 border-t border-border pt-5">
          <h2 className="mb-1 text-lg">Google Sheets sync</h2>
          <p className="mb-4 text-sm text-text-muted">
            Connect a Google Sheet (shared as &ldquo;Anyone with the link can view&rdquo;) to keep your guest
            list and budget synced from it. Guest tab columns: notes, party size, name. Budget tab columns:
            category, item, vendor, contact, phone, committed cost, paid, balance, last payment date, notes.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Sheet URL or ID">
              <input
                name="sheetUrl"
                defaultValue={wedding.googleSheetId ?? ""}
                className="input"
                placeholder="https://docs.google.com/spreadsheets/d/..."
              />
            </Field>
            <Field label="Guests tab name">
              <input name="guestsTab" defaultValue={wedding.googleSheetGuestsTab ?? ""} className="input" />
            </Field>
            <Field label="Budget tab name">
              <input name="budgetTab" defaultValue={wedding.googleSheetBudgetTab ?? ""} className="input" />
            </Field>
          </div>
        </div>

        <div className="sm:col-span-2">
          <button type="submit" className="btn-primary">
            Save settings
          </button>
        </div>
      </form>

      {wedding.googleSheetId && (
        <div className="mb-9 rounded-[22px] border border-border bg-surface p-6">
          <h2 className="mb-1 text-lg">Sync</h2>
          <p className="mb-4 text-sm text-text-muted">
            {wedding.lastSyncedAt
              ? `Last synced ${new Date(wedding.lastSyncedAt).toLocaleString()}`
              : "Never synced yet."}{" "}
            Syncs also run automatically in the background.
          </p>
          <SyncButton />
        </div>
      )}

      <div className="rounded-[22px] border border-border bg-surface p-6">
        <h2 className="mb-1 text-lg">Import a spreadsheet</h2>
        <p className="mb-4 text-sm text-text-muted">
          One-time import from an Excel or CSV file — good if you&apos;re not using Google Sheets.
        </p>
        <ImportForm />
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-[0.78rem] font-bold text-text-muted">
      {label}
      {children}
    </label>
  );
}
