# EventZed — University Event Manager
**Zambia University of Technology | Full-Stack Web Development**

Built with React.js · Express.js · PostgreSQL

---

## Project Structure

```
eventzed/
├── database/
│   └── schema.sql          # PostgreSQL schema & seed data
├── server/
│   ├── index.js            # Express app entry point
│   ├── db/pool.js          # PostgreSQL connection pool
│   ├── middleware/auth.js  # JWT authentication guard
│   └── routes/
│       ├── auth.js         # POST /login, /register, GET /me
│       ├── events.js       # Full CRUD for events
│       ├── attendees.js    # Event registrations
│       └── files.js        # File upload & management
├── client/src/
│   ├── context/
│   │   └── AuthContext.jsx # Global auth state
│   ├── services/
│   │   └── api.js          # Axios API service layer
│   └── pages/              # Dashboard, Events, Attendees, Files
├── uploads/                # Uploaded files (auto-created)
└── package.json
```

---

## Setup Instructions

### 1. Database
```bash
psql -U postgres
\i database/schema.sql
```

### 2. Environment Variables
Create a `.env` file in the root:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=eventzed
DB_USER=postgres
DB_PASSWORD=yourpassword
JWT_SECRET=your_strong_secret_key
PORT=5000
CLIENT_URL=http://localhost:3000
```

### 3. Backend
```bash
npm install
npm run dev        # runs with nodemon
```

### 4. Frontend
```bash
cd client
npm install
npm start          # http://localhost:3000
```

---

## Features

| Feature                  | Status |
|--------------------------|--------|
| User authentication (JWT)| ✓      |
| Login & registration     | ✓      |
| Create / Read / Update / Delete events | ✓ |
| Event registration (attendees) | ✓ |
| File upload (multer)     | ✓      |
| Role-based access (admin/student) | ✓ |
| Search & filter events   | ✓      |
| PostgreSQL integration   | ✓      |
| Responsive React frontend| ✓      |

---

## API Endpoints

| Method | Endpoint                | Auth    | Description            |
|--------|-------------------------|---------|------------------------|
| POST   | /api/auth/register      | Public  | Register new user      |
| POST   | /api/auth/login         | Public  | Login, returns JWT     |
| GET    | /api/auth/me            | Token   | Get current user       |
| GET    | /api/events             | Token   | List all events        |
| GET    | /api/events/:id         | Token   | Get single event       |
| POST   | /api/events             | Admin   | Create event           |
| PUT    | /api/events/:id         | Admin   | Update event           |
| DELETE | /api/events/:id         | Admin   | Delete event           |
| GET    | /api/attendees          | Token   | List registrations     |
| POST   | /api/attendees          | Token   | Register for event     |
| DELETE | /api/attendees/:id      | Admin   | Remove registration    |
| GET    | /api/files              | Token   | List uploaded files    |
| POST   | /api/files/upload       | Admin   | Upload file to event   |
| DELETE | /api/files/:id          | Admin   | Delete file            |

---

## Demo Login
- **Admin:** admin@zut.ac.zm / admin123
- **Student:** student@zut.ac.zm / student123
