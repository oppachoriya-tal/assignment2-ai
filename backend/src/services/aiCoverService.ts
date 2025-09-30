import { logger } from '../utils/logger';
import { prisma } from '../config/database';

export interface BookCoverRequest {
  title: string;
  author: string;
  genre?: string;
  description?: string;
  style?: 'realistic' | 'illustrated' | 'minimalist' | 'vintage' | 'modern';
}

export interface GeneratedCover {
  imageUrl: string;
  prompt: string;
  style: string;
  generatedAt: Date;
}

export class AICoverService {
  private static readonly GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  private static readonly COVER_CACHE = new Map<string, GeneratedCover>();

  /**
   * Generate a book cover using AI
   */
  static async generateBookCover(request: BookCoverRequest): Promise<GeneratedCover> {
    try {
      // Create cache key
      const cacheKey = `${request.title}-${request.author}-${request.style || 'realistic'}`;
      
      // Check cache first
      if (this.COVER_CACHE.has(cacheKey)) {
        logger.info('Returning cached cover for:', cacheKey);
        return this.COVER_CACHE.get(cacheKey)!;
      }

      // Generate prompt for cover
      const prompt = this.createCoverPrompt(request);
      
      // For demo purposes, we'll generate a placeholder image URL
      // In a real implementation, you would call an AI image generation service
      const cover = await this.generatePlaceholderCover(request, prompt);
      
      // Cache the result
      this.COVER_CACHE.set(cacheKey, cover);
      
      logger.info('Generated new book cover for:', request.title);
      return cover;
    } catch (error) {
      logger.error('Error generating book cover:', error);
      throw new Error('Failed to generate book cover');
    }
  }

  /**
   * Create a detailed prompt for cover generation
   */
  private static createCoverPrompt(request: BookCoverRequest): string {
    const style = request.style || 'realistic';
    const genre = request.genre || 'general fiction';
    
    let prompt = `Book cover for "${request.title}" by ${request.author}. `;
    prompt += `Genre: ${genre}. `;
    prompt += `Style: ${style}. `;
    
    if (request.description) {
      // Extract key themes from description
      const themes = this.extractThemes(request.description);
      if (themes.length > 0) {
        prompt += `Themes: ${themes.join(', ')}. `;
      }
    }
    
    // Add style-specific instructions
    switch (style) {
      case 'realistic':
        prompt += 'Photorealistic style with detailed imagery.';
        break;
      case 'illustrated':
        prompt += 'Illustrated style with artistic interpretation.';
        break;
      case 'minimalist':
        prompt += 'Minimalist design with clean lines and simple elements.';
        break;
      case 'vintage':
        prompt += 'Vintage book cover style with classic typography.';
        break;
      case 'modern':
        prompt += 'Modern design with contemporary aesthetics.';
        break;
    }
    
    return prompt;
  }

  /**
   * Extract themes from book description
   */
  private static extractThemes(description: string): string[] {
    const themes = [];
    const lowerDesc = description.toLowerCase();
    
    // Common theme keywords
    const themeKeywords = {
      'love': ['love', 'romance', 'relationship', 'heart'],
      'adventure': ['adventure', 'journey', 'quest', 'explore'],
      'mystery': ['mystery', 'secret', 'hidden', 'clue'],
      'fantasy': ['magic', 'fantasy', 'wizard', 'dragon'],
      'science fiction': ['space', 'future', 'robot', 'alien'],
      'horror': ['horror', 'scary', 'fear', 'monster'],
      'history': ['historical', 'past', 'ancient', 'war'],
      'philosophy': ['philosophy', 'meaning', 'existence', 'truth']
    };
    
    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      if (keywords.some(keyword => lowerDesc.includes(keyword))) {
        themes.push(theme);
      }
    }
    
