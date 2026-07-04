import { getSettings } from "@/actions/settings";
import { SettingsForm } from "@/components/settings/settings-form";
import { BackupRestoreCard } from "@/components/settings/backup-restore-card";

export default async function SettingsPage() {
  const business = await getSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary">Settings</h1>
        <p className="text-sm text-primary/50">Business profile and data backup.</p>
      </div>
      <SettingsForm
        defaultValues={{
          name: business.name,
          address: business.address ?? "",
          phone: business.phone ?? "",
          email: business.email ?? "",
          currency: business.currency,
        }}
      />
      <BackupRestoreCard />
    </div>
  );
}
