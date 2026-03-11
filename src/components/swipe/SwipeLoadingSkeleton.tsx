import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export const SwipeLoadingSkeleton = () => {
    return (
        <Card className="w-full h-full rounded-[32px] overflow-hidden border-none bg-white shadow-xl flex flex-col">
            <Skeleton className="w-full h-[60%] rounded-none" />
            <div className="flex-1 p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-2 w-16" />
                        </div>
                    </div>
                    <Skeleton className="h-6 w-20 rounded-lg" />
                </div>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="pt-4">
                    <Skeleton className="h-12 w-full rounded-2xl" />
                </div>
            </div>
        </Card>
    );
};
