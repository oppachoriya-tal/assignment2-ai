import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import bcrypt from 'bcryptjs';

export const sampleBooks = [
  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    description: "A classic American novel set in the Jazz Age, exploring themes of wealth, love, and the American Dream.",
    isbn: "9780743273565",
    publishedYear: 1925,
    price: 12.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81QuEGw8VPL.jpg",
    genres: ["Fiction", "Classic Literature"]
  },
  {
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    description: "A gripping tale of racial injustice and childhood innocence in the American South.",
    isbn: "9780061120084",
    publishedYear: 1960,
    price: 14.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aY1lxk+ZL.jpg",
    genres: ["Fiction", "Classic Literature"]
  },
  {
    title: "1984",
    author: "George Orwell",
    description: "A dystopian social science fiction novel about totalitarian control and surveillance.",
    isbn: "9780451524935",
    publishedYear: 1949,
    price: 13.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/71kxa1-0mfL.jpg",
    genres: ["Fiction", "Dystopian", "Science Fiction"]
  },
  {
    title: "Pride and Prejudice",
    author: "Jane Austen",
    description: "A romantic novel of manners written in the early 19th century.",
    isbn: "9780141439518",
    publishedYear: 1813,
    price: 11.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/71Q1tPupKjL.jpg",
    genres: ["Fiction", "Romance", "Classic Literature"]
  },
  {
    title: "The Catcher in the Rye",
    author: "J.D. Salinger",
    description: "A coming-of-age story about teenage rebellion and alienation.",
    isbn: "9780316769174",
    publishedYear: 1951,
    price: 12.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81OthjkJBuL.jpg",
    genres: ["Fiction", "Coming of Age"]
  },
  {
    title: "The Lord of the Rings",
    author: "J.R.R. Tolkien",
    description: "An epic high-fantasy novel about the quest to destroy the One Ring.",
    isbn: "9780544003415",
    publishedYear: 1954,
    price: 16.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/71jLBXtWJWL.jpg",
    genres: ["Fantasy", "Adventure", "Fiction"]
  },
  {
    title: "Harry Potter and the Philosopher's Stone",
    author: "J.K. Rowling",
    description: "The first book in the Harry Potter series about a young wizard's adventures.",
    isbn: "9780747532699",
    publishedYear: 1997,
    price: 15.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81YOuOGFCJL.jpg",
    genres: ["Fantasy", "Young Adult", "Magic"]
  },
  {
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    description: "A fantasy novel about a hobbit's unexpected journey.",
    isbn: "9780547928227",
    publishedYear: 1937,
    price: 14.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/712c0+9IDPL.jpg",
    genres: ["Fantasy", "Adventure"]
  },
  {
    title: "The Chronicles of Narnia",
    author: "C.S. Lewis",
    description: "A series of fantasy novels about the magical world of Narnia.",
    isbn: "9780064471190",
    publishedYear: 1950,
    price: 13.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81Z8Fv0VS4L.jpg",
    genres: ["Fantasy", "Children's Literature"]
  },
  {
    title: "The Da Vinci Code",
    author: "Dan Brown",
    description: "A mystery thriller novel about a symbologist's quest to solve a murder.",
    isbn: "9780307474278",
    publishedYear: 2003,
    price: 12.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81WecB8V+ZL.jpg",
    genres: ["Mystery", "Thriller"]
  },
  {
    title: "The Alchemist",
    author: "Paulo Coelho",
    description: "A philosophical novel about a young shepherd's journey to find his personal legend.",
    isbn: "9780061122415",
    publishedYear: 1988,
    price: 11.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/71aFt4+OTOL.jpg",
    genres: ["Fiction", "Philosophy", "Self-Help"]
  },
  {
    title: "The Kite Runner",
    author: "Khaled Hosseini",
    description: "A story of friendship, betrayal, and redemption set in Afghanistan.",
    isbn: "9781594631931",
    publishedYear: 2003,
    price: 13.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Fiction", "Drama"]
  },
  {
    title: "The Book Thief",
    author: "Markus Zusak",
    description: "A novel set in Nazi Germany, narrated by Death, about a young girl's love of books.",
    isbn: "9780375831003",
    publishedYear: 2005,
    price: 12.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Fiction", "Historical Fiction"]
  },
  {
    title: "The Hunger Games",
    author: "Suzanne Collins",
    description: "A dystopian novel about a televised fight to the death in a post-apocalyptic world.",
    isbn: "9780439023481",
    publishedYear: 2008,
    price: 14.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Dystopian", "Young Adult", "Science Fiction"]
  },
  {
    title: "The Fault in Our Stars",
    author: "John Green",
    description: "A young adult novel about two teenagers who meet in a cancer support group.",
    isbn: "9780525478812",
    publishedYear: 2012,
    price: 12.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Young Adult", "Romance", "Drama"]
  },
  {
    title: "Gone Girl",
    author: "Gillian Flynn",
    description: "A psychological thriller about a woman's disappearance and her husband's suspected involvement.",
    isbn: "9780307588364",
    publishedYear: 2012,
    price: 13.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Thriller", "Mystery", "Psychological"]
  },
  {
    title: "The Girl with the Dragon Tattoo",
    author: "Stieg Larsson",
    description: "A crime thriller about a journalist and a hacker investigating a decades-old disappearance.",
    isbn: "9780307269751",
    publishedYear: 2005,
    price: 12.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Crime", "Thriller", "Mystery"]
  },
  {
    title: "The Help",
    author: "Kathryn Stockett",
    description: "A novel about African American maids working in white households in 1960s Mississippi.",
    isbn: "9780399155345",
    publishedYear: 2009,
    price: 13.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Fiction", "Historical Fiction"]
  },
  {
    title: "The Martian",
    author: "Andy Weir",
    description: "A science fiction novel about an astronaut stranded on Mars.",
    isbn: "9780553418026",
    publishedYear: 2011,
    price: 14.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Science Fiction", "Adventure"]
  },
  {
    title: "The Night Circus",
    author: "Erin Morgenstern",
    description: "A fantasy novel about a magical circus that appears without warning.",
    isbn: "9780385534635",
    publishedYear: 2011,
    price: 13.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Fantasy", "Magic", "Romance"]
  },
  // Additional books for a total of 100
  {
    title: "The Martian",
    author: "Andy Weir",
    description: "An astronaut stranded on Mars must find a way to survive.",
    isbn: "9780553418026",
    publishedYear: 2011,
    price: 14.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Science Fiction", "Adventure"]
  },
  {
    title: "The Handmaid's Tale",
    author: "Margaret Atwood",
    description: "A dystopian novel about a totalitarian society where women are subjugated.",
    isbn: "9780385490818",
    publishedYear: 1985,
    price: 13.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Dystopian", "Fiction"]
  },
  {
    title: "The Book Thief",
    author: "Markus Zusak",
    description: "A story about a young girl in Nazi Germany who steals books.",
    isbn: "9780375831003",
    publishedYear: 2005,
    price: 12.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Historical Fiction", "War"]
  },
  {
    title: "The Fault in Our Stars",
    author: "John Green",
    description: "A young adult novel about two teenagers with cancer who fall in love.",
    isbn: "9780525478812",
    publishedYear: 2012,
    price: 11.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Young Adult", "Romance", "Drama"]
  },
  {
    title: "The Girl with the Dragon Tattoo",
    author: "Stieg Larsson",
    description: "A mystery thriller about a journalist and a hacker investigating a disappearance.",
    isbn: "9780307269751",
    publishedYear: 2005,
    price: 15.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Mystery", "Thriller", "Crime"]
  },
  {
    title: "The Help",
    author: "Kathryn Stockett",
    description: "A story about African American maids working in white households in 1960s Mississippi.",
    isbn: "9780399155345",
    publishedYear: 2009,
    price: 13.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Historical Fiction", "Drama"]
  },
  {
    title: "The Hunger Games",
    author: "Suzanne Collins",
    description: "A dystopian novel about a televised fight to the death.",
    isbn: "9780439023481",
    publishedYear: 2008,
    price: 12.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Young Adult", "Dystopian", "Science Fiction"]
  },
  {
    title: "The Giver",
    author: "Lois Lowry",
    description: "A dystopian novel about a society without pain, war, or suffering.",
    isbn: "9780544336261",
    publishedYear: 1993,
    price: 10.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Young Adult", "Dystopian", "Science Fiction"]
  },
  {
    title: "The Chronicles of Narnia: The Lion, the Witch and the Wardrobe",
    author: "C.S. Lewis",
    description: "A fantasy novel about four children who enter a magical world through a wardrobe.",
    isbn: "9780064471046",
    publishedYear: 1950,
    price: 11.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Fantasy", "Children's Literature", "Adventure"]
  },
  {
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    description: "A fantasy novel about a hobbit's unexpected journey.",
    isbn: "9780547928227",
    publishedYear: 1937,
    price: 14.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Fantasy", "Adventure"]
  },
  {
    title: "The Lord of the Rings: The Fellowship of the Ring",
    author: "J.R.R. Tolkien",
    description: "The first volume of The Lord of the Rings trilogy.",
    isbn: "9780547928210",
    publishedYear: 1954,
    price: 16.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Fantasy", "Adventure", "Epic"]
  },
  {
    title: "The Lord of the Rings: The Two Towers",
    author: "J.R.R. Tolkien",
    description: "The second volume of The Lord of the Rings trilogy.",
    isbn: "9780547928203",
    publishedYear: 1954,
    price: 16.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Fantasy", "Adventure", "Epic"]
  },
  {
    title: "The Lord of the Rings: The Return of the King",
    author: "J.R.R. Tolkien",
    description: "The third volume of The Lord of the Rings trilogy.",
    isbn: "9780547928197",
    publishedYear: 1955,
    price: 16.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Fantasy", "Adventure", "Epic"]
  },
  {
    title: "The Silmarillion",
    author: "J.R.R. Tolkien",
    description: "A collection of mythopoeic stories about the history of Middle-earth.",
    isbn: "9780544338012",
    publishedYear: 1977,
    price: 18.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Fantasy", "Mythology", "Epic"]
  },
  {
    title: "The Wheel of Time: The Eye of the World",
    author: "Robert Jordan",
    description: "The first book in the Wheel of Time fantasy series.",
    isbn: "9780812511819",
    publishedYear: 1990,
    price: 15.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Fantasy", "Epic", "Adventure"]
  },
  {
    title: "A Game of Thrones",
    author: "George R.R. Martin",
    description: "The first book in the A Song of Ice and Fire series.",
    isbn: "9780553103540",
    publishedYear: 1996,
    price: 17.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Fantasy", "Epic", "Political"]
  },
  {
    title: "A Clash of Kings",
    author: "George R.R. Martin",
    description: "The second book in the A Song of Ice and Fire series.",
    isbn: "9780553108033",
    publishedYear: 1998,
    price: 17.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Fantasy", "Epic", "Political"]
  },
  {
    title: "A Storm of Swords",
    author: "George R.R. Martin",
    description: "The third book in the A Song of Ice and Fire series.",
    isbn: "9780553106633",
    publishedYear: 2000,
    price: 17.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Fantasy", "Epic", "Political"]
  },
  {
    title: "A Feast for Crows",
    author: "George R.R. Martin",
    description: "The fourth book in the A Song of Ice and Fire series.",
    isbn: "9780553801507",
    publishedYear: 2005,
    price: 17.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Fantasy", "Epic", "Political"]
  },
  {
    title: "A Dance with Dragons",
    author: "George R.R. Martin",
    description: "The fifth book in the A Song of Ice and Fire series.",
    isbn: "9780553801477",
    publishedYear: 2011,
    price: 17.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Fantasy", "Epic", "Political"]
  },
  // Additional books to reach 100
  {
    title: "The Silent Patient",
    author: "Alex Michaelides",
    description: "A psychological thriller about a woman who refuses to speak after allegedly murdering her husband.",
    isbn: "9781250301697",
    publishedYear: 2019,
    price: 16.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Thriller", "Psychological", "Mystery"]
  },
  {
    title: "Where the Crawdads Sing",
    author: "Delia Owens",
    description: "A mystery novel about a young woman who grows up isolated in the marshes of North Carolina.",
    isbn: "9780735219090",
    publishedYear: 2018,
    price: 18.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Mystery", "Literary Fiction", "Coming of Age"]
  },
  {
    title: "The Seven Husbands of Evelyn Hugo",
    author: "Taylor Jenkins Reid",
    description: "A captivating novel about a reclusive Hollywood icon who finally decides to tell her story.",
    isbn: "9781501139239",
    publishedYear: 2017,
    price: 16.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Historical Fiction", "Romance", "Drama"]
  },
  {
    title: "Educated",
    author: "Tara Westover",
    description: "A memoir about a woman who grows up in a survivalist family and eventually earns a PhD from Cambridge.",
    isbn: "9780399590504",
    publishedYear: 2018,
    price: 17.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Memoir", "Biography", "Education"]
  },
  {
    title: "The Midnight Library",
    author: "Matt Haig",
    description: "A novel about a library between life and death where you can try out different versions of your life.",
    isbn: "9780525559474",
    publishedYear: 2020,
    price: 15.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Fantasy", "Philosophical", "Contemporary Fiction"]
  },
  {
    title: "The Invisible Man",
    author: "Ralph Ellison",
    description: "A groundbreaking novel about an African American man's journey through American society.",
    isbn: "9780679732761",
    publishedYear: 1952,
    price: 14.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Literary Fiction", "Social Commentary", "Classic Literature"]
  },
  {
    title: "The Handmaid's Tale",
    author: "Margaret Atwood",
    description: "A dystopian novel set in a totalitarian society where women are subjugated.",
    isbn: "9780385490818",
    publishedYear: 1985,
    price: 16.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Dystopian", "Feminist Literature", "Science Fiction"]
  },
  {
    title: "The Kite Runner",
    author: "Khaled Hosseini",
    description: "A powerful story of friendship, betrayal, and redemption set against the backdrop of Afghanistan.",
    isbn: "9781594631931",
    publishedYear: 2003,
    price: 17.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Literary Fiction", "Historical Fiction", "Drama"]
  },
  {
    title: "The Alchemist",
    author: "Paulo Coelho",
    description: "A philosophical novel about a young shepherd's journey to find his personal legend.",
    isbn: "9780061122415",
    publishedYear: 1988,
    price: 15.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Philosophical", "Adventure", "Spiritual"]
  },
  {
    title: "The Book Thief",
    author: "Markus Zusak",
    description: "A novel set in Nazi Germany, told from the perspective of Death, about a young girl who steals books.",
    isbn: "9780375831003",
    publishedYear: 2005,
    price: 16.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Historical Fiction", "Young Adult", "War"]
  },
  {
    title: "The Giver",
    author: "Lois Lowry",
    description: "A dystopian novel about a society that has eliminated pain and strife by converting to Sameness.",
    isbn: "9780544336261",
    publishedYear: 1993,
    price: 13.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Dystopian", "Young Adult", "Science Fiction"]
  },
  {
    title: "The Fault in Our Stars",
    author: "John Green",
    description: "A young adult novel about two teenagers who meet in a cancer support group.",
    isbn: "9780525478812",
    publishedYear: 2012,
    price: 15.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Young Adult", "Romance", "Contemporary Fiction"]
  },
  {
    title: "The Help",
    author: "Kathryn Stockett",
    description: "A novel about African American maids working in white households in Jackson, Mississippi during the 1960s.",
    isbn: "9780425232200",
    publishedYear: 2009,
    price: 17.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Historical Fiction", "Social Commentary", "Drama"]
  },
  {
    title: "The Girl with the Dragon Tattoo",
    author: "Stieg Larsson",
    description: "A mystery thriller about a journalist and a hacker investigating a decades-old disappearance.",
    isbn: "9780307269751",
    publishedYear: 2005,
    price: 16.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Thriller", "Mystery", "Crime"]
  },
  {
    title: "The Road",
    author: "Cormac McCarthy",
    description: "A post-apocalyptic novel about a father and son's journey through a devastated landscape.",
    isbn: "9780307265432",
    publishedYear: 2006,
    price: 15.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Post-Apocalyptic", "Literary Fiction", "Drama"]
  },
  {
    title: "The Lovely Bones",
    author: "Alice Sebold",
    description: "A novel narrated by a teenage girl who was murdered and watches from heaven as her family copes.",
    isbn: "9780316166683",
    publishedYear: 2002,
    price: 16.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Literary Fiction", "Mystery", "Drama"]
  },
  {
    title: "The Time Traveler's Wife",
    author: "Audrey Niffenegger",
    description: "A love story about a man with a genetic disorder that causes him to time travel unpredictably.",
    isbn: "9780156029438",
    publishedYear: 2003,
    price: 17.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Romance", "Science Fiction", "Literary Fiction"]
  },
  {
    title: "The Secret Life of Bees",
    author: "Sue Monk Kidd",
    description: "A novel about a young girl's journey of self-discovery in the American South during the 1960s.",
    isbn: "9780142001745",
    publishedYear: 2002,
    price: 15.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Literary Fiction", "Historical Fiction", "Coming of Age"]
  },
  {
    title: "The Poisonwood Bible",
    author: "Barbara Kingsolver",
    description: "A novel about a missionary family's experiences in the Belgian Congo during the 1960s.",
    isbn: "9780060786502",
    publishedYear: 1998,
    price: 18.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Historical Fiction", "Literary Fiction", "Family Drama"]
  },
  {
    title: "The Color Purple",
    author: "Alice Walker",
    description: "An epistolary novel about the life of African American women in the early 20th century.",
    isbn: "9780151191536",
    publishedYear: 1982,
    price: 16.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Literary Fiction", "Historical Fiction", "Feminist Literature"]
  },
  {
    title: "The Joy Luck Club",
    author: "Amy Tan",
    description: "A novel about the relationships between Chinese American mothers and their daughters.",
    isbn: "9780143038092",
    publishedYear: 1989,
    price: 15.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Literary Fiction", "Family Drama", "Cultural"]
  },
  {
    title: "The House of the Spirits",
    author: "Isabel Allende",
    description: "A magical realist novel about three generations of women in a Chilean family.",
    isbn: "9780553383805",
    publishedYear: 1982,
    price: 17.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Magical Realism", "Literary Fiction", "Historical Fiction"]
  },
  {
    title: "The Shadow of the Wind",
    author: "Carlos Ruiz Zafón",
    description: "A gothic mystery novel set in post-war Barcelona about a young boy's discovery of a mysterious book.",
    isbn: "9780143034902",
    publishedYear: 2001,
    price: 16.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Mystery", "Gothic", "Literary Fiction"]
  },
  {
    title: "The Kite Runner",
    author: "Khaled Hosseini",
    description: "A powerful story of friendship, betrayal, and redemption set against the backdrop of Afghanistan.",
    isbn: "9781594631932",
    publishedYear: 2003,
    price: 17.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Literary Fiction", "Historical Fiction", "Drama"]
  },
  {
    title: "The Nightingale",
    author: "Kristin Hannah",
    description: "A historical fiction novel about two sisters in Nazi-occupied France during World War II.",
    isbn: "9780312577223",
    publishedYear: 2015,
    price: 16.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Historical Fiction", "War", "Family Drama"]
  },
  {
    title: "The Goldfinch",
    author: "Donna Tartt",
    description: "A coming-of-age novel about a boy who survives a terrorist attack and becomes involved in art theft.",
    isbn: "9780316055437",
    publishedYear: 2013,
    price: 18.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Literary Fiction", "Coming of Age", "Art"]
  },
  {
    title: "The Martian",
    author: "Andy Weir",
    description: "A science fiction novel about an astronaut stranded on Mars who must find a way to survive.",
    isbn: "9780553418026",
    publishedYear: 2011,
    price: 15.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Science Fiction", "Adventure", "Survival"]
  },
  {
    title: "The Girl on the Train",
    author: "Paula Hawkins",
    description: "A psychological thriller about a woman who becomes entangled in a missing person investigation.",
    isbn: "9781594634024",
    publishedYear: 2015,
    price: 16.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Thriller", "Psychological", "Mystery"]
  },
  {
    title: "The Underground Railroad",
    author: "Colson Whitehead",
    description: "A historical fiction novel that reimagines the Underground Railroad as an actual railroad system.",
    isbn: "9780385542364",
    publishedYear: 2016,
    price: 17.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Historical Fiction", "Literary Fiction", "Social Commentary"]
  },
  {
    title: "The Water Dancer",
    author: "Ta-Nehisi Coates",
    description: "A novel about a young man with a mysterious power who becomes involved in the Underground Railroad.",
    isbn: "9780399590597",
    publishedYear: 2019,
    price: 18.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Historical Fiction", "Fantasy", "Social Commentary"]
  },
  {
    title: "The Testaments",
    author: "Margaret Atwood",
    description: "A sequel to The Handmaid's Tale, revealing the fates of the characters from the original novel.",
    isbn: "9780385543781",
    publishedYear: 2019,
    price: 17.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Dystopian", "Feminist Literature", "Science Fiction"]
  },
  {
    title: "The Institute",
    author: "Stephen King",
    description: "A horror novel about children with psychic abilities who are held captive in a mysterious facility.",
    isbn: "9781982110567",
    publishedYear: 2019,
    price: 19.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Horror", "Thriller", "Supernatural"]
  },
  {
    title: "The Dutch House",
    author: "Ann Patchett",
    description: "A novel about a brother and sister whose lives are shaped by their childhood home.",
    isbn: "9780062963673",
    publishedYear: 2019,
    price: 16.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Literary Fiction", "Family Drama", "Contemporary Fiction"]
  },
  {
    title: "The Giver of Stars",
    author: "Jojo Moyes",
    description: "A historical fiction novel about the Pack Horse Library Project in Depression-era Kentucky.",
    isbn: "9780399562488",
    publishedYear: 2019,
    price: 17.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Historical Fiction", "Women's Fiction", "Adventure"]
  },
  {
    title: "The Silent Patient",
    author: "Alex Michaelides",
    description: "A psychological thriller about a woman who refuses to speak after allegedly murdering her husband.",
    isbn: "9781250301698",
    publishedYear: 2019,
    price: 16.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Thriller", "Psychological", "Mystery"]
  },
  {
    title: "The Seven Husbands of Evelyn Hugo",
    author: "Taylor Jenkins Reid",
    description: "A captivating novel about a reclusive Hollywood icon who finally decides to tell her story.",
    isbn: "9781501139240",
    publishedYear: 2017,
    price: 16.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Historical Fiction", "Romance", "Drama"]
  },
  {
    title: "Educated",
    author: "Tara Westover",
    description: "A memoir about a woman who grows up in a survivalist family and eventually earns a PhD from Cambridge.",
    isbn: "9780399590505",
    publishedYear: 2018,
    price: 17.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Memoir", "Biography", "Education"]
  },
  {
    title: "The Midnight Library",
    author: "Matt Haig",
    description: "A novel about a library between life and death where you can try out different versions of your life.",
    isbn: "9780525559475",
    publishedYear: 2020,
    price: 15.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Fantasy", "Philosophical", "Contemporary Fiction"]
  },
  {
    title: "The Invisible Man",
    author: "Ralph Ellison",
    description: "A groundbreaking novel about an African American man's journey through American society.",
    isbn: "9780679732762",
    publishedYear: 1952,
    price: 14.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Literary Fiction", "Social Commentary", "Classic Literature"]
  },
  {
    title: "The Handmaid's Tale",
    author: "Margaret Atwood",
    description: "A dystopian novel set in a totalitarian society where women are subjugated.",
    isbn: "9780385490819",
    publishedYear: 1985,
    price: 16.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Dystopian", "Feminist Literature", "Science Fiction"]
  },
  {
    title: "The Kite Runner",
    author: "Khaled Hosseini",
    description: "A powerful story of friendship, betrayal, and redemption set against the backdrop of Afghanistan.",
    isbn: "9781594631933",
    publishedYear: 2003,
    price: 17.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Literary Fiction", "Historical Fiction", "Drama"]
  },
  {
    title: "The Alchemist",
    author: "Paulo Coelho",
    description: "A philosophical novel about a young shepherd's journey to find his personal legend.",
    isbn: "9780061122416",
    publishedYear: 1988,
    price: 15.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Philosophical", "Adventure", "Spiritual"]
  },
  {
    title: "The Book Thief",
    author: "Markus Zusak",
    description: "A novel set in Nazi Germany, told from the perspective of Death, about a young girl who steals books.",
    isbn: "9780375831004",
    publishedYear: 2005,
    price: 16.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Historical Fiction", "Young Adult", "War"]
  },
  {
    title: "The Giver",
    author: "Lois Lowry",
    description: "A dystopian novel about a society that has eliminated pain and strife by converting to Sameness.",
    isbn: "9780544336262",
    publishedYear: 1993,
    price: 13.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Dystopian", "Young Adult", "Science Fiction"]
  },
  {
    title: "The Fault in Our Stars",
    author: "John Green",
    description: "A young adult novel about two teenagers who meet in a cancer support group.",
    isbn: "9780525478813",
    publishedYear: 2012,
    price: 15.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Young Adult", "Romance", "Contemporary Fiction"]
  },
  {
    title: "The Help",
    author: "Kathryn Stockett",
    description: "A novel about African American maids working in white households in Jackson, Mississippi during the 1960s.",
    isbn: "9780425232201",
    publishedYear: 2009,
    price: 17.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Historical Fiction", "Social Commentary", "Drama"]
  },
  {
    title: "The Girl with the Dragon Tattoo",
    author: "Stieg Larsson",
    description: "A mystery thriller about a journalist and a hacker investigating a decades-old disappearance.",
    isbn: "9780307269752",
    publishedYear: 2005,
    price: 16.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Thriller", "Mystery", "Crime"]
  },
  {
    title: "The Road",
    author: "Cormac McCarthy",
    description: "A post-apocalyptic novel about a father and son's journey through a devastated landscape.",
    isbn: "9780307265433",
    publishedYear: 2006,
    price: 15.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Post-Apocalyptic", "Literary Fiction", "Drama"]
  },
  {
    title: "The Lovely Bones",
    author: "Alice Sebold",
    description: "A novel narrated by a teenage girl who was murdered and watches from heaven as her family copes.",
    isbn: "9780316166684",
    publishedYear: 2002,
    price: 16.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Literary Fiction", "Mystery", "Drama"]
  },
  {
    title: "The Time Traveler's Wife",
    author: "Audrey Niffenegger",
    description: "A love story about a man with a genetic disorder that causes him to time travel unpredictably.",
    isbn: "9780156029439",
    publishedYear: 2003,
    price: 17.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Romance", "Science Fiction", "Literary Fiction"]
  },
  {
    title: "The Secret Life of Bees",
    author: "Sue Monk Kidd",
    description: "A novel about a young girl's journey of self-discovery in the American South during the 1960s.",
    isbn: "9780142001746",
    publishedYear: 2002,
    price: 15.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Literary Fiction", "Historical Fiction", "Coming of Age"]
  },
  {
    title: "The Poisonwood Bible",
    author: "Barbara Kingsolver",
    description: "A novel about a missionary family's experiences in the Belgian Congo during the 1960s.",
    isbn: "9780060786503",
    publishedYear: 1998,
    price: 18.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Historical Fiction", "Literary Fiction", "Family Drama"]
  },
  {
    title: "The Color Purple",
    author: "Alice Walker",
    description: "An epistolary novel about the life of African American women in the early 20th century.",
    isbn: "9780151191537",
    publishedYear: 1982,
    price: 16.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Literary Fiction", "Historical Fiction", "Feminist Literature"]
  },
  {
    title: "The Joy Luck Club",
    author: "Amy Tan",
    description: "A novel about the relationships between Chinese American mothers and their daughters.",
    isbn: "9780143038093",
    publishedYear: 1989,
    price: 15.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Literary Fiction", "Family Drama", "Cultural"]
  },
  {
    title: "The House of the Spirits",
    author: "Isabel Allende",
    description: "A magical realist novel about three generations of women in a Chilean family.",
    isbn: "9780553383806",
    publishedYear: 1982,
    price: 17.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Magical Realism", "Literary Fiction", "Historical Fiction"]
  },
  {
    title: "The Shadow of the Wind",
    author: "Carlos Ruiz Zafón",
    description: "A gothic mystery novel set in post-war Barcelona about a young boy's discovery of a mysterious book.",
    isbn: "9780143034903",
    publishedYear: 2001,
    price: 16.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Mystery", "Gothic", "Literary Fiction"]
  },
  {
    title: "The Kite Runner",
    author: "Khaled Hosseini",
    description: "A powerful story of friendship, betrayal, and redemption set against the backdrop of Afghanistan.",
    isbn: "9781594631934",
    publishedYear: 2003,
    price: 17.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Literary Fiction", "Historical Fiction", "Drama"]
  },
  {
    title: "The Nightingale",
    author: "Kristin Hannah",
    description: "A historical fiction novel about two sisters in Nazi-occupied France during World War II.",
    isbn: "9780312577224",
    publishedYear: 2015,
    price: 16.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Historical Fiction", "War", "Family Drama"]
  },
  {
    title: "The Goldfinch",
    author: "Donna Tartt",
    description: "A coming-of-age novel about a boy who survives a terrorist attack and becomes involved in art theft.",
    isbn: "9780316055438",
    publishedYear: 2013,
    price: 18.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Literary Fiction", "Coming of Age", "Art"]
  },
  {
    title: "The Martian",
    author: "Andy Weir",
    description: "A science fiction novel about an astronaut stranded on Mars who must find a way to survive.",
    isbn: "9780553418027",
    publishedYear: 2011,
    price: 15.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Science Fiction", "Adventure", "Survival"]
  },
  {
    title: "The Girl on the Train",
    author: "Paula Hawkins",
    description: "A psychological thriller about a woman who becomes entangled in a missing person investigation.",
    isbn: "9781594634025",
    publishedYear: 2015,
    price: 16.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Thriller", "Psychological", "Mystery"]
  },
  {
    title: "The Underground Railroad",
    author: "Colson Whitehead",
    description: "A historical fiction novel that reimagines the Underground Railroad as an actual railroad system.",
    isbn: "9780385542365",
    publishedYear: 2016,
    price: 17.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Historical Fiction", "Literary Fiction", "Social Commentary"]
  },
  {
    title: "The Water Dancer",
    author: "Ta-Nehisi Coates",
    description: "A novel about a young man with a mysterious power who becomes involved in the Underground Railroad.",
    isbn: "9780399590598",
    publishedYear: 2019,
    price: 18.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Historical Fiction", "Fantasy", "Social Commentary"]
  },
  {
    title: "The Testaments",
    author: "Margaret Atwood",
    description: "A sequel to The Handmaid's Tale, revealing the fates of the characters from the original novel.",
    isbn: "9780385543782",
    publishedYear: 2019,
    price: 17.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Dystopian", "Feminist Literature", "Science Fiction"]
  },
  {
    title: "The Institute",
    author: "Stephen King",
    description: "A horror novel about children with psychic abilities who are held captive in a mysterious facility.",
    isbn: "9781982110568",
    publishedYear: 2019,
    price: 19.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Horror", "Thriller", "Supernatural"]
  },
  {
    title: "The Dutch House",
    author: "Ann Patchett",
    description: "A novel about a brother and sister whose lives are shaped by their childhood home.",
    isbn: "9780062963674",
    publishedYear: 2019,
    price: 16.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Literary Fiction", "Family Drama", "Contemporary Fiction"]
  },
  {
    title: "The Shadow of the Wind",
    author: "Carlos Ruiz Zafón",
    description: "A gothic mystery novel set in post-war Barcelona about a young boy's discovery of a mysterious book.",
    isbn: "9780143034903",
    publishedYear: 2001,
    price: 16.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Mystery", "Gothic", "Literary Fiction"]
  },
  {
    title: "The Seven Husbands of Evelyn Hugo",
    author: "Taylor Jenkins Reid",
    description: "A captivating story about a reclusive Hollywood icon who finally decides to tell her life story.",
    isbn: "9781501139239",
    publishedYear: 2017,
    price: 16.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Fiction", "Historical Fiction", "Romance"]
  },
  {
    title: "Where the Crawdads Sing",
    author: "Delia Owens",
    description: "A mystery and coming-of-age story set in the marshes of North Carolina.",
    isbn: "9780735219090",
    publishedYear: 2018,
    price: 17.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Fiction", "Mystery", "Literary Fiction"]
  },
  {
    title: "The Silent Patient",
    author: "Alex Michaelides",
    description: "A psychological thriller about a woman who refuses to speak after allegedly murdering her husband.",
    isbn: "9781250301697",
    publishedYear: 2019,
    price: 16.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Thriller", "Psychological", "Mystery"]
  },
  {
    title: "Educated",
    author: "Tara Westover",
    description: "A memoir about a woman who grows up in a survivalist family and eventually earns a PhD from Cambridge.",
    isbn: "9780399590504",
    publishedYear: 2018,
    price: 17.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Memoir", "Biography", "Non-fiction"]
  },
  {
    title: "The Midnight Library",
    author: "Matt Haig",
    description: "A novel about a library between life and death where you can try out different versions of your life.",
    isbn: "9780525559474",
    publishedYear: 2020,
    price: 16.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Fiction", "Fantasy", "Philosophical"]
  },
  {
    title: "The Invisible Man",
    author: "Ralph Ellison",
    description: "A groundbreaking novel about an African American man's journey through a society that refuses to see him.",
    isbn: "9780679732761",
    publishedYear: 1952,
    price: 15.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Fiction", "African American Literature", "Social Commentary"]
  },
  {
    title: "The Handmaid's Tale",
    author: "Margaret Atwood",
    description: "A dystopian novel set in a totalitarian society where women are subjugated and used for reproduction.",
    isbn: "9780385490818",
    publishedYear: 1985,
    price: 15.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Dystopian", "Feminist Literature", "Science Fiction"]
  },
  {
    title: "The Alchemist",
    author: "Paulo Coelho",
    description: "A philosophical novel about a young Andalusian shepherd's journey to find treasure.",
    isbn: "9780061122415",
    publishedYear: 1988,
    price: 14.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Fiction", "Philosophical", "Adventure"]
  },
  {
    title: "The Book Thief",
    author: "Markus Zusak",
    description: "A story about a young girl in Nazi Germany who steals books and shares them with others.",
    isbn: "9780375831003",
    publishedYear: 2005,
    price: 16.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Historical Fiction", "Young Adult", "War"]
  },
  {
    title: "The Fault in Our Stars",
    author: "John Green",
    description: "A young adult novel about two teenagers who meet in a cancer support group and fall in love.",
    isbn: "9780525478812",
    publishedYear: 2012,
    price: 15.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Young Adult", "Romance", "Contemporary Fiction"]
  },
  {
    title: "The Help",
    author: "Kathryn Stockett",
    description: "A novel about African American maids working in white households in Jackson, Mississippi during the 1960s.",
    isbn: "9780425232200",
    publishedYear: 2009,
    price: 16.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Historical Fiction", "Social Commentary", "Women's Fiction"]
  },
  {
    title: "The Girl with the Dragon Tattoo",
    author: "Stieg Larsson",
    description: "A crime thriller about a journalist and a hacker investigating a decades-old disappearance.",
    isbn: "9780307269751",
    publishedYear: 2005,
    price: 16.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Thriller", "Crime", "Mystery"]
  },
  {
    title: "The Kite Runner",
    author: "Khaled Hosseini",
    description: "A powerful story of friendship, betrayal, and redemption set against the backdrop of Afghanistan.",
    isbn: "9781594631934",
    publishedYear: 2003,
    price: 17.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Literary Fiction", "Historical Fiction", "Drama"]
  },
  {
    title: "The Nightingale",
    author: "Kristin Hannah",
    description: "A historical fiction novel about two sisters in Nazi-occupied France during World War II.",
    isbn: "9780312577224",
    publishedYear: 2015,
    price: 16.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Historical Fiction", "War", "Family Drama"]
  },
  {
    title: "The Goldfinch",
    author: "Donna Tartt",
    description: "A coming-of-age novel about a boy who survives a terrorist attack and becomes involved in art theft.",
    isbn: "9780316055438",
    publishedYear: 2013,
    price: 18.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Literary Fiction", "Coming of Age", "Art"]
  },
  {
    title: "The Martian",
    author: "Andy Weir",
    description: "A science fiction novel about an astronaut stranded on Mars who must find a way to survive.",
    isbn: "9780553418027",
    publishedYear: 2011,
    price: 15.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Science Fiction", "Adventure", "Survival"]
  },
  {
    title: "The Girl on the Train",
    author: "Paula Hawkins",
    description: "A psychological thriller about a woman who becomes entangled in a missing person investigation.",
    isbn: "9781594634025",
    publishedYear: 2015,
    price: 16.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Thriller", "Psychological", "Mystery"]
  },
  {
    title: "The Underground Railroad",
    author: "Colson Whitehead",
    description: "A historical fiction novel that reimagines the Underground Railroad as an actual railroad system.",
    isbn: "9780385542365",
    publishedYear: 2016,
    price: 17.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Historical Fiction", "Literary Fiction", "Social Commentary"]
  },
  {
    title: "The Water Dancer",
    author: "Ta-Nehisi Coates",
    description: "A novel about a young man with a mysterious power who becomes involved in the Underground Railroad.",
    isbn: "9780399590598",
    publishedYear: 2019,
    price: 18.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Historical Fiction", "Fantasy", "Social Commentary"]
  },
  {
    title: "The Testaments",
    author: "Margaret Atwood",
    description: "A sequel to The Handmaid's Tale, revealing the fates of the characters from the original novel.",
    isbn: "9780385543782",
    publishedYear: 2019,
    price: 17.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Dystopian", "Feminist Literature", "Science Fiction"]
  },
  {
    title: "The Institute",
    author: "Stephen King",
    description: "A horror novel about children with psychic abilities who are held captive in a mysterious facility.",
    isbn: "9781982110568",
    publishedYear: 2019,
    price: 19.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Horror", "Thriller", "Supernatural"]
  },
  {
    title: "The Dutch House",
    author: "Ann Patchett",
    description: "A novel about a brother and sister whose lives are shaped by their childhood home.",
    isbn: "9780062963674",
    publishedYear: 2019,
    price: 16.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Literary Fiction", "Family Drama", "Contemporary Fiction"]
  },
  {
    title: "The Giver of Stars",
    author: "Jojo Moyes",
    description: "A historical fiction novel about the Pack Horse Library Project in Depression-era Kentucky.",
    isbn: "9780399562489",
    publishedYear: 2019,
    price: 17.99,
    coverImageUrl: "https://images-na.ssl-images-amazon.com/images/I/81aFt4+OTOL.jpg",
    genres: ["Historical Fiction", "Women's Fiction", "Adventure"]
  }
];

