# OpenAI ChatKit Integration Guide

## Quick Setup (3-4 hours)

### Step 1: Install ChatKit
```bash
cd frontend-chatbot
npm install @openai/chatkit
```

### Step 2: Configure Domain Allowlist
1. Deploy frontend-chatbot to Vercel (get production URL)
2. Go to: https://platform.openai.com/settings/organization/security/domain-allowlist
3. Add your domain (e.g., `https://your-app.vercel.app`)
4. Copy the domain key provided

### Step 3: Add Environment Variable
```bash
# frontend-chatbot/.env.local
NEXT_PUBLIC_OPENAI_DOMAIN_KEY=your-domain-key-here
NEXT_PUBLIC_API_URL=http://localhost:8000  # Your backend
```

### Step 4: Create ChatKit Page
**File**: `frontend-chatbot/app/chatkit/page.tsx`

```typescript
'use client';

import { ChatKit } from '@openai/chatkit';
import { useState } from 'react';

export default function ChatKitPage() {
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState<number | null>(null);

  const handleSendMessage = async (message: string) => {
    // Add user message to UI
    setMessages(prev => [...prev, { role: 'user', content: message }]);

    try {
      // Call your backend /api/chat endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          message,
        }),
      });

      const data = await response.json();

      // Update conversation ID if new
      if (!conversationId) {
        setConversationId(data.conversation_id);
      }

      // Add assistant response
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error.'
      }]);
    }
  };

  return (
    <div className="h-screen">
      <ChatKit
        messages={messages}
        onSendMessage={handleSendMessage}
        domainKey={process.env.NEXT_PUBLIC_OPENAI_DOMAIN_KEY}
        placeholder="Ask me to manage your tasks..."
      />
    </div>
  );
}
```

### Step 5: Add Navigation Link
**File**: `frontend-chatbot/app/layout.tsx`

```typescript
<nav>
  <Link href="/">Custom Chat</Link>
  <Link href="/chatkit">ChatKit Version</Link>
</nav>
```

### Step 6: Test
```bash
npm run dev
# Visit http://localhost:3001/chatkit
```

---

## Verification Checklist
- [ ] ChatKit package installed
- [ ] Domain added to OpenAI allowlist
- [ ] Environment variable set
- [ ] ChatKit route working
- [ ] Messages sending/receiving
- [ ] Backend integration functional

---

## Time Estimate
- Setup & config: 1 hour
- Integration: 1-2 hours
- Testing & debugging: 1 hour
- **Total**: 3-4 hours
