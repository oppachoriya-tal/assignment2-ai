-- Initialize BookReview Database
-- This file is executed when the PostgreSQL container starts for the first time

-- Create the database if it doesn't exist (already created by POSTGRES_DB)
-- The database 'bookreview_db' is already created by the environment variable

-- Grant privileges to the user
GRANT ALL PRIVILEGES ON DATABASE bookreview_db TO bookreview_user;

-- Connect to the bookreview_db database
\c bookreview_db;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO bookreview_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO bookreview_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO bookreview_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO bookreview_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO bookreview_user;
