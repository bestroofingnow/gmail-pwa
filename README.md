# Google Workspace PWA

A Progressive Web App for managing Google Workspace built with Next.js 14, NextAuth.js, and Google APIs.

## Features

### Gmail
- Read and manage your inbox
- Compose, reply, and forward emails
- View sent, drafts, trash, and spam folders
- Download attachments
- Search emails
- Label management

### Google Calendar
- View upcoming events
- Create and manage calendar events
- AI-powered meeting time suggestions
- Auto-generate meeting agendas

### Google Drive
- Browse and search files
- Create folders
- View storage quota
- AI-powered file organization suggestions

### Google Sheets
- List and create spreadsheets
- AI-powered data analysis

### Google Docs
- List and create documents
- AI-powered document summaries

### Google Forms
- List and create forms
- AI-powered form question generation
- Response analysis

### AI Assistant (Llama 4 Maverick via Groq)

- **Smart Summaries**: AI-generated summaries for emails and documents
- **Smart Replies**: Generate professional, friendly, or brief reply suggestions
- **Email Analysis**: Auto-categorize emails, detect priority, and suggest labels
- **Action Item Extraction**: Automatically identify tasks and follow-ups
- **Meeting Scheduling**: AI suggests optimal meeting times
- **Data Analysis**: Ask questions about spreadsheet data
- **Form Builder**: AI generates form questions based on topic

## Setup

### Step 1: Google Cloud Console - Create Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click the project dropdown at the top and select **"New Project"**
3. Enter a project name (e.g., "Workspace PWA") and click **"Create"**
4. Wait for the project to be created, then select it

### Step 2: Enable Required APIs

Go to **"APIs & Services" > "Library"** and enable each of these APIs:

1. **Gmail API** - Search "Gmail API" and click **Enable**
2. **Google Calendar API** - Search "Google Calendar API" and click **Enable**
3. **Google Drive API** - Search "Google Drive API" and click **Enable**
4. **Google Sheets API** - Search "Google Sheets API" and click **Enable**
5. **Google Docs API** - Search "Google Docs API" and click **Enable**
6. **Google Forms API** - Search "Google Forms API" and click **Enable**

### Step 3: Configure OAuth Consent Screen

1. Go to **"APIs & Services" > "OAuth consent screen"**
2. Select **"External"** user type (unless you have Google Workspace, then choose Internal)
3. Click **"Create"**
4. Fill in the required fields:
   - **App name**: Your app name (e.g., "Workspace PWA")
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
5. Click **"Save and Continue"**

#### Add Scopes

1. Click **"Add or Remove Scopes"**
2. Add these scopes (you can search or paste the URLs):
   ```
   https://www.googleapis.com/auth/gmail.readonly
   https://www.googleapis.com/auth/gmail.send
   https://www.googleapis.com/auth/gmail.modify
   https://www.googleapis.com/auth/gmail.labels
   https://www.googleapis.com/auth/calendar
   https://www.googleapis.com/auth/calendar.events
   https://www.googleapis.com/auth/drive
   https://www.googleapis.com/auth/drive.file
   https://www.googleapis.com/auth/spreadsheets
   https://www.googleapis.com/auth/documents
   https://www.googleapis.com/auth/forms.body
   https://www.googleapis.com/auth/forms.responses.readonly
   ```
3. Click **"Update"** then **"Save and Continue"**

#### Add Test Users (External Only)

1. Click **"Add Users"**
2. Add the Google accounts that will test the app
3. Click **"Save and Continue"**

### Step 4: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services" > "Credentials"**
2. Click **"Create Credentials" > "OAuth client ID"**
3. Select **"Web application"**
4. Name it (e.g., "Workspace PWA Web Client")
5. Under **"Authorized redirect URIs"**, add:
   - `http://localhost:3000/api/auth/callback/google` (for development)
   - `https://your-domain.vercel.app/api/auth/callback/google` (for production)
6. Click **"Create"**
7. **Copy the Client ID and Client Secret** - you'll need these!

### Step 5: Environment Variables

Create a `.env.local` file in the project root:

```env
# Google OAuth Credentials (from Step 4)
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here

# NextAuth Configuration
NEXTAUTH_SECRET=your_random_secret_here
NEXTAUTH_URL=http://localhost:3000

# AI Gateway API Key for Llama 4 Maverick AI Assistant
AI_GATEWAY_API_KEY=your_groq_api_key_here
```

#### Generate NEXTAUTH_SECRET

Run this command to generate a secure secret:
```bash
openssl rand -base64 32
```

Or on Windows PowerShell:
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

#### Get AI Gateway API Key

1. Go to [Groq Console](https://console.groq.com)
2. Create an account if you don't have one
3. Generate an API key
4. Copy and paste it into your `.env.local`

### Step 6: Install Dependencies

```bash
npm install
```

### Step 7: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 8: Build for Production

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
   - `AI_GATEWAY_API_KEY`
4. Deploy!

**Important**: Add the production callback URL to your Google Cloud Console OAuth credentials:
`https://your-domain.vercel.app/api/auth/callback/google`

## Project Structure

```
gmail-pwa/
├── src/
│   ├── app/
│   │   ├── (mail)/              # Protected routes
│   │   │   ├── inbox/           # Inbox page
│   │   │   ├── compose/         # Compose page
│   │   │   ├── calendar/        # Calendar page
│   │   │   ├── drive/           # Drive page
│   │   │   ├── sheets/          # Sheets page
│   │   │   ├── docs/            # Docs page
│   │   │   ├── forms/           # Forms page
│   │   │   └── ...              # Other pages
│   │   ├── api/
│   │   │   ├── auth/            # NextAuth API
│   │   │   ├── gmail/           # Gmail API routes
│   │   │   ├── calendar/        # Calendar API routes
│   │   │   ├── drive/           # Drive API routes
│   │   │   ├── sheets/          # Sheets API routes
│   │   │   ├── docs/            # Docs API routes
│   │   │   ├── forms/           # Forms API routes
│   │   │   └── ai/              # AI API routes
│   │   └── page.tsx             # Landing page
│   ├── components/              # React components
│   ├── lib/                     # Utilities and API wrappers
│   └── types/                   # TypeScript types
├── public/
│   ├── manifest.json            # PWA manifest
│   └── icons/                   # PWA icons
└── next.config.ts               # Next.js configuration
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Authentication**: NextAuth.js with Google OAuth
- **APIs**: Gmail, Calendar, Drive, Sheets, Docs, Forms via googleapis
- **AI**: Llama 4 Maverick via Groq
- **Styling**: Tailwind CSS
- **PWA**: next-pwa
- **State Management**: SWR for data fetching

## Troubleshooting

### "Access blocked" Error
- Make sure you've added your Google account as a test user in the OAuth consent screen
- Verify all required scopes are added

### "Invalid redirect URI" Error
- Check that the redirect URI in your OAuth credentials matches exactly:
  - Development: `http://localhost:3000/api/auth/callback/google`
  - Production: `https://your-domain.vercel.app/api/auth/callback/google`

### APIs Not Working
- Verify all required APIs are enabled in Google Cloud Console
- Check that your OAuth credentials have the correct scopes

## License

MIT
