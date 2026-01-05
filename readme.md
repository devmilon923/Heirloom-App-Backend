# Heirloom - AI-Powered Personal Assistant

An intelligent personal assistant that remembers your conversations, understands your relationships, and provides contextual support across all your interactions. Built with advanced memory architecture and real-time conversation analysis.

## What Makes Heirloom Special

**Dual-Memory Architecture**
- **Short-term memory:** Handles your active conversation context for immediate, relevant responses
- **Long-term memory:** Stores and recalls important information across sessions with enhanced reasoning capabilities

**Intelligent Chat Behavior Monitor**
- Automatically analyzes conversations in real-time
- Detects and saves relevant information to long-term memory without manual intervention
- Ensures contextual awareness across all your chat sessions

**Smart Chat Isolation**
- Secure separation between different conversation threads
- Each conversation maintains its own independent context
- Multi-user support with complete data privacy

**Relationship-Aware System**
- Understands and tracks your family and friend relationships
- Provides context-appropriate responses based on relationship types
- Manages legacy messages and memory sharing with trusted contacts

## Key Features

✓ **User-Specific Memory Retention** - Your conversations and preferences are remembered uniquely for you

✓ **Relationship Tracking** - Recognizes connections with family members and friends (parents, siblings, grandparents, cousins, in-laws, and more)

✓ **Contextual Understanding** - Maintains conversation context across multiple sessions and topics

✓ **Real-Time Messaging** - Instant 1-to-1 communication with read receipts and media support

✓ **Push Notifications** - Stay updated with Firebase Cloud Messaging integration

✓ **Friend & Family Access Controls** - Manage who can interact with your assistant and shared memories

## Technology Stack

- **Backend:** Node.js with TypeScript for type-safe, scalable architecture
- **Database:** MongoDB for flexible data storage and retrieval
- **Vector Database:** Pinecone for intelligent semantic search and context retrieval
- **AI Integration:** OpenAI API for natural language understanding and generation
- **Real-Time Communication:** Socket.IO for instant message delivery
- **Notifications:** Firebase Admin SDK for cross-platform push notifications
- **Caching:** Redis for optimized performance and quick data access

## Quick Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   - Create a `.env` file with your MongoDB, Firebase, Pinecone, and OpenAI credentials
   - Add your Firebase service account JSON file

3. **Start the server:**
   ```bash
   npm run dev
   ```

## Use Cases

- Personal journal with intelligent memory retention
- Mood tracking and emotional support companion
- Family legacy preservation and shared memories
- Contextual reminders based on conversations
- Relationship-aware communication assistant

## Privacy & Security

- End-to-end conversation isolation
- User-specific data encryption
- Granular access controls for shared memories
- Secure authentication and authorization

## License

MIT

---

*Heirloom - Your memories, relationships, and conversations, intelligently preserved.*