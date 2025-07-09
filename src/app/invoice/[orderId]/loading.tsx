
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function Loading() {
  return (
    <div className="min-h-screen bg-muted/40 p-4 sm:p-8">
      <div className="mx-auto max-w-4xl">
        <Card>
          <CardHeader className="p-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-9 w-40" />
              <Skeleton className="h-7 w-28" />
            </div>
            <Skeleton className="h-5 w-60 mt-2" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <Skeleton className="h-5 w-24 mb-2" />
                <Skeleton className="h-4 w-48 mb-1" />
                <Skeleton className="h-4 w-40 mb-1" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="text-right">
                <Skeleton className="h-5 w-24 mb-2 ml-auto" />
                <Skeleton className="h-4 w-48 mb-1 ml-auto" />
                <Skeleton className="h-4 w-40 mb-1 ml-auto" />
                <Skeleton className="h-4 w-32 ml-auto" />
              </div>
            </div>
            <Separator className="my-6" />
            <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
              <div>
                <Skeleton className="h-5 w-20 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div>
                <Skeleton className="h-5 w-20 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div>
                <Skeleton className="h-5 w-20 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="mt-6 rounded-md border">
              <div className="w-full text-sm">
                <div className="grid grid-cols-5 p-2 font-medium bg-muted/50">
                  <div className="col-span-2"><Skeleton className="h-5 w-24" /></div>
                  <div className="text-center"><Skeleton className="h-5 w-12 mx-auto" /></div>
                  <div className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></div>
                  <div className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></div>
                </div>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="grid grid-cols-5 p-2 border-t">
                    <div className="col-span-2"><Skeleton className="h-5 w-32" /></div>
                    <div className="text-center"><Skeleton className="h-5 w-12 mx-auto" /></div>
                    <div className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></div>
                    <div className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <div className="w-full max-w-xs space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Separator />
                <Skeleton className="h-6 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
