# Gmail PWA

A Progressive Web App for managing Gmail built with Next.js 14, NextAuth.js, and the Gmail API.

## Features

- Read and manage your inbox
- Compose, reply, and forward emails
- View sent, drafts, trash, and spam folders
- Download attachments
- Search emails
- Label management
- Works offline as a PWA
- Modern minimal UI design

### AI Assistant (Llama 4 Maverick via Groq)

- **Smart Summaries**: Get concise AI-generated summaries of long emails
- **Smart Replies**: Generate professional, friendly, or brief reply suggestions
- **Email Analysis**: Auto-categorize emails, detect priority, and suggest labels
- **Action Item Extraction**: Automatically identify tasks and follow-ups from emails

## Setup

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select an existing one)
3. Enable the **Gmail API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (for development)
     - `https://your-domain.vercel.app/api/auth/callback/google` (for production)
5. Copy the Client ID and Client Secret

### 2. Environment Variables

Create a `.env.local` file in the project root:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
NEXTAUTH_SECRET=your_random_secret_here
NEXTAUTH_URL=http://localhost:3000
AI_GATEWAY_API_KEY=your_groq_api_key_here
```

To get the AI Gateway API key:
1. Go to [Groq Console](https://console.groq.com)
2. Create an account and generate an API key

To generate a secure `NEXTAUTH_SECRET`, run:
```bash
openssl rand -base64 32
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Generate PWA Icons

Replace the placeholder icons in `public/icons/` with your own icons in the following sizes:
- 72x72
- 96x96
- 128x128
- 144x144
- 152x152
- 192x192
- 384x384
- 512x512

You can use the provided SVG at `public/icons/icon.svg` as a template and convert it to PNG files using tools like:
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator)

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Build for Production

```bash
npm run build
npm run start
```

## Deployment to Vercel

1. Push your code to a GitHub repository
2. Go to [Vercel](https://vercel.com) and import your repository
3. Add the environment variables in the Vercel dashboard:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (set to your Vercel domain, e.g., `https://your-app.vercel.app`)
   - `AI_GATEWAY_API_KEY` (for AI features)
4. Deploy!

Don't forget to add the production callback URL to your Google Cloud Console OAuth credentials.

## Project Structure

```
gmail-pwa/
├── src/
│   ├── app/
│   │   ├── (mail)/          # Protected mail routes
│   │   │   ├── inbox/       # Inbox page
│   │   │   ├── compose/     # Compose page
│   │   │   ├── sent/        # Sent page
│   │   │   └── ...          # Other mail pages
│   │   ├── api/
│   │   │   ├── auth/        # NextAuth API
│   │   │   └── gmail/       # Gmail API routes
│   │   └── page.tsx         # Landing page
│   ├── components/          # React components
│   ├── lib/                 # Utilities and API wrappers
│   └── types/               # TypeScript types
├── public/
│   ├── manifest.json        # PWA manifest
│   └── icons/               # PWA icons
└── next.config.ts           # Next.js configuration
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Authentication**: NextAuth.js with Google OAuth
- **API**: Gmail API via googleapis
- **AI**: Llama 4 Maverick via Groq
- **Styling**: Tailwind CSS
- **PWA**: next-pwa
- **State Management**: SWR for data fetching

## License

MIT