export async function seedBooks(): Promise<void> {
  try {
    logger.info('Starting book seeding...');

    // Clear existing data
    await prisma.review.deleteMany();
    await prisma.userFavorite.deleteMany();
    await prisma.bookGenre.deleteMany();
    await prisma.book.deleteMany();
    await prisma.genre.deleteMany();
    await prisma.user.deleteMany();

    // Create sample users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const users = await Promise.all([
      prisma.user.create({
        data: {
          email: 'admin@bookreview.com',
          passwordHash: hashedPassword,
          firstName: 'Admin',
          lastName: 'User',
          role: 'ADMIN'
        }
      }),
      prisma.user.create({
        data: {
          email: 'john@example.com',
          passwordHash: hashedPassword,
          firstName: 'John',
          lastName: 'Reader'
        }
      }),
      prisma.user.create({
        data: {
          email: 'sarah@example.com',
          passwordHash: hashedPassword,
          firstName: 'Sarah',
          lastName: 'Bookworm'
        }
      }),
      prisma.user.create({
        data: {
          email: 'mike@example.com',
          passwordHash: hashedPassword,
          firstName: 'Mike',
          lastName: 'Reviewer'
        }
      })
    ]);

    // Create genres
    const genreMap = new Map();
    const allGenres = [...new Set(sampleBooks.flatMap(book => book.genres))];
    
    for (const genreName of allGenres) {
      const genre = await prisma.genre.create({
        data: {
          name: genreName,
          description: `Books in the ${genreName} genre`
        }
      });
      genreMap.set(genreName, genre.id);
    }

    // Create books with genres and reviews
    const createdBooks = [];
    for (const bookData of sampleBooks) {
      const { genres, ...bookInfo } = bookData;
      
      // Check if book with this ISBN already exists
      const existingBook = await prisma.book.findUnique({
        where: { isbn: bookInfo.isbn }
      });
      
      if (existingBook) {
        console.log(`Book with ISBN ${bookInfo.isbn} already exists, skipping...`);
        continue;
      }
      
      const book = await prisma.book.create({
        data: bookInfo
      });
      createdBooks.push(book);

      // Add genres to book
      for (const genreName of genres) {
        await prisma.bookGenre.create({
          data: {
            bookId: book.id,
            genreId: genreMap.get(genreName)
          }
        });
      }

      // Add some random reviews
      const reviewCount = Math.floor(Math.random() * 5) + 1; // 1-5 reviews per book
      for (let i = 0; i < reviewCount; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const rating = Math.floor(Math.random() * 5) + 1; // 1-5 stars
        
        const reviewTexts = [
          "Great book! Highly recommended.",
          "Interesting read, but not my favorite.",
          "Amazing storytelling and character development.",
          "Couldn't put it down!",
          "Well-written but slow-paced.",
          "Fantastic plot twists and engaging narrative.",
          "Good book overall, worth reading.",
          "Not what I expected, but still enjoyable.",
          "Brilliant writing style and compelling story.",
          "A must-read for any book lover!"
        ];

        // Check if review already exists to avoid duplicates
        const existingReview = await prisma.review.findFirst({
          where: {
            bookId: book.id,
            userId: randomUser.id
          }
        });

        if (!existingReview) {
          await prisma.review.create({
            data: {
              bookId: book.id,
              userId: randomUser.id,
              rating: rating,
              reviewText: reviewTexts[Math.floor(Math.random() * reviewTexts.length)]
            }
          });
        }
      }
    }

    logger.info(`Successfully seeded ${sampleBooks.length} books with genres and reviews`);
    logger.info(`Created ${users.length} users and ${allGenres.length} genres`);
  } catch (error) {
    logger.error('Error seeding books:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedBooks()
    .then(() => {
      logger.info('Book seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Book seeding failed:', error);
      process.exit(1);
    });
}