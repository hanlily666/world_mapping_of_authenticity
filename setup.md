# Quick Setup Guide

## 1. Get Your API Keys

### Mapbox
1. Go to [https://account.mapbox.com/access-tokens/](https://account.mapbox.com/access-tokens/)
2. Create a new access token or use the default public token
3. Copy the token (starts with `pk.`)

### Supabase
1. Go to [https://supabase.com](https://supabase.com) and create a new project
2. In your project dashboard, go to Settings > API
3. Copy the Project URL and anon/public key

## 2. Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.local.example .env.local
```

2. Edit `.env.local` and add your API keys:
```env
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_actual_mapbox_token
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_supabase_key
```

## 3. Set Up Database

1. In your Supabase project, go to the SQL Editor
2. Copy and paste the contents of `database-schema.sql`
3. Run the SQL to create the necessary tables and storage buckets

## 4. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 5. Test the Application

1. Click anywhere on the world map
2. Fill out the upload form with:
   - A voice recording (optional)
   - A food photo (optional)
   - Recipe text (optional)
   - Recipe audio (optional)
3. Submit the form
4. Check your Supabase database to see the submission

## Troubleshooting

- **Map not loading**: Check that your Mapbox token is correct and has the right permissions
- **Upload errors**: Verify that your Supabase storage buckets are created and have the right policies
- **Database errors**: Make sure you've run the database schema SQL script

## Next Steps

- Add user authentication
- Implement recipe transcription
- Add social features
- Deploy to Vercel or your preferred platform

