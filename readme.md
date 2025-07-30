# Heirloom Backend

A real-time chat and notification backend built with Node.js, MongoDB, Pinecone, Firebase, and Socket.IO. Supports 1-to-1 messaging, assistant chat (AI), push notifications, and rich relationship management.

## Features

- **Real-time Chat:** 1-to-1 messaging with read receipts, media, and AI assistant support.
- **Assistant Chat:** AI-powered assistant using OpenAI, Pinecone for vector search, and streaming responses.
- **Push Notifications:** Firebase Cloud Messaging (FCM) for device notifications.
- **Relationship Management:** Rich family/friend relationship types and statuses.
- **Socket.IO:** Real-time updates for messages, conversations, and notifications.
- **Robust MongoDB Models:** For users, messages, conversations, friends, and assistant chats.
- **Efficient Data Handling:** Optimized for low latency and type safety.

## Tech Stack

- **Node.js** (TypeScript)
- **MongoDB** (Mongoose)
- **Pinecone** (Vector DB for semantic search)
- **OpenAI** (Assistant/AI chat)
- **Firebase Admin SDK** (Push notifications)
- **Socket.IO** (Real-time communication)
- **Bull** (Background jobs/queues)

## Project Structure

```
src/
  modules/
    messages/         # Messaging logic, models, controllers
    Assistant/        # Assistant chat logic
    friends/          # Friend/relationship management
    notifications/    # Push notification logic
    user/             # User management
  utils/              # Shared utilities (socket, formatting, etc.)
  DB/                 # Pinecone and DB integrations
  bull/               # Queue processing
public/images/        # Uploaded images
logs/                 # Log files
```

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure environment:**

   - Set up your `.env` file with MongoDB, Firebase, Pinecone, and OpenAI credentials.
   - Place your Firebase service account JSON at the configured path.

3. **Run the server:**

   ```bash
   npm run dev
   ```

4. **(Optional) Start Bull queue workers:**
   ```bash
   npm run bull
   ```

## Key Endpoints

- `POST /api/v1/message/send` — Send a message (real-time + AI support)
- `GET /api/v1/assistant/conversations` — Get assistant chat history
- `POST /api/v1/assistant/send` — Send a message to the assistant
- `POST /api/v1/notifications/push` — Send push notification

## Relationships

Supported relationship types (see `src/modules/friends/friends.interface.ts`):

- friend, mother, father, sister, brother, son, daughter, grandmother, grandfather, grandson, granddaughter, aunt, uncle, cousin, nephew, niece, mother-in-law, father-in-law, brother-in-law, sister-in-law, stepmother, stepfather, stepbrother, stepsister

## Contributing

1. Fork the repo
2. Create a feature branch
3. Commit your changes
4. Open a pull request

## License

MIT
