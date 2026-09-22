# 🧹 Quidditch Academy

A magical multiplayer Quidditch game built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## 🌟 Features

- **Magical Authentication**: Register and login with your magical name and house
- **House System**: Choose from Gryffindor, Hufflepuff, Ravenclaw, or Slytherin
- **Achievements System**: Unlock magical achievements as you progress
- **Solo Mode**: Control all 7 positions of your team against another solo player
- **Team Mode**: Join a team of 7 players, each controlling one position
- **Real-time Room Lobby**: Live updates with Supabase Realtime
- **Captain System**: Team captains confirm team readiness
- **Position Selection**: Secure position claiming with database constraints
- **Magical UI**: Premium fantasy-themed interface with animations

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Security**: Row Level Security (RLS) policies

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase project set up

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd quiditch
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your Supabase credentials in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

5. Run database migrations:
- Go to your Supabase dashboard
- Navigate to SQL Editor
- Run the migration files in order from `supabase/migrations/`:
  - Run every numbered `.sql` migration in ascending order, through
    `022_game_state_revisions.sql`.
  - In particular, match completion and the leaderboard require
    `013_leaderboard.sql` and `014_game_achievements.sql`. Migration 015
    refreshes Supabase's function schema cache after the new RPC is installed.

6. Start the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📁 Project Structure

```
quiditch/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── login/             # Login page
│   │   ├── register/          # Registration page
│   │   ├── home/              # Home dashboard
│   │   ├── play/              # Play mode selection
│   │   ├── achievements/      # Achievements page
│   │   └── room/              # Room system
│   │       ├── create/        # Create room
│   │       ├── join/          # Join room
│   │       └── [roomCode]/    # Room lobby
│   ├── components/
│   │   └── ui/                # Magical UI components
│   └── lib/
│       └── supabase/          # Supabase client configuration
├── supabase/
│   └── migrations/            # Database migrations
└── public/                    # Static assets
```

## 🎮 Gameplay Modes

### Solo Mode
- One player controls all 7 positions (Keeper, 3 Chasers, 2 Beaters, Seeker)
- Maximum 2 players per match
- Each player controls their complete team

### Team Mode
- 7 players per team (14 total)
- Each player controls one position:
  - 1 Keeper
  - 3 Chasers
  - 2 Beaters
  - 1 Seeker
- Team captain must confirm team readiness

## 🔐 Security Features

- Row Level Security (RLS) on all tables
- Secure position claiming with database constraints
- Captain-only operations protected server-side
- Unique magical names with normalization
- Session management with Supabase Auth

## 🎨 UI Components

- `MagicalBackground` - Animated magical background
- `MagicalCard` - Glassmorphism cards with glow effects
- `MagicalButton` - Gradient buttons with hover effects
- `MagicalInput` - Styled form inputs
- `MagicalDropdown` - Custom dropdown with icons
- `HouseBadge` - House emblems with colors
- `PlayerAvatar` - Player display with house
- `AchievementCard` - Achievement display with rarity
- `MagicalNavbar` - Navigation with user info

## 📊 Database Schema

### Tables
- `profiles` - User profiles with magical names and houses
- `achievements` - Achievement definitions
- `user_achievements` - User achievement unlocks
- `rooms` - Game rooms with codes and modes
- `teams` - Team information per room
- `team_members` - Team members with positions

### Key Features
- Unique room codes with format `QUID-XXXX`
- Position constraints (max per team)
- Captain assignment and confirmation
- Real-time subscriptions for live updates

## 🧪 Testing

Test scenarios to verify functionality:

1. **Registration**: Create account with magical name and house
2. **Login**: Authenticate with magical name
3. **Solo Room**: Create and join solo room
4. **Team Room**: Create team room and select positions
5. **Position Locking**: Test simultaneous position claims
6. **Captain System**: Verify captain controls and confirmation
7. **Realtime**: Test live updates in room lobby

## 🚧 Future Development

The actual Quidditch gameplay mechanics will be built in future phases:

- 3D/2D Quidditch pitch
- Player movement and controls
- Quaffle, Bludgers, and Golden Snitch
- Scoring system
- Match timer
- Team statistics
- Match results

## 📝 License

This project is for educational purposes.

## 🤝 Contributing

This is a personal project. Feel free to fork and modify for your own use.
