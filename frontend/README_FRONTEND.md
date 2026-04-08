# DSA Battle Royale - Frontend (Phase 1)

A production-grade real-time competitive coding platform built with Next.js and JavaScript.

## Project Status

**Phase 1: COMPLETED** - Full frontend implementation with mock APIs and WebSocket events
**Phase 2: PENDING** - Backend integration (will be implemented later)

## Tech Stack

- **Framework:** Next.js 13 (JavaScript)
- **Styling:** Tailwind CSS
- **Code Editor:** Monaco Editor (VS Code engine)
- **Real-time:** Socket.io-client (mock mode)
- **HTTP Client:** Axios
- **UI Components:** shadcn/ui + Radix UI

## Features Implemented

### Authentication
- Login page with mock authentication
- Registration page with validation
- JWT token simulation
- Protected routes with middleware

### Core Game Modes
1. **1v1 Duel Mode**
   - Difficulty selection (Easy/Medium/Hard)
   - Real-time matchmaking with queue system
   - Live coding battle with HP system
   - Monaco editor integration
   - Test case validation
   - Match results and rating changes

2. **Battle Royale Contest Mode**
   - Contest creation with customizable settings
   - Join contests via room code
   - Lobby system with player management
   - Multi-problem contests
   - Live leaderboard updates
   - Real-time scoring

### Additional Pages
- **Dashboard:** User stats, rating history, recent matches
- **Leaderboard:** Global and weekly rankings
- **Analytics:** Performance metrics, problem-solving stats
- **Admin Panel:** Problem management (CRUD operations)

## Project Structure

```
project/
├── app/
│   ├── layout.jsx                 # Root layout with AuthProvider
│   ├── page.jsx                   # Landing page
│   ├── login/page.jsx            # Login page
│   ├── register/page.jsx         # Registration page
│   ├── dashboard/page.jsx        # Main dashboard
│   ├── duel/
│   │   ├── find/page.jsx         # Matchmaking
│   │   └── [matchId]/page.jsx   # Live duel arena
│   ├── contest/
│   │   ├── create/page.jsx       # Create contest
│   │   ├── join/page.jsx         # Join via room code
│   │   └── [contestId]/page.jsx # Contest lobby/live
│   ├── leaderboard/page.jsx      # Rankings
│   ├── analytics/page.jsx        # Performance stats
│   └── admin/
│       ├── login/page.jsx        # Admin login
│       └── problems/page.jsx     # Problem management
├── components/
│   ├── Navbar.jsx                # Navigation bar
│   └── ui/                       # shadcn/ui components
├── services/
│   ├── api.js                    # Mock REST API
│   └── socket.js                 # Mock WebSocket service
├── hooks/
│   └── useAuth.js                # Authentication hook
└── middleware.js                 # Route protection
```

## Mock Services

### API Service (`services/api.js`)
Provides mock implementations for:
- `authAPI`: Login, register, getCurrentUser
- `matchAPI`: findMatch, cancelMatch, getMatch
- `contestAPI`: create, join, get, start
- `submissionAPI`: submit code
- `leaderboardAPI`: getGlobal, getWeekly
- `analyticsAPI`: getUserStats
- `adminAPI`: Problem CRUD operations

### WebSocket Service (`services/socket.js`)
Simulates real-time events:
- `match_found`: When opponent is found
- `hp_update`: Player health changes
- `submission_result`: Code execution results
- `match_end`: Battle conclusion
- `contest_player_joined`: New player joins
- `contest_started`: Contest begins
- `leaderboard_update`: Score updates

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

## Mock Data & Demo Accounts

### Regular User (Auto-login in mock mode)
- Email: Any email
- Password: Any password
- User: CodeNinja (Rating: 2150)

### Admin Access
- Email: Any email
- Password: `admin123`

## Pages & Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page with features |
| `/login` | User authentication |
| `/register` | User registration |
| `/dashboard` | Main user dashboard |
| `/duel/find` | Find 1v1 match |
| `/duel/[matchId]` | Live duel arena |
| `/contest/create` | Create new contest |
| `/contest/join` | Join via room code |
| `/contest/[contestId]` | Contest lobby/live |
| `/leaderboard` | Global rankings |
| `/analytics` | User performance stats |
| `/admin/login` | Admin authentication |
| `/admin/problems` | Problem management |

## Key Features

### Live Duel Arena
- Split-screen layout
- Problem description with test cases
- Monaco code editor with syntax highlighting
- Real-time HP tracking for both players
- Timer countdown
- Submission feedback
- Victory/defeat animations

### Contest System
- Room code generation (6 characters)
- Player lobby with live updates
- Multiple problem rotation
- Real-time leaderboard
- Host controls (start contest)

### Analytics Dashboard
- Rating history graph
- Problems solved by difficulty
- Win/loss statistics
- Recent match history
- Performance metrics

### Admin Panel
- Full CRUD for problems
- Test case management
- Difficulty categorization
- Bulk problem handling

## Mock Data Flow

1. **User Action** → Component calls mock API/Socket
2. **Mock Delay** → Simulates network latency (500-1500ms)
3. **Mock Response** → Returns realistic data
4. **UI Update** → Component renders with new data

## Ready for Backend Integration

The frontend is structured to easily integrate with a real backend:

1. Update `services/api.js` - Replace mock functions with real API calls
2. Update `services/socket.js` - Set `mockMode = false` and configure real WebSocket URL
3. Update environment variables in `.env`

### Expected Backend Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
POST   /api/match/find
POST   /api/match/cancel
GET    /api/match/:id
POST   /api/contest/create
POST   /api/contest/join
GET    /api/contest/:id
POST   /api/contest/:id/start
POST   /api/submission
GET    /api/leaderboard
GET    /api/analytics/stats
GET    /api/admin/problems
POST   /api/admin/problems
PUT    /api/admin/problems/:id
DELETE /api/admin/problems/:id
```

### Expected WebSocket Events

```
Client → Server:
- join_match
- submit_code
- join_contest
- start_contest

Server → Client:
- match_found
- hp_update
- submission_result
- match_end
- contest_player_joined
- contest_started
- leaderboard_update
```

## Design System

### Colors
- Primary: Orange-Red gradient (`from-orange-500 to-red-600`)
- Secondary: Blue-Cyan gradient (`from-blue-500 to-cyan-600`)
- Success: Green (`from-green-500 to-emerald-500`)
- Error: Red (`from-red-500 to-pink-500`)
- Background: Dark slate (`slate-900`, `slate-800`)

### Typography
- Font: Inter (Google Fonts)
- Headings: Bold, large sizes
- Body: Regular, readable line-height

### Components
- Rounded corners (xl, 2xl)
- Subtle shadows with color-matched glows
- Smooth transitions and hover effects
- Professional, game-like aesthetic

## Known Limitations (Mock Mode)

- WebSocket events are simulated with setTimeout
- No persistent data storage
- No real code execution
- Matchmaking is instant (simulated delay)
- Test results are randomly generated
- All users share the same mock data

## Next Steps (Phase 2)

When implementing the backend:

1. Set up Express.js server
2. Configure MySQL database
3. Implement Redis for matchmaking queue
4. Set up Socket.io server
5. Build code execution judge service
6. Implement JWT authentication
7. Create database migrations
8. Deploy and test integration

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Performance

- Build time: ~30 seconds
- First load JS: ~79.4 KB (shared)
- Individual pages: 2-7 KB
- Static generation for optimal performance

## Contributing

This is a frontend-first implementation. The code is structured for easy maintenance and future backend integration.

---

Built with Next.js, Tailwind CSS, and Monaco Editor
