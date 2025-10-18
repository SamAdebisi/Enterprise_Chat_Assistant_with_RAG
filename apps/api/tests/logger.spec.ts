import { logger } from '../src/services/logger.js';

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
const mockConsoleDebug = jest.spyOn(console, 'debug').mockImplementation();

describe('Logger Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleWarn.mockRestore();
    mockConsoleError.mockRestore();
    mockConsoleDebug.mockRestore();
  });

  describe('Basic logging methods', () => {
    it('should log info messages', () => {
      logger.info('Test message');
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('"level":"info"')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('"message":"Test message"')
      );
    });

    it('should log warn messages', () => {
      logger.warn('Warning message');
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('"level":"warn"')
      );
    });

    it('should log error messages', () => {
      logger.error('Error message');
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('"level":"error"')
      );
    });

    it('should log debug messages in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      logger.debug('Debug message');
      expect(mockConsoleDebug).toHaveBeenCalledWith(
        expect.stringContaining('"level":"debug"')
      );
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should not log debug messages in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      logger.debug('Debug message');
      expect(mockConsoleDebug).not.toHaveBeenCalled();
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Context logging', () => {
    it('should include context in log entries', () => {
      const context = { userId: '123', operation: 'test' };
      logger.info('Test message', context);
      
      const logCall = mockConsoleLog.mock.calls[0][0];
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.context).toEqual(context);
    });
  });

  describe('Request logging helpers', () => {
    it('should log request start', () => {
      logger.requestStart('GET', '/test', 'req-123');
      
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('"operation":"request_start"')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('"requestId":"req-123"')
      );
    });

    it('should log request end', () => {
      logger.requestEnd('GET', '/test', 'req-123', 200, 150);
      
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('"operation":"request_end"')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('"statusCode":200')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('"duration":150')
      );
    });
  });

  describe('Chat logging helpers', () => {
    it('should log chat start', () => {
      logger.chatStart('user-123', 'chat-456', 'What is AI?');
      
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('"operation":"chat_start"')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('"userId":"user-123"')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('"chatId":"chat-456"')
      );
    });

    it('should log chat end with success', () => {
      logger.chatEnd('user-123', 'chat-456', true, 2000);
      
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('"operation":"chat_end"')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('"success":true')
      );
    });

    it('should log chat end with error', () => {
      const error = new Error('Test error');
      logger.chatEnd('user-123', 'chat-456', false, 2000, error);
      
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('"success":false')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('"error":')
      );
    });
  });

  describe('Document logging helpers', () => {
    it('should log document upload', () => {
      logger.documentUpload('user-123', 'test.pdf', ['sales'], 5);
      
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('"operation":"document_upload"')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('"filename":"test.pdf"')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('"chunks":5')
      );
    });
  });

  describe('Error logging', () => {
    it('should log errors with stack traces', () => {
      const error = new Error('Test error');
      logger.logError(error, { userId: '123' });
      
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('"level":"error"')
      );
      
      const logCall = mockConsoleError.mock.calls[0][0];
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.context.error).toEqual({
        name: 'Error',
        message: 'Test error',
        stack: expect.any(String)
      });
    });
  });
});
