import { GeminiService } from '../../services/geminiService';
import { config } from '../../config/config';

// Mock GoogleGenerativeAI
const mockGenerateContent = vi.fn();
const mockGenerateText = vi.fn();
const mockGenerateJSON = vi.fn();

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn(() => ({
    getGenerativeModel: vi.fn(() => ({
      generateContent: mockGenerateContent,
      generateText: mockGenerateText,
      generateJSON: mockGenerateJSON,
    })),
  })),
}));

// Mock config
vi.mock('../../config/config', () => ({
  config: {
    geminiApiKey: 'test-api-key',
    geminiModel: 'gemini-1.5-pro',
  },
}));

describe('GeminiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateText', () => {
    it('should generate text successfully', async () => {
      const mockResponse = {
        response: {
          text: () => 'Generated text response',
        },
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await GeminiService.generateText('Test prompt');

      expect(result).toBe('Generated text response');
      expect(mockGenerateContent).toHaveBeenCalledWith('Test prompt');
    });

    it('should handle errors gracefully', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      await expect(GeminiService.generateText('Test prompt')).rejects.toThrow('API Error');
    });
  });

  describe('generateJSON', () => {
    it('should generate JSON successfully', async () => {
      const mockResponse = {
        response: {
          text: () => '{"result": "success"}',
        },
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await GeminiService.generateJSON('Test prompt');

      expect(result).toEqual({ result: 'success' });
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.stringContaining('Test prompt'));
    });

    it('should handle invalid JSON gracefully', async () => {
      const mockResponse = {
        response: {
          text: () => 'invalid json',
        },
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      await expect(GeminiService.generateJSON('Test prompt')).rejects.toThrow();
    });

    it('should handle API errors', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      await expect(GeminiService.generateJSON('Test prompt')).rejects.toThrow('API Error');
    });
  });

  describe('generateRecommendations', () => {
    it('should generate recommendations successfully', async () => {
      const mockResponse = {
        response: {
          text: () => '{"books": [{"id": "1", "title": "Test Book"}], "explanation": "Based on your preferences"}',
        },
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      const request = { userId: 'user-123', limit: 5, context: 'Test context' };
      const result = await GeminiService.generateRecommendations(request);

      expect(result).toBeDefined();
      expect(result.books).toBeDefined();
      expect(result.explanation).toBeDefined();
    });

    it('should handle errors gracefully with fallback', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      const request = { userId: 'user-123', limit: 5, context: 'Test context' };
      const result = await GeminiService.generateRecommendations(request);

      expect(result).toBeDefined();
      expect(result.books).toEqual([]);
      expect(result.explanation).toBe('No recommendations available');
    });
  });

  describe('findSimilarBooks', () => {
    it('should find similar books successfully', async () => {
      const mockResponse = {
        response: {
          text: () => '{"books": [{"id": "2", "title": "Similar Book"}], "explanation": "Based on genre and themes"}',
        },
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      const request = { bookId: 'book-123', limit: 5 };
      const result = await GeminiService.findSimilarBooks(request);

      expect(result).toBeDefined();
      expect(result.books).toBeDefined();
      expect(result.explanation).toBeDefined();
    });

    it('should handle errors gracefully with fallback', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      const request = { bookId: 'book-123', limit: 5 };
      const result = await GeminiService.findSimilarBooks(request);

      expect(result).toBeDefined();
      expect(result.books).toEqual([]);
      expect(result.explanation).toBe('No recommendations available');
    });
  });

  describe('analyzeReview', () => {
    it('should analyze review successfully', async () => {
      const mockResponse = {
        response: {
          text: () => '{"sentiment": "positive", "themes": ["adventure"], "quality": 0.8, "summary": "Great book!"}',
        },
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await GeminiService.analyzeReview('This is a great book!');

      expect(result).toBeDefined();
      expect(mockGenerateContent).toHaveBeenCalled();
    });

    it('should handle errors gracefully with fallback', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      const result = await GeminiService.analyzeReview('This is a great book!');

      expect(result).toBeDefined();
      expect(result.quality).toBe(0.5);
      expect(result.sentiment).toBe('neutral');
      expect(result.summary).toBe('Analysis failed');
      expect(result.themes).toEqual([]);
    });
  });

  describe('moderateContent', () => {
    it('should moderate content successfully', async () => {
      const mockResponse = {
        response: {
          text: () => '{"isAppropriate": true, "confidence": 0.9, "reasoning": "Content is appropriate"}',
        },
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await GeminiService.moderateContent('This is appropriate content', 'review');

      expect(result).toBeDefined();
      expect(mockGenerateContent).toHaveBeenCalled();
    });

    it('should handle errors gracefully with fallback', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      const result = await GeminiService.moderateContent('This is appropriate content', 'review');

      expect(result).toBeDefined();
      expect(result.isAppropriate).toBe(true);
      expect(result.confidence).toBe(0.3);
      expect(result.reasons).toEqual(['AI analysis failed']);
      expect(result.suggestedAction).toBe('approve');
    });
  });
});
