# NextAuth Setup Guide

This project now has a complete authentication system with signin and user details display.

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_here_generate_with_openssl_rand_base64_32

# Google OAuth Provider
GOOGLE_ID=your_google_oauth_client_id
GOOGLE_SECRET=your_google_oauth_client_secret

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/your_database_name
```

### Generating NEXTAUTH_SECRET

Run this command to generate a secure secret:
```bash
openssl rand -base64 32
```

### Setting up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (for development)
   - `https://yourdomain.com/api/auth/callback/google` (for production)
6. Copy the Client ID and Client Secret

## Project Structure

- `/app/signin` - Sign in page
- `/app/dashboard` - Protected user details page
- `/app/components/SignInButton` - Google sign-in button
- `/app/components/SignOutButton` - Sign out button
- `/app/components/AuthHeader` - Navigation header with auth status
- `/app/page.tsx` - Home page (shows different content based on auth status)

## Features

✅ Google OAuth authentication
✅ User session management
✅ Protected dashboard page (requires login)
✅ User details display (name, email, avatar, verification status)
✅ Session expiration info
✅ Navigation header with auth status
✅ Automatic redirects based on authentication

## Usage

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (see above)

3. Run database migrations:
```bash
npm exec prisma migrate dev
```

4. Start the development server:
```bash
npm run dev
```

5. Visit `http://localhost:3000` and click "Sign In"

## Pages

- `/` - Home page (shows sign in button if not authenticated)
- `/signin` - Sign in page with Google option
- `/dashboard` - Protected dashboard showing user details (requires authentication)

## Key Flows

### Sign In Flow
1. User visits `/signin`
2. Clicks "Sign in with Google"
3. Google OAuth redirect
4. User authenticates with Google
5. Redirects to `/dashboard`

### Sign Out Flow
1. User clicks "Sign Out" button
2. Session is cleared
3. Redirects to home page (`/`)

### Protected Routes
- `/dashboard` is protected - redirects to `/signin` if not authenticated
