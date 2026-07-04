import { Skeleton } from "@/components/ui/skeleton";

export default function LoginLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Skeleton className="h-80 w-full max-w-sm" />
    </div>
  );
}