    return themes.slice(0, 3); // Limit to 3 themes
  }

  /**
   * Generate placeholder cover (for demo purposes)
   * In a real implementation, this would call an AI image generation service
   */
  private static async generatePlaceholderCover(request: BookCoverRequest, prompt: string): Promise<GeneratedCover> {
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate a placeholder image URL based on book characteristics
    const style = request.style || 'realistic';
    const genre = request.genre || 'general';
    
    // Create a unique identifier for the book
    const bookId = this.createBookId(request.title, request.author);
    
    // Generate placeholder image URL (using a service like placeholder.com or similar)
    const imageUrl = this.generatePlaceholderImageUrl(bookId, style, genre);
    
    return {
      imageUrl,
      prompt,
      style,
      generatedAt: new Date()
    };
  }

  /**
   * Create a unique book ID for image generation
   */
  private static createBookId(title: string, author: string): string {
    const combined = `${title}-${author}`.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Create a hash-like ID
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Generate placeholder image URL
   */
  private static generatePlaceholderImageUrl(bookId: string, style: string, genre: string): string {
    // Use a placeholder service that can generate images based on parameters
    const baseUrl = 'https://picsum.photos';
    const width = 300;
    const height = 400;
    
    // Use bookId as seed for consistent images
    const seed = bookId.substring(0, 8);
    
    // Add style and genre as filters
    const filters = [];
    if (style === 'vintage') filters.push('sepia');
    if (genre.includes('horror')) filters.push('dark');
    if (genre.includes('romance')) filters.push('warm');
    
    let url = `${baseUrl}/${width}/${height}?random=${seed}`;
    if (filters.length > 0) {
      url += `&${filters.join('&')}`;
    }
    
    return url;
  }

  /**
   * Get available cover styles
   */
  static getAvailableStyles(): string[] {
    return ['realistic', 'illustrated', 'minimalist', 'vintage', 'modern'];
  }

  /**
   * Generate multiple cover options for a book
   */
  static async generateCoverOptions(request: BookCoverRequest): Promise<GeneratedCover[]> {
    const styles = this.getAvailableStyles();
    const options: GeneratedCover[] = [];
    
    for (const style of styles.slice(0, 3)) { // Generate 3 options
      const styleRequest = { ...request, style: style as any };
      const cover = await this.generateBookCover(styleRequest);
      options.push(cover);
    }
    
    return options;
  }

  /**
   * Check if Gemini AI is available for AI features
   */
  static async checkGeminiStatus(): Promise<boolean> {
    try {
      if (!this.GEMINI_API_KEY) {
        return false;
      }
      
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(this.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      
      await model.generateContent('test');
      return true;
    } catch (error) {
      logger.error('Gemini not available:', error);
      return false;
    }
  }

  /**
   * Apply AI-generated cover to a book
   */
  static async applyCoverToBook(bookId: string, coverImageUrl: string): Promise<boolean> {
    try {
      await prisma.book.update({
        where: { id: bookId },
        data: { coverImageUrl }
      });
      
      logger.info(`Applied AI cover to book ${bookId}`);
      return true;
    } catch (error) {
      logger.error('Error applying cover to book:', error);
      return false;
    }
  }

  /**
   * Generate and apply AI cover to a book automatically
   */
  static async generateAndApplyCover(bookId: string, style: string = 'realistic'): Promise<GeneratedCover | null> {
    try {
      // Get book details
      const book = await prisma.book.findUnique({
        where: { id: bookId },
        include: {
          genres: {
            include: {
              genre: true
            }
          }
        }
      });

      if (!book) {
        throw new Error('Book not found');
      }

      // Get genres
      const genres = book.genres.map(bg => bg.genre.name);
      const primaryGenre = genres[0] || 'Fiction';

      // Generate cover
      const cover = await this.generateBookCover({
        title: book.title,
        author: book.author,
        genre: primaryGenre,
        description: book.description || '',
        style: style as any
      });

      // Apply cover to book
      await this.applyCoverToBook(bookId, cover.imageUrl);

      return cover;
    } catch (error) {
      logger.error('Error generating and applying cover:', error);
      return null;
    }
  }

  /**
   * Get AI service statistics
   */
  static getServiceStats(): any {
    return {
      cachedCovers: this.COVER_CACHE.size,
      availableStyles: this.getAvailableStyles().length,
      serviceStatus: 'operational'
    };
  }
}
