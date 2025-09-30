import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export const comprehensiveBooks = [
  // Fiction - Fantasy
  { title: "The Lord of the Rings", author: "J.R.R. Tolkien", genre: "Fantasy", rating: 4.8, year: 1954, description: "Epic fantasy adventure in Middle-earth" },
  { title: "Harry Potter and the Philosopher's Stone", author: "J.K. Rowling", genre: "Fantasy", rating: 4.7, year: 1997, description: "A young wizard's journey at Hogwarts" },
  { title: "A Game of Thrones", author: "George R.R. Martin", genre: "Fantasy", rating: 4.6, year: 1996, description: "Political intrigue in Westeros" },
  { title: "The Name of the Wind", author: "Patrick Rothfuss", genre: "Fantasy", rating: 4.5, year: 2007, description: "A legendary wizard's life story" },
  { title: "Mistborn: The Final Empire", author: "Brandon Sanderson", genre: "Fantasy", rating: 4.4, year: 2006, description: "Magic system based on metals" },
  
  // Fiction - Science Fiction
  { title: "Dune", author: "Frank Herbert", genre: "Science Fiction", rating: 4.7, year: 1965, description: "Epic space opera on desert planet" },
  { title: "1984", author: "George Orwell", genre: "Science Fiction", rating: 4.6, year: 1949, description: "Dystopian surveillance society" },
  { title: "The Foundation", author: "Isaac Asimov", genre: "Science Fiction", rating: 4.5, year: 1951, description: "Galactic empire's fall and rise" },
  { title: "Neuromancer", author: "William Gibson", genre: "Science Fiction", rating: 4.3, year: 1984, description: "Cyberpunk classic" },
  { title: "The Martian", author: "Andy Weir", genre: "Science Fiction", rating: 4.4, year: 2011, description: "Astronaut stranded on Mars" },
  
  // Fiction - Mystery/Thriller
  { title: "The Girl with the Dragon Tattoo", author: "Stieg Larsson", genre: "Mystery", rating: 4.2, year: 2005, description: "Investigative journalist mystery" },
  { title: "Gone Girl", author: "Gillian Flynn", genre: "Thriller", rating: 4.1, year: 2012, description: "Psychological thriller about missing wife" },
  { title: "The Da Vinci Code", author: "Dan Brown", genre: "Mystery", rating: 4.0, year: 2003, description: "Religious conspiracy thriller" },
  { title: "The Silence of the Lambs", author: "Thomas Harris", genre: "Thriller", rating: 4.3, year: 1988, description: "FBI agent vs serial killer" },
  { title: "Big Little Lies", author: "Liane Moriarty", genre: "Mystery", rating: 4.2, year: 2014, description: "Suburban secrets and lies" },
  
  // Fiction - Romance
  { title: "Pride and Prejudice", author: "Jane Austen", genre: "Romance", rating: 4.5, year: 1813, description: "Classic Regency romance" },
  { title: "The Notebook", author: "Nicholas Sparks", genre: "Romance", rating: 4.3, year: 1996, description: "Timeless love story" },
  { title: "Outlander", author: "Diana Gabaldon", genre: "Romance", rating: 4.4, year: 1991, description: "Time-traveling romance" },
  { title: "Me Before You", author: "Jojo Moyes", genre: "Romance", rating: 4.2, year: 2012, description: "Emotional contemporary romance" },
  { title: "The Seven Husbands of Evelyn Hugo", author: "Taylor Jenkins Reid", genre: "Romance", rating: 4.6, year: 2017, description: "Hollywood star's life story" },
  
  // Fiction - Literary Fiction
  { title: "To Kill a Mockingbird", author: "Harper Lee", genre: "Literary Fiction", rating: 4.7, year: 1960, description: "Southern Gothic coming-of-age" },
  { title: "The Great Gatsby", author: "F. Scott Fitzgerald", genre: "Literary Fiction", rating: 4.4, year: 1925, description: "American Dream critique" },
  { title: "Beloved", author: "Toni Morrison", genre: "Literary Fiction", rating: 4.5, year: 1987, description: "Post-Civil War ghost story" },
  { title: "The Catcher in the Rye", author: "J.D. Salinger", genre: "Literary Fiction", rating: 4.2, year: 1951, description: "Teenage rebellion classic" },
  { title: "One Hundred Years of Solitude", author: "Gabriel García Márquez", genre: "Literary Fiction", rating: 4.6, year: 1967, description: "Magical realism masterpiece" },
  
  // Non-Fiction - Biography
  { title: "Steve Jobs", author: "Walter Isaacson", genre: "Biography", rating: 4.5, year: 2011, description: "Apple founder's life story" },
  { title: "Becoming", author: "Michelle Obama", genre: "Biography", rating: 4.7, year: 2018, description: "Former First Lady's memoir" },
  { title: "The Diary of a Young Girl", author: "Anne Frank", genre: "Biography", rating: 4.6, year: 1947, description: "Holocaust survivor's diary" },
  { title: "Long Walk to Freedom", author: "Nelson Mandela", genre: "Biography", rating: 4.8, year: 1994, description: "Anti-apartheid leader's autobiography" },
  { title: "Educated", author: "Tara Westover", genre: "Biography", rating: 4.5, year: 2018, description: "Self-taught scholar's journey" },
  
  // Non-Fiction - Self-Help
  { title: "Atomic Habits", author: "James Clear", genre: "Self-Help", rating: 4.6, year: 2018, description: "Building good habits and breaking bad ones" },
  { title: "The 7 Habits of Highly Effective People", author: "Stephen Covey", genre: "Self-Help", rating: 4.4, year: 1989, description: "Personal and professional effectiveness" },
  { title: "Thinking, Fast and Slow", author: "Daniel Kahneman", genre: "Self-Help", rating: 4.5, year: 2011, description: "Psychology of decision making" },
  { title: "The Power of Now", author: "Eckhart Tolle", genre: "Self-Help", rating: 4.3, year: 1997, description: "Spiritual enlightenment guide" },
  { title: "Mindset", author: "Carol Dweck", genre: "Self-Help", rating: 4.4, year: 2006, description: "Growth vs fixed mindset" },
  
  // Non-Fiction - History
  { title: "Sapiens", author: "Yuval Noah Harari", genre: "History", rating: 4.6, year: 2011, description: "Brief history of humankind" },
  { title: "The Guns of August", author: "Barbara Tuchman", genre: "History", rating: 4.5, year: 1962, description: "World War I origins" },
  { title: "A People's History of the United States", author: "Howard Zinn", genre: "History", rating: 4.4, year: 1980, description: "Alternative American history" },
  { title: "The Rise and Fall of the Third Reich", author: "William Shirer", genre: "History", rating: 4.7, year: 1960, description: "Nazi Germany comprehensive history" },
  { title: "Guns, Germs, and Steel", author: "Jared Diamond", genre: "History", rating: 4.5, year: 1997, description: "Why civilizations developed differently" },
  
  // Non-Fiction - Business
  { title: "Good to Great", author: "Jim Collins", genre: "Business", rating: 4.4, year: 2001, description: "What makes companies great" },
  { title: "The Lean Startup", author: "Eric Ries", genre: "Business", rating: 4.3, year: 2011, description: "Startup methodology" },
  { title: "Zero to One", author: "Peter Thiel", genre: "Business", rating: 4.2, year: 2014, description: "Building monopolies" },
  { title: "The Innovator's Dilemma", author: "Clayton Christensen", genre: "Business", rating: 4.4, year: 1997, description: "Disruptive innovation theory" },
  { title: "Built to Last", author: "Jim Collins", genre: "Business", rating: 4.3, year: 1994, description: "Visionary companies" },
  
  // Non-Fiction - Science
  { title: "A Brief History of Time", author: "Stephen Hawking", genre: "Science", rating: 4.5, year: 1988, description: "Cosmology for general readers" },
  { title: "The Selfish Gene", author: "Richard Dawkins", genre: "Science", rating: 4.4, year: 1976, description: "Evolutionary biology" },
  { title: "Cosmos", author: "Carl Sagan", genre: "Science", rating: 4.6, year: 1980, description: "Universe exploration" },
  { title: "The Immortal Life of Henrietta Lacks", author: "Rebecca Skloot", genre: "Science", rating: 4.5, year: 2010, description: "Medical ethics and HeLa cells" },
  { title: "The Double Helix", author: "James Watson", genre: "Science", rating: 4.3, year: 1968, description: "DNA discovery story" },
  
  // Fiction - Horror
  { title: "The Shining", author: "Stephen King", genre: "Horror", rating: 4.3, year: 1977, description: "Haunted hotel psychological horror" },
  { title: "Dracula", author: "Bram Stoker", genre: "Horror", rating: 4.2, year: 1897, description: "Classic vampire novel" },
  { title: "Frankenstein", author: "Mary Shelley", genre: "Horror", rating: 4.4, year: 1818, description: "Gothic horror masterpiece" },
  { title: "The Exorcist", author: "William Peter Blatty", genre: "Horror", rating: 4.1, year: 1971, description: "Demonic possession thriller" },
  { title: "It", author: "Stephen King", genre: "Horror", rating: 4.4, year: 1986, description: "Childhood fears and evil clown" },
  
  // Fiction - Adventure
  { title: "The Adventures of Tom Sawyer", author: "Mark Twain", genre: "Adventure", rating: 4.3, year: 1876, description: "Classic American adventure" },
  { title: "Treasure Island", author: "Robert Louis Stevenson", genre: "Adventure", rating: 4.2, year: 1883, description: "Pirate adventure classic" },
  { title: "The Count of Monte Cristo", author: "Alexandre Dumas", genre: "Adventure", rating: 4.6, year: 1844, description: "Revenge and adventure epic" },
  { title: "Around the World in Eighty Days", author: "Jules Verne", genre: "Adventure", rating: 4.1, year: 1873, description: "Victorian era travel adventure" },
  { title: "The Three Musketeers", author: "Alexandre Dumas", genre: "Adventure", rating: 4.4, year: 1844, description: "Swashbuckling historical adventure" },
  
  // Fiction - Young Adult
  { title: "The Hunger Games", author: "Suzanne Collins", genre: "Young Adult", rating: 4.4, year: 2008, description: "Dystopian survival competition" },
  { title: "The Fault in Our Stars", author: "John Green", genre: "Young Adult", rating: 4.3, year: 2012, description: "Teen cancer love story" },
  { title: "Divergent", author: "Veronica Roth", genre: "Young Adult", rating: 4.2, year: 2011, description: "Dystopian society factions" },
  { title: "The Maze Runner", author: "James Dashner", genre: "Young Adult", rating: 4.1, year: 2009, description: "Post-apocalyptic maze survival" },
  { title: "Eleanor & Park", author: "Rainbow Rowell", genre: "Young Adult", rating: 4.4, year: 2013, description: "High school romance" },
  
  // Non-Fiction - Psychology
  { title: "The Psychology of Money", author: "Morgan Housel", genre: "Psychology", rating: 4.5, year: 2020, description: "Behavioral finance insights" },
  { title: "Influence", author: "Robert Cialdini", genre: "Psychology", rating: 4.4, year: 1984, description: "Psychology of persuasion" },
  { title: "Blink", author: "Malcolm Gladwell", genre: "Psychology", rating: 4.3, year: 2005, description: "Power of thinking without thinking" },
  { title: "The Tipping Point", author: "Malcolm Gladwell", genre: "Psychology", rating: 4.2, year: 2000, description: "How little things make big differences" },
  { title: "Quiet", author: "Susan Cain", genre: "Psychology", rating: 4.4, year: 2012, description: "Power of introverts" },
  
  // Fiction - Historical Fiction
  { title: "The Book Thief", author: "Markus Zusak", genre: "Historical Fiction", rating: 4.6, year: 2005, description: "Nazi Germany through child's eyes" },
  { title: "All the Light We Cannot See", author: "Anthony Doerr", genre: "Historical Fiction", rating: 4.5, year: 2014, description: "World War II interconnected stories" },
  { title: "The Nightingale", author: "Kristin Hannah", genre: "Historical Fiction", rating: 4.4, year: 2015, description: "French Resistance during WWII" },
  { title: "The Pillars of the Earth", author: "Ken Follett", genre: "Historical Fiction", rating: 4.5, year: 1989, description: "Medieval cathedral building" },
  { title: "Wolf Hall", author: "Hilary Mantel", genre: "Historical Fiction", rating: 4.3, year: 2009, description: "Thomas Cromwell's rise to power" },
  
  // Non-Fiction - Philosophy
  { title: "Meditations", author: "Marcus Aurelius", genre: "Philosophy", rating: 4.6, year: 180, description: "Stoic philosophy reflections" },
  { title: "The Republic", author: "Plato", genre: "Philosophy", rating: 4.5, year: -380, description: "Justice and ideal state" },
  { title: "Thus Spoke Zarathustra", author: "Friedrich Nietzsche", genre: "Philosophy", rating: 4.4, year: 1883, description: "Philosophical novel on Superman" },
  { title: "The Art of War", author: "Sun Tzu", genre: "Philosophy", rating: 4.3, year: -500, description: "Ancient Chinese military strategy" },
  { title: "Critique of Pure Reason", author: "Immanuel Kant", genre: "Philosophy", rating: 4.2, year: 1781, description: "Epistemology and metaphysics" },
  
  // Fiction - Comedy/Humor
  { title: "Catch-22", author: "Joseph Heller", genre: "Comedy", rating: 4.4, year: 1961, description: "Absurdist war satire" },
  { title: "The Hitchhiker's Guide to the Galaxy", author: "Douglas Adams", genre: "Comedy", rating: 4.5, year: 1979, description: "Sci-fi comedy classic" },
  { title: "Good Omens", author: "Terry Pratchett", genre: "Comedy", rating: 4.4, year: 1990, description: "Apocalypse comedy" },
  { title: "Bossypants", author: "Tina Fey", genre: "Comedy", rating: 4.3, year: 2011, description: "Comedian's memoir" },
  { title: "Yes Please", author: "Amy Poehler", genre: "Comedy", rating: 4.2, year: 2014, description: "Comedy memoir" },
  
  // Non-Fiction - Travel
  { title: "Eat, Pray, Love", author: "Elizabeth Gilbert", genre: "Travel", rating: 4.1, year: 2006, description: "Spiritual journey memoir" },
  { title: "Into the Wild", author: "Jon Krakauer", genre: "Travel", rating: 4.4, year: 1996, description: "Alaskan wilderness adventure" },
  { title: "Wild", author: "Cheryl Strayed", genre: "Travel", rating: 4.3, year: 2012, description: "Pacific Crest Trail journey" },
  { title: "A Walk in the Woods", author: "Bill Bryson", genre: "Travel", rating: 4.2, year: 1998, description: "Appalachian Trail humor" },
  { title: "The Alchemist", author: "Paulo Coelho", genre: "Travel", rating: 4.3, year: 1988, description: "Spiritual journey allegory" },
  
  // Fiction - Drama
  { title: "Death of a Salesman", author: "Arthur Miller", genre: "Drama", rating: 4.4, year: 1949, description: "American Dream tragedy" },
  { title: "A Streetcar Named Desire", author: "Tennessee Williams", genre: "Drama", rating: 4.3, year: 1947, description: "Southern Gothic drama" },
  { title: "The Crucible", author: "Arthur Miller", genre: "Drama", rating: 4.2, year: 1953, description: "Salem witch trials allegory" },
  { title: "Waiting for Godot", author: "Samuel Beckett", genre: "Drama", rating: 4.1, year: 1953, description: "Absurdist theater" },
  { title: "A Raisin in the Sun", author: "Lorraine Hansberry", genre: "Drama", rating: 4.3, year: 1959, description: "African American family drama" },
  
  // Non-Fiction - Health
  { title: "The Body Keeps the Score", author: "Bessel van der Kolk", genre: "Health", rating: 4.6, year: 2014, description: "Trauma and body connection" },
  { title: "Why We Sleep", author: "Matthew Walker", genre: "Health", rating: 4.5, year: 2017, description: "Science of sleep" },
  { title: "The Immortal Life of Henrietta Lacks", author: "Rebecca Skloot", genre: "Health", rating: 4.5, year: 2010, description: "Medical ethics and HeLa cells" },
  { title: "Being Mortal", author: "Atul Gawande", genre: "Health", rating: 4.4, year: 2014, description: "Medicine and mortality" },
  { title: "The Gene", author: "Siddhartha Mukherjee", genre: "Health", rating: 4.5, year: 2016, description: "History of genetics" },
  
  // Fiction - Poetry
  { title: "Leaves of Grass", author: "Walt Whitman", genre: "Poetry", rating: 4.4, year: 1855, description: "American poetry collection" },
  { title: "The Waste Land", author: "T.S. Eliot", genre: "Poetry", rating: 4.3, year: 1922, description: "Modernist poetry masterpiece" },
  { title: "Howl", author: "Allen Ginsberg", genre: "Poetry", rating: 4.2, year: 1956, description: "Beat generation poem" },
  { title: "The Collected Poems", author: "Emily Dickinson", genre: "Poetry", rating: 4.5, year: 1890, description: "Posthumous poetry collection" },
  { title: "The Sun and Her Flowers", author: "Rupi Kaur", genre: "Poetry", rating: 4.1, year: 2017, description: "Contemporary poetry collection" },
  
  // Non-Fiction - Technology
  { title: "The Innovators", author: "Walter Isaacson", genre: "Technology", rating: 4.4, year: 2014, description: "Digital revolution history" },
  { title: "Hackers", author: "Steven Levy", genre: "Technology", rating: 4.3, year: 1984, description: "Computer culture pioneers" },
  { title: "The Soul of a New Machine", author: "Tracy Kidder", genre: "Technology", rating: 4.2, year: 1981, description: "Computer development story" },
  { title: "The Code Book", author: "Simon Singh", genre: "Technology", rating: 4.4, year: 1999, description: "Cryptography history" },
  { title: "The Master Algorithm", author: "Pedro Domingos", genre: "Technology", rating: 4.3, year: 2015, description: "Machine learning explained" }
];

