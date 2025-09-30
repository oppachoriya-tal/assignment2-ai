import { prisma } from '../config/database';
import { logger } from '../utils/logger';

/**
 * Add random ratings to all books that don't have reviews
 */
async function addRandomRatings() {
  try {
    logger.info('Starting to add random ratings to books...');

    // Get all books
    const books = await prisma.book.findMany({
      include: {
        reviews: true
      }
    });

    logger.info(`Found ${books.length} books`);

    // Get all users
    const users = await prisma.user.findMany({
      select: { id: true }
    });

    if (users.length === 0) {
      logger.warn('No users found. Cannot add ratings.');
      return;
    }

    logger.info(`Found ${users.length} users`);

    let ratingsAdded = 0;

    for (const book of books) {
      // Skip books that already have reviews
      if (book.reviews.length > 0) {
        continue;
      }

      // Add 1-5 random reviews per book
      const numReviews = Math.floor(Math.random() * 5) + 1;
      
      for (let i = 0; i < numReviews; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const randomRating = Math.floor(Math.random() * 5) + 1; // 1-5 stars
        const reviewTexts = [
          "Great book! Really enjoyed reading it.",
          "Excellent story with compelling characters.",
          "A wonderful read that I highly recommend.",
          "Fantastic book with great writing.",
          "Amazing story that kept me engaged throughout.",
          "Really good book with interesting plot.",
          "Enjoyed this book very much.",
          "Great characters and storyline.",
          "Well-written and entertaining.",
          "Highly recommend this book to others."
        ];
        const randomReviewText = reviewTexts[Math.floor(Math.random() * reviewTexts.length)];

        try {
          await prisma.review.create({
            data: {
              userId: randomUser.id,
              bookId: book.id,
              rating: randomRating,
              reviewText: randomReviewText,
              isHelpfulCount: Math.floor(Math.random() * 10), // 0-9 helpful votes
              isFlagged: false,
              isModerated: false
            }
          });
          ratingsAdded++;
        } catch (error) {
          // Skip if review already exists for this user/book combination
          if (error instanceof Error && error.message.includes('Unique constraint')) {
            continue;
          }
          logger.error(`Error adding review for book ${book.id}:`, error);
        }
      }
    }

    logger.info(`Successfully added ${ratingsAdded} random ratings`);
  } catch (error) {
    logger.error('Error adding random ratings:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  addRandomRatings()
    .then(() => {
      logger.info('Random ratings addition completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Failed to add random ratings:', error);
      process.exit(1);
    });
}

export { addRandomRatings };
