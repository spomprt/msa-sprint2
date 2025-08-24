import jwt from 'jsonwebtoken';

// В продакшене секретный ключ должен быть в переменных окружения
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export class AuthService {
  /**
   * Проверяет JWT токен и извлекает userId
   * @param {string} token - JWT токен из заголовка Authorization
   * @returns {string|null} userId или null если токен невалиден
   */
  static verifyToken(token) {
    try {
      if (!token || !token.startsWith('Bearer ')) {
        return null;
      }
      
      const actualToken = token.replace('Bearer ', '');
      const decoded = jwt.verify(actualToken, JWT_SECRET);
      
      return decoded.userId || decoded.sub;
    } catch (error) {
      console.error('Token verification failed:', error.message);
      return null;
    }
  }

  /**
   * Проверяет, может ли пользователь получить доступ к бронированиям
   * @param {string} authenticatedUserId - ID аутентифицированного пользователя
   * @param {string} requestedUserId - ID пользователя, чьи бронирования запрашиваются
   * @returns {boolean} true если доступ разрешен
   */
  static canAccessBookings(authenticatedUserId, requestedUserId) {
    if (!authenticatedUserId || !requestedUserId) {
      return false;
    }
    
    // Пользователь может видеть только свои бронирования
    return authenticatedUserId === requestedUserId;
  }

  /**
   * Извлекает токен из заголовков запроса
   * @param {Object} req - объект запроса
   * @returns {string|null} токен или null
   */
  static extractTokenFromHeaders(req) {
    if (!req || !req.headers) {
      return null;
    }
    
    return req.headers.authorization || req.headers.Authorization;
  }
}
