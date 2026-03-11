import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadarSearchIcon } from '@/components/ui/RadarSearchEffect';
import { CategoryInfo } from './SwipeUtils';

interface StateViewProps {
    categoryInfo: CategoryInfo;
    isRefreshing: boolean;
    onRefresh: () => void;
}

/**
 * All Caught Up View: Shown when deck is exhausted after swiping
 */
export const AllCaughtUpView = ({ categoryInfo, isRefreshing, onRefresh }: StateViewProps) => {
    const categoryLabel = categoryInfo.plural;
    const categoryLower = categoryLabel.toLowerCase();
    const CategoryIcon = categoryInfo.icon;
    const iconColor = categoryInfo.color;

    const getCaughtUpMessage = () => {
        if (categoryLower === 'properties') {
            return {
                title: 'All Caught Up!',
                description: "You've seen all available properties. Check back later for new opportunities!",
                cta: 'Discover More Properties'
            };
        }
        if (categoryLower === 'motorcycles') {
            return {
                title: 'All Caught Up!',
                description: "You've seen all motorcycles. Check back later for new listings!",
                cta: 'Discover More Motorcycles'
            };
        }
        if (categoryLower === 'bicycles') {
            return {
                title: 'All Caught Up!',
                description: "You've seen all bicycles. New bikes are added regularly!",
                cta: 'Discover More Bicycles'
            };
        }
        if (categoryLower === 'workers' || categoryLower === 'services') {
            return {
                title: 'All Caught Up!',
                description: "You've seen all available workers. Check back later for new service providers!",
                cta: 'Discover More Workers'
            };
        }
        return {
            title: 'All Caught Up!',
            description: `You've seen all available ${categoryLower}. Check back later for new ${categoryLower}!`,
            cta: `Discover More ${categoryLabel}`
        };
    };

    const { title, description, cta } = getCaughtUpMessage();

    return (
        <div className="relative w-full flex-1 flex items-center justify-center px-4" style={{ minHeight: 'calc(100dvh - 140px)' }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="text-center space-y-6 p-8"
            >
                <div className="flex justify-center">
                    <motion.div
                        animate={isRefreshing ? { rotate: 360 } : { scale: [1, 1.15, 1, 1.1, 1] }}
                        transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: "linear" } : { duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className={`w-20 h-20 rounded-full border-2 border-current flex items-center justify-center ${iconColor}`}
                    >
                        <CategoryIcon className="w-10 h-10" />
                    </motion.div>
                </div>

                <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-foreground">{title}</h3>
                    <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                        {description}
                    </p>
                </div>
                <div className="flex flex-col gap-3">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                            onClick={onRefresh}
                            disabled={isRefreshing}
                            className="gap-2 rounded-full px-8 py-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg text-base"
                        >
                            {isRefreshing ? (
                                <RadarSearchIcon size={20} isActive={true} />
                            ) : (
                                <RefreshCw className="w-5 h-5" />
                            )}
                            {isRefreshing ? `Scanning for ${categoryLabel}...` : cta}
                        </Button>
                    </motion.div>
                    <p className="text-xs text-muted-foreground">New {categoryLower} are added daily</p>
                </div>
            </motion.div>
        </div>
    );
};

/**
 * Error State View: Shown when initial fetch fails
 */
export const ErrorStateView = ({ categoryInfo, onRefresh }: Omit<StateViewProps, 'isRefreshing'>) => {
    const categoryLabel = categoryInfo.plural;
    return (
        <div className="relative w-full flex-1 flex items-center justify-center px-4" style={{ minHeight: 'calc(100dvh - 140px)' }}>
            <Card className="text-center bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20 p-8">
                <div className="text-6xl mb-4">:(</div>
                <h3 className="text-xl font-bold mb-2">Oops! Something went wrong</h3>
                <p className="text-muted-foreground mb-4">Let's try again to find some {categoryLabel.toLowerCase()}.</p>
                <Button onClick={onRefresh} variant="outline" className="gap-2">
                    <RotateCcw className="w-4 h-4" />
                    Try Again
                </Button>
            </Card>
        </div>
    );
};

/**
 * Empty State View: Shown when no cards are found
 */
export const EmptyStateView = ({ categoryInfo, isRefreshing, onRefresh }: StateViewProps) => {
    const categoryLabel = categoryInfo.plural;
    const categoryLower = categoryLabel.toLowerCase();
    const CategoryIcon = categoryInfo.icon;
    const iconColor = categoryInfo.color;

    const getEmptyMessage = () => {
        if (categoryLower === 'properties') {
            return {
                title: 'Refresh to discover more Properties',
                description: 'New opportunities appear every day. Keep swiping!'
            };
        }
        if (categoryLower === 'motorcycles') {
            return {
                title: 'Refresh to find more Motorcycles',
                description: 'New bikes listed daily. Stay tuned!'
            };
        }
        if (categoryLower === 'bicycles') {
            return {
                title: 'Refresh to discover more Bicycles',
                description: 'Fresh rides added regularly. Keep checking!'
            };
        }
        if (categoryLower === 'workers' || categoryLower === 'services') {
            return {
                title: 'Refresh to find more Workers',
                description: 'New professionals join every day.'
            };
        }
        return {
            title: `Refresh to discover more ${categoryLabel}`,
            description: `New ${categoryLabel.toLowerCase()} added regularly.`
        };
    };

    const { title, description } = getEmptyMessage();

    return (
        <div className="relative w-full flex-1 flex items-center justify-center px-4" style={{ minHeight: 'calc(100dvh - 140px)' }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="text-center space-y-6 p-8"
            >
                <div className="flex justify-center">
                    <motion.div
                        animate={{ scale: [1, 1.15, 1, 1.1, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className={`w-20 h-20 rounded-full border-[3px] border-current flex items-center justify-center ${iconColor}`}
                    >
                        <CategoryIcon className="w-10 h-10" strokeWidth={4} />
                    </motion.div>
                </div>

                <div className="space-y-2">
                    <h3 className="text-xl font-black text-foreground uppercase tracking-tight">{title}</h3>
                    <p className="text-muted-foreground text-sm max-w-xs mx-auto font-extrabold opacity-80">
                        {description}
                    </p>
                </div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className="gap-2 rounded-full px-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg font-black uppercase tracking-widest text-xs"
                    >
                        {isRefreshing ? (
                            <RadarSearchIcon size={18} isActive={true} />
                        ) : (
                            <RefreshCw className="w-4 h-4" strokeWidth={4} />
                        )}
                        {isRefreshing ? 'Scanning...' : `Refresh ${categoryLabel}`}
                    </Button>
                </motion.div>

            </motion.div>
        </div>
    );
};
