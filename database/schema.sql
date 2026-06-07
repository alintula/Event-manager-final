-- EventZed — Zambia University of Technology
-- PostgreSQL Database Schema

CREATE DATABASE eventzed;
\c eventzed;

-- Users (students and admins)
CREATE TABLE users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  email       VARCHAR(120) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,      -- bcrypt hash
  role        VARCHAR(20) DEFAULT 'student' CHECK (role IN ('admin','student')),
  student_id  VARCHAR(30),
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Events
CREATE TABLE events (
  id             SERIAL PRIMARY KEY,
  title          VARCHAR(200) NOT NULL,
  category       VARCHAR(30) NOT NULL CHECK (category IN ('academic','social','sports','workshop')),
  description    TEXT,
  date           DATE NOT NULL,
  time           TIME NOT NULL,
  venue          VARCHAR(150) NOT NULL,
  organizer      VARCHAR(120),
  max_attendees  INTEGER DEFAULT 100,
  status         VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming','ongoing','completed')),
  created_by     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at     TIMESTAMP DEFAULT NOW(),
  updated_at     TIMESTAMP DEFAULT NOW()
);

-- Attendee registrations
CREATE TABLE attendees (
  id             SERIAL PRIMARY KEY,
  event_id       INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id        INTEGER REFERENCES users(id) ON DELETE SET NULL,
  name           VARCHAR(120) NOT NULL,
  student_id     VARCHAR(30) NOT NULL,
  email          VARCHAR(120) NOT NULL,
  registered_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE (event_id, student_id)           -- prevent duplicate registrations
);

-- Uploaded files (attached to events)
CREATE TABLE event_files (
  id           SERIAL PRIMARY KEY,
  event_id     INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  file_name    VARCHAR(255) NOT NULL,
  file_path    VARCHAR(500) NOT NULL,     -- path on server disk / S3 key
  file_size    INTEGER,                   -- bytes
  mime_type    VARCHAR(100),
  uploaded_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at  TIMESTAMP DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_date   ON events(date);
CREATE INDEX idx_attendees_event ON attendees(event_id);
CREATE INDEX idx_files_event   ON event_files(event_id);

-- Seed admin user  (password: admin123)
INSERT INTO users (name, email, password, role)
VALUES ('Admin User', 'admin@zut.ac.zm',
        '$2b$10$PLACEHOLDER_BCRYPT_HASH', 'admin');

-- Seed demo events
INSERT INTO events (title, category, description, date, time, venue, organizer, max_attendees, status, created_by)
VALUES
  ('Engineering Open Day 2026',  'academic', 'Annual open day for the Engineering faculty.', '2026-06-15','08:00','Main Hall',         'Dr. Banda',   200, 'upcoming',  1),
  ('ZUT Cultural Night',         'social',   'Celebrating cultural diversity at ZUT.',        '2026-06-20','18:00','Multipurpose Hall','Student Union',300, 'upcoming',  1),
  ('React.js Workshop',          'workshop', 'Hands-on intro to React.js.',                  '2026-06-10','09:00','ICT Lab 3',        'Mr. Mwale',    30, 'ongoing',   1),
  ('Inter-Faculty Football Final','sports',  'Final match of the inter-faculty league.',      '2026-05-30','14:00','Sports Ground',    'Sports Dept', 500, 'completed', 1);
