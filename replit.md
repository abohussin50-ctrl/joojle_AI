# joojle AI

## Overview

joojle AI is a modern AI chat application that provides an intelligent conversational interface powered by OpenAI. Users can create chat sessions, send messages with optional image attachments, and receive AI-generated responses. The application features user authentication via Supabase, bilingual support (English/Arabic), and a polished dark-mode UI inspired by Google's Gemini aesthetic.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **Animations**: Framer Motion for smooth UI transitions and message animations
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful endpoints under `/api/` prefix with Zod validation
- **Build System**: Custom esbuild script for production bundling, Vite dev server with HMR for development

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` defines all tables (users, chats, messages)
- **Migrations**: Drizzle Kit manages migrations in `migrations/` folder
- **Privacy Model**: Chats are scoped to user IDs - each user only sees their own conversations

### Authentication
- **Provider**: Supabase Auth with Google OAuth integration
- **Client**: Supabase JS client initialized in `client/src/lib/supabase.ts`
- **User ID Handling**: Supabase UUIDs stored as TEXT in the database
- **Session Flow**: Frontend manages auth state via React context, passes user ID in request headers

### Key Design Patterns
- **Shared Types**: Database schemas and API route definitions live in `shared/` and are used by both client and server
- **Optimistic Updates**: Chat messages use optimistic rendering for instant feedback
- **Type Safety**: End-to-end type safety from database schema to API responses to React components

## External Dependencies

### AI Services
- **OpenAI API**: Used for chat completions and image generation via Replit AI Integrations
- **Environment Variables**: `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL`

### Authentication
- **Supabase**: Handles user authentication with Google OAuth
- **Configuration**: Hardcoded Supabase URL and anon key in `client/src/lib/supabase.ts`

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **Connection Pooling**: Uses `pg.Pool` for connection management

### Third-Party Libraries
- **react-markdown**: Renders AI responses with markdown formatting
- **date-fns**: Formats timestamps in chat messages
- **Radix UI**: Provides accessible UI primitives for all interactive components
- **Lucide React**: Icon library used throughout the interface