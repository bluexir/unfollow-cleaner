# Unfollow Cleaner for Farcaster

A web application that helps Farcaster users identify and unfollow accounts that don't follow them back.

## Features

- 🔐 **Secure Authentication**: Sign in with Farcaster using Neynar
- 🔍 **Find Non-Followers**: Quickly identify users who don't follow you back
- 🧹 **Bulk Actions**: Unfollow multiple users at once or individually
- 💜 **Farcaster-Themed UI**: Beautiful, responsive design matching Farcaster's aesthetic
- ☕ **Tip Support**: Optional tip feature to support development via Base network

## Prerequisites

- Node.js 18+ installed
- A Neynar account with API access ($9 plan or higher)
- GitHub account for deployment
- Vercel account (free tier works)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/bluexir/unfollow-cleaner.git
cd unfollow-cleaner
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEYNAR_API_KEY=your_neynar_api_key_here
NEXT_PUBLIC_NEYNAR_CLIENT_ID=your_neynar_client_id_here
```

Get your Neynar credentials:
1. Go to https://neynar.com
2. Sign up/Sign in
3. Create a new app
4. Copy your API key and Client ID

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment to Vercel

### Option 1: Deploy via Vercel Dashboard

1. Push your code to GitHub
2. Go to https://vercel.com
3. Click "New Project"
4. Import your GitHub repository
5. Add environment variables:
   - `NEYNAR_API_KEY`
   - `NEXT_PUBLIC_NEYNAR_CLIENT_ID`
6. Click "Deploy"

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Add environment variables
vercel env add NEYNAR_API_KEY
vercel env add NEXT_PUBLIC_NEYNAR_CLIENT_ID

# Deploy to production
vercel --prod
```

## Project Structure

```
unfollow-cleaner/
├── app/
│   ├── api/
│   │   ├── check-follow/    # Check if user follows @bluexir
│   │   ├── get-non-followers/ # Fetch non-followers list
│   │   └── unfollow/        # Unfollow users
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main page
├── components/
│   ├── AuthButton.tsx       # Farcaster sign-in button
│   ├── FollowGate.tsx       # Follow requirement gate
│   ├── NonFollowersList.tsx # Main list component
│   └── TipSection.tsx       # Developer tip section
├── lib/
│   ├── neynar.ts           # Neynar client configuration
│   └── types.ts            # TypeScript types
└── package.json
```

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **API**: Neynar SDK
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## API Rate Limits

The Neynar $9 plan has rate limits. The app handles this by:
- Limiting bulk unfollows to 50 users at once
- Adding delays between API calls
- Showing clear error messages

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for your own purposes.

## Support

If you find this tool helpful, consider:
- Following [@bluexir](https://warpcast.com/bluexir) on Farcaster
- Sending a tip via the app
- Sharing with your Farcaster network

## Troubleshooting

### Build Errors

If you encounter build errors:
1. Delete `node_modules` and `.next` folders
2. Run `npm install` again
3. Make sure environment variables are set correctly

### Authentication Issues

If sign-in doesn't work:
1. Verify your Neynar Client ID is correct
2. Check that it's prefixed with `NEXT_PUBLIC_`
3. Clear browser cache and try again

### API Errors

If API calls fail:
1. Check your Neynar API key is valid
2. Ensure you're not hitting rate limits
3. Check Neynar's status page

## Contact

- Farcaster: [@bluexir](https://warpcast.com/bluexir)
- GitHub: [bluexir](https://github.com/bluexir)
