# AI Memory System Implementation

## Overview
This implementation adds a comprehensive memory system to the AI concierge, allowing the AI to remember user information across conversations and provide personalized responses.

## What Was Implemented

### 1. Database Schema (`supabase/migrations/20260330_ai_memory_system.sql`)
Created three new tables:

- **ai_memories**: Stores user-specific memories
  - `id`: UUID primary key
  - `user_id`: References auth.users
  - `memory_type`: person, preference, fact, contact, location, service, custom
  - `category`: Optional categorization
  - `content`: The actual memory text
  - `metadata`: JSONB for additional data
  - `importance`: 1-10 scale for prioritization
  - `last_accessed_at`: Tracks when memory was last used

- **ai_conversations**: Stores conversation sessions
  - `id`: UUID primary key
  - `user_id`: References auth.users
  - `title`: Auto-generated from first message
  - `context`: JSONB for conversation context

- **ai_conversation_messages**: Stores individual messages
  - `id`: UUID primary key
  - `conversation_id`: References ai_conversations
  - `role`: user, assistant, or system
  - `content`: Message text
  - `metadata`: JSONB for additional data

### 2. TypeScript Types (`src/integrations/supabase/types.ts`)
Added type definitions for all three new tables to maintain type safety.

### 3. useAIMemory Hook (`src/hooks/ai/useAIMemory.ts`)
Created a comprehensive React hook with the following capabilities:

**Memory Management:**
- `saveMemory()`: Save new memories with type, category, content, and importance
- `searchMemories()`: Search memories by content with similarity matching
- `getRecentMemories()`: Get most recent memories
- `getAllMemories()`: Get all user memories
- `updateMemory()`: Update existing memories
- `deleteMemory()`: Delete memories
- `updateMemoryAccess()`: Track when memories are accessed
- `formatMemoriesForAI()`: Format memories for AI context injection

**Conversation Management:**
- `createConversation()`: Start new conversation sessions
- `getConversations()`: Get all conversation history
- `saveMessage()`: Save messages to conversations
- `getConversationMessages()`: Get messages for a conversation
- `deleteConversation()`: Delete conversations

### 4. ConciergeChat Component (`src/components/ConciergeChat.tsx`)
Redesigned chat interface with:

**Memory Panel:**
- Toggle button to show/hide memory bank
- Search functionality to filter memories
- Display of memory type, category, content, and importance rating
- Visual importance indicators (stars)

**Conversation History:**
- Toggle button to show/hide conversation history
- List of past conversations with titles and dates
- Click to load previous conversations
- Delete individual conversations

**Improved UI:**
- Modern, polished design with dark/light mode support
- Smooth animations using Framer Motion
- Quick action prompts for common tasks
- Typing indicator with animated logo
- User avatar support
- Gradient styling for user messages
- Responsive layout

**AI Integration:**
- Automatic memory context injection into AI prompts
- Support for AI-saved memories (AI can save memories during conversation)
- Real-time memory updates

### 5. AI Orchestrator Updates (`supabase/functions/ai-orchestrator/index.ts`)
Enhanced the chat task to:

**Memory Context Injection:**
- Accepts `memoryContext` parameter from frontend
- Injects user's personal knowledge base into system prompt
- AI can reference stored memories in responses

**Memory Saving:**
- AI can save memories by including JSON in response
- Format: `{"saveMemory": {"type": "...", "category": "...", "content": "...", "importance": ...}}`
- Automatic extraction and processing of save requests

**System Prompt Enhancement:**
- Added MEMORY SYSTEM section with instructions
- Examples of when and how to save memories
- Guidelines for memory importance levels

## How It Works

### Saving Memories
1. User tells AI something: "Remember that John's number is 555-1234, he's a masculinity coach"
2. AI responds naturally and includes save instruction in response
3. Frontend extracts save instruction and calls `saveMemory()`
4. Memory is stored in database with appropriate type and importance

### Using Memories
1. When chat opens, frontend loads user's memories via `getAllMemories()`
2. Memories are formatted and sent to AI orchestrator as `memoryContext`
3. AI includes memories in system prompt
4. AI can reference memories in responses: "I remember you mentioned John, the masculinity coach..."

### Conversation History
1. Each chat session creates a conversation record
2. All messages are saved to the conversation
3. Users can view and load past conversations
4. Conversations persist across sessions

## Usage

### For Users
1. Open the AI Concierge chat
2. Tell the AI things to remember:
   - "Remember that John's number is 555-1234"
   - "Save this: Masculinity Coach website is example.com"
   - "I prefer apartments in Tulum"
3. Click the brain icon to view your memory bank
4. Click the clock icon to view conversation history
5. Search memories using the search bar

### For Developers
```typescript
import { useAIMemory } from '@/hooks/ai/useAIMemory';

function MyComponent() {
  const {
    memories,
    saveMemory,
    searchMemories,
    createConversation,
    saveMessage,
  } = useAIMemory();

  // Save a memory
  await saveMemory({
    memory_type: 'contact',
    category: 'masculinity coach',
    content: "John's phone number is 555-1234",
    importance: 7,
  });

  // Search memories
  const results = await searchMemories('John');

  // Create conversation
  const conversation = await createConversation('My first chat');

  // Save message
  await saveMessage(conversation.id, 'user', 'Hello!');
}
```

## Benefits

1. **Personalization**: AI remembers user preferences and information
2. **Context Awareness**: AI can reference past conversations and memories
3. **Efficiency**: Users don't need to repeat information
4. **Organization**: Memories are categorized and searchable
5. **Persistence**: All data persists across sessions
6. **Privacy**: Row-level security ensures users only see their own data

## Future Enhancements

1. **Memory Consolidation**: Automatically merge similar memories
2. **Memory Expiration**: Auto-delete old, unused memories
3. **Memory Sharing**: Allow users to share memories with the AI
4. **Advanced Search**: Semantic search using embeddings
5. **Memory Analytics**: Show memory usage statistics
6. **Export/Import**: Allow users to backup their memories
