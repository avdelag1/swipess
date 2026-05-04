import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Trash2, Plus, X, User, Heart, StickyNote, Lightbulb } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUserMemories, type MemoryCategory } from '@/hooks/useUserMemories';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/microPolish';
import { formatDistanceToNow } from '@/utils/timeFormatter';

interface MemoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isDark: boolean;
}

const CATEGORIES: { value: MemoryCategory; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'contact',    label: 'Contact',    icon: User,        color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { value: 'preference', label: 'Preference', icon: Heart,       color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
  { value: 'note',       label: 'Note',       icon: StickyNote,  color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { value: 'fact',       label: 'Fact',       icon: Lightbulb,   color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
];

function getCategoryStyle(cat: MemoryCategory) {
  return CATEGORIES.find(c => c.value === cat) || CATEGORIES[3];
}

export function MemoryDrawer({ open, onOpenChange, isDark }: MemoryDrawerProps) {
  const { memories, isLoading, addMemory, deleteMemory } = useUserMemories();
  const [activeCategory, setActiveCategory] = useState<MemoryCategory | 'all'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryCategory>('fact');
  const [isSaving, setIsSaving] = useState(false);

  const filtered = activeCategory === 'all'
    ? memories
    : memories.filter(m => m.category === activeCategory);

  const handleAdd = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    haptics.tap();
    setIsSaving(true);
    await addMemory.mutateAsync({ category: newCategory, title: newTitle.trim(), content: newContent.trim() });
    setNewTitle('');
    setNewContent('');
    setShowAddForm(false);
    setIsSaving(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={cn(
          "rounded-t-[2rem] p-0 flex flex-col border-0 focus:outline-none",
          isDark
            ? "bg-gradient-to-b from-zinc-900 to-zinc-950 text-white"
            : "bg-white text-black"
        )}
        style={{ height: '72vh', maxHeight: '680px' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 shrink-0">
          <div className={cn("w-10 h-1 rounded-full", isDark ? "bg-zinc-700" : "bg-black/5")} />
        </div>

        {/* Header */}
        <div className={cn("flex items-center justify-between px-5 py-3 border-b shrink-0", isDark ? "border-zinc-800" : "border-black/5")}>
          <div className="flex items-center gap-2">
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", isDark ? "bg-cyan-500/10" : "bg-cyan-50")}>
              <Brain className={cn("w-4 h-4", isDark ? "text-cyan-400" : "text-cyan-600")} />
            </div>
            <div>
              <h3 className={cn("font-bold text-sm", isDark ? "text-white" : "text-black")}>AI Memory</h3>
              <p className={cn("text-[10px]", isDark ? "text-zinc-500" : "text-black/30")}>
                {memories.length === 0 ? 'Nothing stored yet' : `${memories.length} item${memories.length === 1 ? '' : 's'} stored`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { haptics.tap(); setShowAddForm(v => !v); }}
              className={cn("h-8 w-8 rounded-lg", isDark ? "text-cyan-400 hover:bg-cyan-500/10" : "text-cyan-600 hover:bg-cyan-50")}
              title="Add memory"
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className={cn("h-8 w-8 rounded-lg", isDark ? "text-zinc-400 hover:text-white hover:bg-zinc-800" : "text-black/40 hover:bg-black/5")}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Add Memory Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={cn("px-4 py-3 border-b shrink-0 space-y-2", isDark ? "border-zinc-800 bg-zinc-900/50" : "border-black/5 bg-black/[0.02]")}
            >
              <div className="flex gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => setNewCategory(cat.value)}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border transition-all",
                      newCategory === cat.value
                        ? cat.color
                        : isDark ? "text-zinc-500 bg-transparent border-zinc-700 hover:border-zinc-600" : "text-black/30 bg-transparent border-black/10"
                    )}
                  >
                    <cat.icon className="w-3 h-3" />
                    {cat.label}
                  </button>
                ))}
              </div>
              <Input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Title (e.g. John - Masculinity Coach)"
                className={cn("h-9 text-sm rounded-xl", isDark ? "bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500" : "bg-white border-black/10")}
              />
              <Textarea
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                placeholder="Details (phone, website, notes...)"
                className={cn("min-h-[64px] max-h-24 resize-none text-sm rounded-xl", isDark ? "bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500" : "bg-white border-black/10")}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleAdd}
                  disabled={!newTitle.trim() || !newContent.trim() || isSaving}
                  size="sm"
                  className={cn("flex-1 h-9 rounded-xl text-xs font-bold", isDark ? "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white" : "bg-gradient-to-r from-cyan-500 to-blue-500 text-white")}
                >
                  {isSaving ? 'Saving...' : 'Save Memory'}
                </Button>
                <Button
                  onClick={() => setShowAddForm(false)}
                  variant="ghost"
                  size="sm"
                  className={cn("h-9 rounded-xl text-xs", isDark ? "text-zinc-400 hover:bg-zinc-800" : "text-black/40 hover:bg-black/5")}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category Tabs */}
        <div className={cn("flex gap-1 px-4 py-2 border-b shrink-0 overflow-x-auto", isDark ? "border-zinc-800" : "border-black/5")}>
          <button
            onClick={() => setActiveCategory('all')}
            className={cn(
              "px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all",
              activeCategory === 'all'
                ? isDark ? "bg-white/10 text-white" : "bg-black text-white"
                : isDark ? "text-zinc-500 hover:text-zinc-300" : "text-black/30 hover:text-black"
            )}
          >
            All ({memories.length})
          </button>
          {CATEGORIES.map(cat => {
            const count = memories.filter(m => m.category === cat.value).length;
            if (count === 0) return null;
            return (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={cn(
                  "flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all border",
                  activeCategory === cat.value
                    ? cat.color
                    : isDark ? "text-zinc-500 border-transparent hover:text-zinc-300" : "text-black/30 border-transparent hover:text-black"
                )}
              >
                <cat.icon className="w-3 h-3" />
                {cat.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Memory List */}
        <ScrollArea className="flex-1 px-4 py-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-24">
              <div className={cn("text-sm", isDark ? "text-zinc-500" : "text-gray-400")}>Loading memories...</div>
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-32 gap-2"
            >
              <Brain className={cn("w-8 h-8", isDark ? "text-zinc-700" : "text-black/10")} />
              <p className={cn("text-sm font-medium", isDark ? "text-zinc-600" : "text-black/20")}>
                {activeCategory === 'all' ? 'No memories yet' : `No ${activeCategory} memories`}
              </p>
              <p className={cn("text-xs text-center max-w-[200px]", isDark ? "text-zinc-700" : "text-black/10")}>
                Tap + to add, or just tell Vibe something — it'll remember automatically.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-2 pb-4">
              <AnimatePresence>
                {filtered.map((memory, index) => {
                  const cat = getCategoryStyle(memory.category);
                  return (
                    <motion.div
                      key={memory.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0, transition: { delay: index * 0.04 } }}
                      exit={{ opacity: 0, x: -20, transition: { duration: 0.15 } }}
                      className={cn(
                        "group flex gap-3 p-3 rounded-xl border transition-all",
                        isDark
                          ? "bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-600"
                          : "bg-white border-black/5 hover:border-black/10 shadow-sm"
                      )}
                    >
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 border mt-0.5", cat.color)}>
                        <cat.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn("text-sm font-semibold leading-tight truncate", isDark ? "text-white" : "text-black")}>
                            {memory.title}
                          </p>
                          <div className="flex items-center gap-1 shrink-0">
                            {memory.source === 'ai' && (
                              <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border", isDark ? "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" : "text-cyan-600 bg-cyan-50 border-cyan-200")}>
                                AI
                              </span>
                            )}
                            <button
                              onClick={() => { haptics.error(); deleteMemory.mutate(memory.id); }}
                              className={cn("opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:text-rose-500", isDark ? "text-zinc-500 hover:bg-zinc-700" : "text-black/30 hover:bg-black/5")}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className={cn("text-xs mt-0.5 line-clamp-2 leading-relaxed", isDark ? "text-zinc-400" : "text-black/50")}>
                          {memory.content}
                        </p>
                        {memory.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {memory.tags.map(tag => (
                              <span key={tag} className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-medium", isDark ? "bg-zinc-700 text-zinc-400" : "bg-black/5 text-black/40")}>
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className={cn("text-[9px] mt-1.5", isDark ? "text-zinc-600" : "text-black/20")}>
                          {formatDistanceToNow(memory.created_at)}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}


