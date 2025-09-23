# World Mapping of Authenticity

An interactive web application that allows users to explore and share local cultural authenticity from around the world. Users can click on any location on the world map to upload voice recordings of local accents, photos of local food, and recipes.

## Features

- 🌍 Interactive world map powered by Mapbox
- 🎤 Voice recording uploads for local accents
- 📸 Image uploads for local food photos
- 📝 Recipe text and audio submissions
- 🗄️ Database storage with Supabase
- 📱 Responsive design with modern UI

## Tech Stack

- **Frontend**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS
- **Maps**: Mapbox GL JS
- **Database**: Supabase (PostgreSQL)
- **File Storage**: Supabase Storage

## Setup Instructions

### 1. Prerequisites

- Node.js 18.18.0 or higher
- npm or yarn
- Mapbox account and access token
- Supabase account and project

### 2. Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd world_mapping_of_authenticity
```

2. Install dependencies:
```bash
npm install
```

### 3. Environment Configuration

1. Copy the environment file:
```bash
cp .env.local.example .env.local
```

2. Update `.env.local` with your credentials:
```env
# Mapbox Configuration
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 4. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)

2. Create the following table in your Supabase database:

```sql
CREATE TABLE submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  location_name TEXT NOT NULL,
  voice_url TEXT,
  image_url TEXT,
  recipe_text TEXT,
  recipe_audio_url TEXT,
  user_name TEXT,
  user_email TEXT
);
```

3. Create storage buckets for file uploads:
   - `voice-recordings` (for voice files)
   - `images` (for image files)
   - `recipe-audio` (for recipe audio files)

4. Set up Row Level Security (RLS) policies as needed for your use case.

### 5. Mapbox Setup

1. Create a Mapbox account at [mapbox.com](https://mapbox.com)
2. Generate an access token
3. Add the token to your `.env.local` file

### 6. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Explore the Map**: The application loads with an interactive world map
2. **Click Anywhere**: Click on any location on the map to open the upload modal
3. **Upload Content**: 
   - Record or upload voice recordings of local accents
   - Upload photos of local food
   - Add recipe descriptions and audio recordings
   - Optionally provide your name and email
4. **Submit**: Your submission will be saved to the database and stored in Supabase

## Project Structure

```
src/
├── app/
│   ├── page.tsx          # Main page component
│   └── layout.tsx        # Root layout
├── components/
│   ├── WorldMap.tsx      # Interactive map component
│   └── UploadModal.tsx   # Upload form modal
└── lib/
    └── supabase.ts       # Supabase client configuration
```

## Future Enhancements

- Recipe transcription from audio
- User authentication and profiles
- Social features (likes, comments)
- Advanced filtering and search
- Mobile app development
- Real-time collaboration features

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.