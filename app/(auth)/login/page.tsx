import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-semibold text-primary-foreground">
            SV
          </div>
          <h1 className="text-xl font-semibold text-primary">Sri Varahi Building Solutions</h1>
          <p className="mt-1 text-sm text-primary/50">Sign in to your sales dashboard</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