export async function seedComprehensiveBooks() {
  try {
    logger.info('Starting comprehensive book seeding...');

    // Create genres first
    const genres = [...new Set(comprehensiveBooks.map(book => book.genre))];
    const genreMap = new Map();

    for (const genreName of genres) {
      const genre = await prisma.genre.upsert({
        where: { name: genreName },
        update: {},
        create: { name: genreName }
      });
      genreMap.set(genreName, genre.id);
    }

    // Create books
    for (const bookData of comprehensiveBooks) {
      // Check if book already exists
      const existingBook = await prisma.book.findFirst({
        where: {
          title: bookData.title,
          author: bookData.author
        }
      });

      if (existingBook) {
        // Update existing book
        const book = await prisma.book.update({
          where: { id: existingBook.id },
          data: {
            description: bookData.description,
            publishedYear: bookData.year
          }
        });
        logger.info(`Updated book: ${book.title} by ${book.author}`);
      } else {
        // Create new book
        const book = await prisma.book.create({
          data: {
            title: bookData.title,
            author: bookData.author,
            description: bookData.description,
            publishedYear: bookData.year,
            genres: {
              create: {
                genre: {
                  connect: { id: genreMap.get(bookData.genre) }
                }
              }
            }
          }
        });
        logger.info(`Created book: ${book.title} by ${book.author}`);
      }
    }

    logger.info(`Successfully seeded ${comprehensiveBooks.length} books across ${genres.length} genres`);
    return { booksCount: comprehensiveBooks.length, genresCount: genres.length };
  } catch (error) {
    logger.error('Error seeding comprehensive books:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedComprehensiveBooks()
    .then((result) => {
      console.log('Seeding completed:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}
