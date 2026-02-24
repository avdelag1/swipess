import { memo } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from '@/utils/timeFormatter';

export interface MessageType {
    id: string;
    conversation_id: string;
    sender_id: string;
    message_text: string;
    message_type: string;
    created_at: string;
    is_read?: boolean;
    sender?: {
        id: string;
        full_name: string;
        avatar_url?: string;
    };
}

const bubbleVariants = {
    hidden: (isMyMessage: boolean) => ({
        opacity: 0,
        scale: 0.85,
        x: isMyMessage ? 15 : -15,
        filter: 'blur(10px)'
    }),
    visible: {
        opacity: 1,
        scale: 1,
        x: 0,
        filter: 'blur(0px)',
        transition: { type: 'spring', stiffness: 500, damping: 30, mass: 1 }
    }
};

const getBubbleColors = (otherUserRole: string, isMyMessage: boolean) => {
    if (!isMyMessage) {
        return {
            background: 'bg-[#2C2C2E]/90 backdrop-blur-md',
            text: 'text-white',
            timestamp: 'text-white/40'
        };
    }

    if (otherUserRole === 'owner') {
        return {
            background: 'bg-gradient-to-br from-[#A855F7] via-[#8B5CF6] to-[#6366F1] shadow-[0_4px_15px_rgba(139,92,246,0.3)]',
            text: 'text-white',
            timestamp: 'text-white/50'
        };
    } else {
        return {
            background: 'bg-gradient-to-br from-[#0A84FF] to-[#007AFF] shadow-[0_4px_15px_rgba(0,122,255,0.3)]',
            text: 'text-white',
            timestamp: 'text-white/50'
        };
    }
};

export const MessageBubble = memo(({
    message,
    isMyMessage,
    otherUserRole
}: {
    message: MessageType;
    isMyMessage: boolean;
    otherUserRole: string
}) => {
    const colors = getBubbleColors(otherUserRole, isMyMessage);

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            custom={isMyMessage}
            variants={bubbleVariants}
            className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} mb-1.5 px-2`}
        >
            <div
                className={`max-w-[82%] px-4 py-2.5 ${colors.background} ${colors.text} ${isMyMessage
                        ? 'rounded-[22px] rounded-br-[4px]'
                        : 'rounded-[22px] rounded-bl-[4px]'
                    } border border-white/10`}
            >
                <p className="text-[15px] break-words whitespace-pre-wrap leading-[1.35] tracking-tight">{message.message_text}</p>
                <div className="flex items-center justify-end gap-1.5 mt-1.5">
                    <p className={`text-[9px] font-medium uppercase tracking-wider ${colors.timestamp}`}>
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: false })}
                    </p>
                </div>
            </div>
        </motion.div>
    );
});

MessageBubble.displayName = 'MessageBubble';
