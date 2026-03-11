import { Button } from "@/components/ui/button";
import { RefreshCw, RotateCcw, SearchX, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export const AllCaughtUpView = ({ onRefresh }: { onRefresh: () => void }) => (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6">
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center"
        >
            <RotateCcw className="w-10 h-10 text-green-500" />
        </motion.div>
        <div className="space-y-2">
            <h3 className="text-xl font-black text-foreground">You're All Caught Up!</h3>
            <p className="text-muted-foreground text-sm font-medium">
                You've seen all available listings in this category. Check back later or refresh to see them again.
            </p>
        </div>
        <Button
            onClick={onRefresh}
            className="rounded-2xl h-12 px-8 bg-zinc-900 hover:bg-zinc-800 text-white font-bold"
        >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Deck
        </Button>
    </div>
);

export const EmptyStateView = ({ category = "listings" }: { category?: string }) => (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6">
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 rounded-full bg-zinc-100 flex items-center justify-center"
        >
            <SearchX className="w-10 h-10 text-zinc-400" />
        </motion.div>
        <div className="space-y-2">
            <h3 className="text-xl font-black text-foreground">No {category} Found</h3>
            <p className="text-muted-foreground text-sm font-medium">
                We couldn't find any results matching your current filters. Try adjusting them to see more!
            </p>
        </div>
    </div>
);

export const ErrorStateView = ({ onRetry }: { onRetry: () => void }) => (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6">
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center"
        >
            <AlertCircle className="w-10 h-10 text-red-500" />
        </motion.div>
        <div className="space-y-2">
            <h3 className="text-xl font-black text-foreground">Something Went Wrong</h3>
            <p className="text-muted-foreground text-sm font-medium">
                We ran into an error while fetching listings. Please check your connection and try again.
            </p>
        </div>
        <Button
            onClick={onRetry}
            variant="outline"
            className="rounded-2xl h-12 px-8 font-bold border-2"
        >
            Try Again
        </Button>
    </div>
);
