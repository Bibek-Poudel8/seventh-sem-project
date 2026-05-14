import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function SettingsLoading() {
  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="grid gap-8">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader className="border-b">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {[1, 2, 3].map((j) => (
                <div key={j} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <Skeleton className="h-4 w-32" />
                  <div className="md:col-span-2">
                    <Skeleton className="h-10 w-full rounded-md" />
                  </div>
                </div>
              ))}
              <div className="pt-4 flex justify-end">
                <Skeleton className="h-10 w-32" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
