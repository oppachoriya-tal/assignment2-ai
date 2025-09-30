import { PrismaClient, UserRole } from '@prisma/client';
import { sampleBooks } from './seed-books';
import { comprehensiveBooks } from './seed-comprehensive-books';
import bcrypt from 'bcryptjs';
import { config } from '../config/config';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create genres
  const genres = await Promise.all([
    prisma.genre.upsert({
      where: { name: 'Fiction' },
      update: {},
      create: {
        name: 'Fiction',
        description: 'Literary works of imagination',
      },
    }),
    prisma.genre.upsert({
      where: { name: 'Non-Fiction' },
      update: {},
      create: {
        name: 'Non-Fiction',
        description: 'Books based on facts and real events',
      },
    }),
    prisma.genre.upsert({
      where: { name: 'Science Fiction' },
      update: {},
      create: {
        name: 'Science Fiction',
        description: 'Fiction dealing with futuristic concepts',
      },
    }),
    prisma.genre.upsert({
      where: { name: 'Fantasy' },
      update: {},
      create: {
        name: 'Fantasy',
        description: 'Fiction with magical elements',
      },
    }),
    prisma.genre.upsert({
      where: { name: 'Mystery' },
      update: {},
      create: {
        name: 'Mystery',
        description: 'Books involving puzzles and crime',
      },
    }),
    prisma.genre.upsert({
      where: { name: 'Romance' },
      update: {},
      create: {
        name: 'Romance',
        description: 'Books focused on romantic relationships',
      },
    }),
    prisma.genre.upsert({
      where: { name: 'Thriller' },
      update: {},
      create: {
        name: 'Thriller',
        description: 'Books designed to keep readers in suspense',
      },
    }),
    prisma.genre.upsert({
      where: { name: 'Biography' },
      update: {},
      create: {
        name: 'Biography',
        description: 'Accounts of people\'s lives',
      },
    }),
    prisma.genre.upsert({
      where: { name: 'History' },
      update: {},
      create: {
        name: 'History',
        description: 'Books about past events',
      },
    }),
    prisma.genre.upsert({
      where: { name: 'Self-Help' },
      update: {},
      create: {
        name: 'Self-Help',
        description: 'Books aimed at personal improvement',
      },
    }),
  ]);

  console.log(`✅ Created ${genres.length} genres`);

  // Merge books from seed-books and comprehensive-books, dedupe by ISBN or title+author
  const mergedBooksRaw = [] as any[];
  const isbnSet = new Set<string>();
  const titleAuthorSet = new Set<string>();

  // Normalize helper
  const normalize = (s?: string) => (s || '').trim().toLowerCase();

  // Push initial curated books from existing seed
  const curatedBooks = [
    prisma.book.upsert({
      where: { isbn: '9780743273565' },
      update: {},
      create: {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        description: 'A classic American novel set in the Jazz Age, exploring themes of wealth, love, and the American Dream.',
        publishedYear: 1925,
        pageCount: 180,
        language: 'en',
        publisher: 'Scribner',
        isbn: '9780743273565',
        genres: {
          create: [
            { genreId: genres[0].id }, // Fiction
          ],
        },
      },
    }),
    prisma.book.upsert({
      where: { isbn: '9780451524935' },
      update: {},
      create: {
        title: '1984',
        author: 'George Orwell',
        description: 'A dystopian social science fiction novel about totalitarian control and surveillance.',
        publishedYear: 1949,
        pageCount: 328,
        language: 'en',
        publisher: 'Secker & Warburg',
        isbn: '9780451524935',
        genres: {
          create: [
            { genreId: genres[2].id }, // Science Fiction
            { genreId: genres[0].id }, // Fiction
          ],
        },
      },
    }),
    prisma.book.upsert({
      where: { isbn: '9780061120084' },
      update: {},
      create: {
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        description: 'A novel about racial injustice and childhood innocence in the American South.',
        publishedYear: 1960,
        pageCount: 281,
        language: 'en',
        publisher: 'J. B. Lippincott & Co.',
        isbn: '9780061120084',
        genres: {
          create: [
            { genreId: genres[0].id }, // Fiction
          ],
        },
      },
    }),
    prisma.book.upsert({
      where: { isbn: '9780544003415' },
      update: {},
      create: {
        title: 'The Lord of the Rings',
        author: 'J.R.R. Tolkien',
        description: 'An epic high-fantasy novel about the quest to destroy the One Ring.',
        publishedYear: 1954,
        pageCount: 1216,
        language: 'en',
        publisher: 'Allen & Unwin',
        isbn: '9780544003415',
        genres: {
          create: [
            { genreId: genres[3].id }, // Fantasy
            { genreId: genres[0].id }, // Fiction
          ],
        },
      },
    }),
    prisma.book.upsert({
      where: { isbn: '9780141439518' },
      update: {},
      create: {
        title: 'Pride and Prejudice',
        author: 'Jane Austen',
        description: 'A romantic novel about Elizabeth Bennet and Mr. Darcy.',
        publishedYear: 1813,
        pageCount: 432,
        language: 'en',
        publisher: 'T. Egerton, Whitehall',
        isbn: '9780141439518',
        genres: {
          create: [
            { genreId: genres[5].id }, // Romance
            { genreId: genres[0].id }, // Fiction
          ],
        },
      },
    }),
    prisma.book.upsert({
      where: { isbn: '9780316769174' },
      update: {},
      create: {
        title: 'The Catcher in the Rye',
        author: 'J.D. Salinger',
        description: 'A coming-of-age story about teenager Holden Caulfield.',
        publishedYear: 1951,
        pageCount: 277,
        language: 'en',
        publisher: 'Little, Brown and Company',
        isbn: '9780316769174',
        genres: {
          create: [
            { genreId: genres[0].id }, // Fiction
          ],
        },
      },
    }),
    prisma.book.upsert({
      where: { isbn: '9780547928227' },
      update: {},
      create: {
        title: 'The Hobbit',
        author: 'J.R.R. Tolkien',
        description: 'A fantasy novel about Bilbo Baggins and his adventure.',
        publishedYear: 1937,
        pageCount: 310,
        language: 'en',
        publisher: 'Allen & Unwin',
        isbn: '9780547928227',
        genres: {
          create: [
            { genreId: genres[3].id }, // Fantasy
            { genreId: genres[0].id }, // Fiction
          ],
        },
      },
    }),
    prisma.book.upsert({
      where: { isbn: '9780307474278' },
      update: {},
      create: {
        title: 'The Da Vinci Code',
        author: 'Dan Brown',
        description: 'A mystery thriller novel about symbologist Robert Langdon.',
        publishedYear: 2003,
        pageCount: 689,
        language: 'en',
        publisher: 'Doubleday',
        isbn: '9780307474278',
        genres: {
          create: [
            { genreId: genres[4].id }, // Mystery
            { genreId: genres[6].id }, // Thriller
          ],
        },
      },
    }),
  ];

  // Build candidate list from additional sources
  for (const b of sampleBooks) {
    mergedBooksRaw.push({
      title: b.title,
      author: b.author,
      description: b.description,
      publishedYear: b.publishedYear,
      pageCount: undefined,
      language: 'en',
      publisher: undefined,
      isbn: b.isbn,
      coverImageUrl: b.coverImageUrl,
      genres: b.genres,
    });
  }

  for (const b of comprehensiveBooks) {
    mergedBooksRaw.push({
      title: b.title,
      author: b.author,
      description: b.description,
      publishedYear: b.year,
      pageCount: undefined,
      language: 'en',
      publisher: undefined,
      isbn: undefined,
      coverImageUrl: undefined,
      genres: [b.genre],
    });
  }

  // Dedupe
  const dedupedBooks = [] as any[];
  for (const b of mergedBooksRaw) {
    const keyIsbn = b.isbn ? normalize(b.isbn) : '';
    const keyTitleAuthor = `${normalize(b.title)}::${normalize(b.author)}`;

    if (keyIsbn) {
      if (isbnSet.has(keyIsbn)) continue;
      isbnSet.add(keyIsbn);
    } else if (titleAuthorSet.has(keyTitleAuthor)) {
      continue;
    } else {
      titleAuthorSet.add(keyTitleAuthor);
    }
    dedupedBooks.push(b);
  }

  // Ensure required base genres exist map by name
  const genreByName = new Map<string, string>([
    ['Fiction', genres[0].id],
    ['Non-Fiction', genres[1].id],
    ['Science Fiction', genres[2].id],
    ['Fantasy', genres[3].id],
    ['Mystery', genres[4].id],
    ['Romance', genres[5].id],
    ['Thriller', genres[6].id],
    ['Biography', genres[7].id],
    ['History', genres[8].id],
    ['Self-Help', genres[9].id],
  ]);

  // Upsert any additional genres from sources
  for (const b of dedupedBooks) {
    for (const g of (b.genres || [])) {
      if (!genreByName.has(g)) {
        const created = await prisma.genre.upsert({
          where: { name: g },
          update: {},
          create: { name: g },
        });
        genreByName.set(g, created.id);
      }
    }
  }

  // Create curated base books first
  const baseBooks = await Promise.all(curatedBooks);

  // Create remaining books from deduped list if not already among curated ones
  const extraBooks = [] as any[];
  for (const b of dedupedBooks) {
    // Skip ones that are already covered by curated upserts (by ISBN or title)
    const exists = await prisma.book.findFirst({
      where: {
        OR: [
          b.isbn ? { isbn: b.isbn } : undefined,
          { AND: [{ title: b.title }, { author: b.author }] },
        ].filter(Boolean) as any[],
      },
    });
    if (exists) continue;

    const created = await prisma.book.create({
      data: {
        title: b.title,
        author: b.author,
        description: b.description,
        publishedYear: b.publishedYear,
        pageCount: b.pageCount,
        language: b.language || 'en',
        publisher: b.publisher,
        isbn: b.isbn,
        coverImageUrl: b.coverImageUrl,
      },
    });
    extraBooks.push(created);

    // Attach genres
    for (const g of (b.genres || [])) {
      const genreId = genreByName.get(g);
      if (!genreId) continue;
      await prisma.bookGenre.create({
        data: {
          bookId: created.id,
          genreId,
        },
      });
    }
  }

  const books = [...baseBooks, ...extraBooks];

  console.log(`✅ Created ${books.length} books`);

  // Create admin user
  const adminPasswordHash = await bcrypt.hash('Admin123!', config.bcryptRounds);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@bookreview.com' },
    update: {},
    create: {
      email: 'admin@bookreview.com',
      passwordHash: adminPasswordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      isVerified: true,
      bio: 'Platform administrator',
    },
  });

  // Create moderator user
  const moderatorPasswordHash = await bcrypt.hash('Moderator123!', config.bcryptRounds);
  const moderator = await prisma.user.upsert({
    where: { email: 'moderator@bookreview.com' },
    update: {},
    create: {
      email: 'moderator@bookreview.com',
      passwordHash: moderatorPasswordHash,
      firstName: 'Moderator',
      lastName: 'User',
      role: UserRole.MODERATOR,
      isVerified: true,
      bio: 'Content moderator',
    },
  });

  // Create sample users
  const userPasswordHash = await bcrypt.hash('User123!', config.bcryptRounds);
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'john.doe@example.com' },
      update: {},
      create: {
        email: 'john.doe@example.com',
        passwordHash: userPasswordHash,
        firstName: 'John',
        lastName: 'Doe',
        isVerified: true,
        bio: 'Avid reader and book reviewer',
      },
    }),
    prisma.user.upsert({
      where: { email: 'jane.smith@example.com' },
      update: {},
      create: {
        email: 'jane.smith@example.com',
        passwordHash: userPasswordHash,
        firstName: 'Jane',
        lastName: 'Smith',
        isVerified: true,
        bio: 'Literature enthusiast',
      },
    }),
    prisma.user.upsert({
      where: { email: 'mike.johnson@example.com' },
      update: {},
      create: {
        email: 'mike.johnson@example.com',
        passwordHash: userPasswordHash,
        firstName: 'Mike',
        lastName: 'Johnson',
        isVerified: true,
        bio: 'Science fiction lover',
      },
    }),
  ]);

  console.log(`✅ Created ${users.length + 2} users (including admin and moderator)`);

  // Create sample reviews
  const reviews = await Promise.all([
    prisma.review.upsert({
      where: {
        bookId_userId: {
          bookId: books[0].id, // The Great Gatsby
          userId: users[0].id, // John Doe
        },
      },
      update: {},
      create: {
        bookId: books[0].id,
        userId: users[0].id,
        rating: 5,
        reviewText: 'An absolute masterpiece! Fitzgerald\'s prose is beautiful and the story is timeless. The themes of wealth, love, and the American Dream are explored with such depth. This is a book that everyone should read at least once in their lifetime.',
      },
    }),
    prisma.review.upsert({
      where: {
        bookId_userId: {
          bookId: books[1].id, // 1984
          userId: users[1].id, // Jane Smith
        },
      },
      update: {},
      create: {
        bookId: books[1].id,
        userId: users[1].id,
        rating: 5,
        reviewText: 'Orwell\'s vision of a totalitarian society is chilling and prophetic. The concept of Big Brother and thought control is terrifyingly relevant even today. A must-read for anyone interested in political fiction and dystopian literature.',
      },
    }),
    prisma.review.upsert({
      where: {
        bookId_userId: {
          bookId: books[2].id, // To Kill a Mockingbird
          userId: users[2].id, // Mike Johnson
        },
      },
      update: {},
      create: {
        bookId: books[2].id,
        userId: users[2].id,
        rating: 4,
        reviewText: 'A powerful novel that tackles important themes of racial injustice and moral growth. Harper Lee\'s writing is engaging and the characters are well-developed. While it\'s a classic, some parts feel a bit dated, but the core message remains relevant.',
      },
    }),
    prisma.review.upsert({
      where: {
        bookId_userId: {
          bookId: books[3].id, // The Lord of the Rings
          userId: users[0].id, // John Doe
        },
      },
      update: {},
      create: {
        bookId: books[3].id,
        userId: users[0].id,
        rating: 5,
        reviewText: 'Tolkien\'s epic fantasy is a masterpiece of world-building and storytelling. The journey of Frodo and the Fellowship is captivating from start to finish. The detailed descriptions of Middle-earth create an immersive reading experience.',
      },
    }),
    prisma.review.upsert({
      where: {
        bookId_userId: {
          bookId: books[4].id, // Pride and Prejudice
          userId: users[1].id, // Jane Smith
        },
      },
      update: {},
      create: {
        bookId: books[4].id,
        userId: users[1].id,
        rating: 4,
        reviewText: 'Jane Austen\'s wit and social commentary make this a delightful read. The romance between Elizabeth and Darcy is beautifully developed, and the supporting characters add depth to the story. A classic that has stood the test of time.',
      },
    }),
  ]);

  console.log(`✅ Created ${reviews.length} reviews`);

  // Create some favorites
  await Promise.all([
    prisma.userFavorite.upsert({
      where: {
        userId_bookId: {
          userId: users[0].id,
          bookId: books[0].id,
        },
      },
      update: {},
      create: {
        userId: users[0].id,
        bookId: books[0].id,
      },
    }),
    prisma.userFavorite.upsert({
      where: {
        userId_bookId: {
          userId: users[0].id,
          bookId: books[3].id,
        },
      },
      update: {},
      create: {
        userId: users[0].id,
        bookId: books[3].id,
      },
    }),
    prisma.userFavorite.upsert({
      where: {
        userId_bookId: {
          userId: users[1].id,
          bookId: books[1].id,
        },
      },
      update: {},
      create: {
        userId: users[1].id,
        bookId: books[1].id,
      },
    }),
  ]);

  console.log('✅ Created user favorites');

  // Create some follows
  await Promise.all([
    prisma.userFollow.upsert({
      where: {
        followerId_followingId: {
          followerId: users[0].id,
          followingId: users[1].id,
        },
      },
      update: {},
      create: {
        followerId: users[0].id,
        followingId: users[1].id,
      },
    }),
    prisma.userFollow.upsert({
      where: {
        followerId_followingId: {
          followerId: users[1].id,
          followingId: users[2].id,
        },
      },
      update: {},
      create: {
        followerId: users[1].id,
        followingId: users[2].id,
      },
    }),
  ]);

  console.log('✅ Created user follows');

  console.log('🎉 Database seed completed successfully!');
  console.log('\n📋 Sample accounts created:');
  console.log('Admin: admin@bookreview.com / Admin123!');
  console.log('Moderator: moderator@bookreview.com / Moderator123!');
  console.log('User: john.doe@example.com / User123!');
  console.log('User: jane.smith@example.com / User123!');
  console.log('User: mike.johnson@example.com / User123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
