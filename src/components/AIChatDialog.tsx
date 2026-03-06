import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { useTheme } from '@/hooks/useTheme';

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export function AIChatDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Swipess AI is currently under maintenance. We are building something legendary for you! \n\nStay tuned for the new AI Concierge experience.' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { theme } = useTheme();
    const isDark = theme !== 'white-matte';

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');

        // Add user message
        setMessages(prev => [...prev, { role: 'user' as const, content: userMessage }]);

        // Simulator response
        setIsLoading(true);
        setTimeout(() => {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "Our AI systems are being upgraded. Your feedback has been noted and will help us build a better Swipess!"
            }]);
            setIsLoading(false);
        }, 1000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Dialog */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className={cn(
                    "relative w-full max-w-lg h-[80vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl border",
                    isDark ? "bg-[#0A0A0B] border-white/10" : "bg-white border-black/10"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-md">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500/20 to-orange-500/20">
                            <Sparkles className="w-5 h-5 text-pink-500" />
                        </div>
                        <div>
                            <h2 className="font-bold text-foreground lowercase tracking-tighter">swipess AI</h2>
                            <p className="text-[10px] opacity-50 uppercase font-black tracking-widest">Offline Mode</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {/* Chat Area */}
                <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                    <div className="space-y-4">
                        {messages.filter(m => m.role !== 'system').map((message, i) => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={i}
                                className={cn(
                                    "flex gap-3 max-w-[85%]",
                                    message.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                                )}
                            >
                                <div className={cn(
                                    "flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0",
                                    message.role === 'user'
                                        ? "bg-gradient-to-br from-pink-500 to-orange-500 text-white"
                                        : "bg-muted text-muted-foreground"
                                )}>
                                    {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                </div>
                                <div className={cn(
                                    "px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap",
                                    message.role === 'user'
                                        ? "bg-gradient-to-br from-pink-500/90 to-orange-500/90 text-white rounded-tr-none"
                                        : "bg-muted text-foreground rounded-tl-none shadow-sm"
                                )}>
                                    {message.content}
                                </div>
                            </motion.div>
                        ))}
                        {isLoading && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex gap-3 max-w-[85%] mr-auto"
                            >
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground flex-shrink-0">
                                    <Bot className="w-4 h-4" />
                                </div>
                                <div className="px-5 py-4 rounded-2xl bg-muted rounded-tl-none flex items-center justify-center">
                                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                </div>
                            </motion.div>
                        )}
                    </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="p-4 border-t border-border bg-card/50 backdrop-blur-md">
                    <form
                        onSubmit={handleSubmit}
                        className="flex items-end gap-2"
                    >
                        <Textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a message..."
                            className="min-h-[44px] max-h-[120px] rounded-2xl resize-none py-3 px-4 flex-1 focus-visible:ring-1 focus-visible:ring-pink-500 border-border bg-background/50"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={!input.trim() || isLoading}
                            className="w-11 h-11 rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-lg flex-shrink-0 active:scale-95 transition-transform"
                        >
                            <Send className="w-5 h-5" />
                        </Button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
