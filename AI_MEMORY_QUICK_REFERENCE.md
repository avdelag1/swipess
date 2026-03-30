# AI Memory System - Quick Reference

## For Users

### How to Save Memories
Just tell the AI naturally:
- "Remember that John's number is 555-1234"
- "Save this: Masculinity Coach website is example.com"
- "I prefer apartments in Tulum"
- "Remember: Best tacos are at La Chiapaneca"

### How to View Memories
1. Open AI Concierge chat
2. Click the **brain icon** 🧠 in the header
3. Search or browse your memories

### How to View Conversation History
1. Open AI Concierge chat
2. Click the **clock icon** 🕐 in the header
3. Click any conversation to load it

### Memory Types
- **Person**: People you know (John, Maria, etc.)
- **Preference**: Your preferences (likes quiet areas, pet-friendly, etc.)
- **Fact**: Facts you've shared (my budget is $1000/month)
- **Contact**: Contact information (phone numbers, emails)
- **Location**: Location preferences (Tulum, Cancun, etc.)
- **Service**: Services you use (cleaning, maintenance, etc.)
- **Custom**: Anything else

### Importance Levels
Memories are rated 1-10 stars:
- ⭐ 1-3: Low importance
- ⭐⭐ 4-6: Medium importance
- ⭐⭐⭐ 7-10: High importance

## For Developers

### Import the Hook
```typescript
import { useAIMemory } from '@/hooks/ai/useAIMemory';
```

### Basic Usage
```typescript
const {
  memories,
  saveMemory,
  searchMemories,
  getAllMemories,
  createConversation,
  saveMessage,
  getConversationMessages,
  deleteConversation,
  formatMemoriesForAI,
} = useAIMemory();
```

### Save a Memory
```typescript
await saveMemory({
  memory_type: 'contact',
  category: 'masculinity coach',
  content: "John's phone number is 555-1234",
  importance: 7,
});
```

### Search Memories
```typescript
const results = await searchMemories('John');
// Returns memories containing "John"
```

### Create Conversation
```typescript
const conversation = await createConversation('My first chat');
if (conversation) {
  console.log('Conversation ID:', conversation.id);
}
```

### Save Message
```typescript
await saveMessage(conversationId, 'user', 'Hello!');
await saveMessage(conversationId, 'assistant', 'Hi there!');
```

### Get Conversation Messages
```typescript
const messages = await getConversationMessages(conversationId);
// Returns array of messages with role, content, timestamp
```

### Format Memories for AI
```typescript
const formatted = formatMemoriesForAI(memories);
// Returns formatted string for AI context
```

## Database Tables

### ai_memories
```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- memory_type: TEXT (person|preference|fact|contact|location|service|custom)
- category: TEXT (optional)
- content: TEXT (the memory)
- metadata: JSONB (additional data)
- importance: INTEGER (1-10)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
- last_accessed_at: TIMESTAMPTZ
```

### ai_conversations
```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- title: TEXT (optional)
- context: JSONB (additional context)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### ai_conversation_messages
```sql
- id: UUID (primary key)
- conversation_id: UUID (references ai_conversations)
- role: TEXT (user|assistant|system)
- content: TEXT (message text)
- metadata: JSONB (additional data)
- created_at: TIMESTAMPTZ
```

## API Endpoints

### AI Orchestrator Chat Task
```typescript
POST /functions/v1/ai-orchestrator

{
  task: 'chat',
  data: {
    query: 'User message',
    messages: [...previousMessages],
    memoryContext: 'Formatted memories string',
    userId: 'user-uuid'
  }
}
```

### Response Format
```typescript
{
  result: {
    text: 'AI response',
    message: 'AI response',
    saveMemory: {
      type: 'contact',
      category: 'masculinity coach',
      content: 'John's phone number is 555-1234',
      importance: 7
    }
  },
  provider_used: 'gemini|minimax'
}
```

## Troubleshooting

### Memories not saving
- Check that user is authenticated
- Verify database migration was applied
- Check browser console for errors

### AI not using memories
- Verify memoryContext is being passed to AI orchestrator
- Check that memories are being formatted correctly
- Ensure AI orchestrator has memory support enabled

### Conversation history not loading
- Check that user is authenticated
- Verify ai_conversations table exists
- Check browser console for errors
