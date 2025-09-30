-- Create BookReview Database Schema
-- This script creates all the necessary tables for the BookReview platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create UserRole enum
DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('USER', 'MODERATOR', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "avatar_url" VARCHAR(500),
    "bio" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "is_verified" BOOLEAN DEFAULT false,
    "role" "UserRole" DEFAULT 'USER',
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "last_login" TIMESTAMP
);

-- Create genres table
CREATE TABLE IF NOT EXISTS "genres" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(100) UNIQUE NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create books table
CREATE TABLE IF NOT EXISTS "books" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "isbn" VARCHAR(20) UNIQUE,
    "title" VARCHAR(500) NOT NULL,
    "author" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "cover_image_url" VARCHAR(500),
    "published_year" INTEGER,
    "page_count" INTEGER,
    "language" VARCHAR(10) DEFAULT 'en',
    "publisher" VARCHAR(200),
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create book_genres junction table
CREATE TABLE IF NOT EXISTS "book_genres" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "book_id" UUID NOT NULL REFERENCES "books"("id") ON DELETE CASCADE,
    "genre_id" UUID NOT NULL REFERENCES "genres"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("book_id", "genre_id")
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS "reviews" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "book_id" UUID NOT NULL REFERENCES "books"("id") ON DELETE CASCADE,
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "rating" INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    "review_text" TEXT,
    "is_helpful" INTEGER DEFAULT 0,
    "is_flagged" BOOLEAN DEFAULT false,
    "is_moderated" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("book_id", "user_id")
);

-- Create review_helpful table
CREATE TABLE IF NOT EXISTS "review_helpful" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "review_id" UUID NOT NULL REFERENCES "reviews"("id") ON DELETE CASCADE,
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "is_helpful" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("review_id", "user_id")
);

-- Create user_favorites table
CREATE TABLE IF NOT EXISTS "user_favorites" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "book_id" UUID NOT NULL REFERENCES "books"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("user_id", "book_id")
);

-- Create user_follows table
CREATE TABLE IF NOT EXISTS "user_follows" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "follower_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "following_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("follower_id", "following_id")
);

-- Create comments table
CREATE TABLE IF NOT EXISTS "comments" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "review_id" UUID NOT NULL REFERENCES "reviews"("id") ON DELETE CASCADE,
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "content" TEXT NOT NULL,
    "is_flagged" BOOLEAN DEFAULT false,
    "is_moderated" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS "notifications" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create refresh_tokens table
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "token" VARCHAR(500) UNIQUE NOT NULL,
    "expires_at" TIMESTAMP NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create password_reset_tokens table
CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "token" VARCHAR(500) UNIQUE NOT NULL,
    "expires_at" TIMESTAMP NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_reviews_book_id" ON "reviews"("book_id");
CREATE INDEX IF NOT EXISTS "idx_reviews_user_id" ON "reviews"("user_id");
CREATE INDEX IF NOT EXISTS "idx_reviews_rating" ON "reviews"("rating");
CREATE INDEX IF NOT EXISTS "idx_books_author" ON "books"("author");
CREATE INDEX IF NOT EXISTS "idx_books_title" ON "books"("title");
CREATE INDEX IF NOT EXISTS "idx_user_favorites_user_id" ON "user_favorites"("user_id");
CREATE INDEX IF NOT EXISTS "idx_user_favorites_book_id" ON "user_favorites"("book_id");
CREATE INDEX IF NOT EXISTS "idx_comments_review_id" ON "comments"("review_id");
CREATE INDEX IF NOT EXISTS "idx_notifications_user_id" ON "notifications"("user_id");

-- Grant all privileges to bookreview_user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO bookreview_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO bookreview_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO bookreview_user;

