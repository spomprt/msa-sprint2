import fetch from 'node-fetch';
import { UserBlacklistedError, UserInactiveError, UserUnauthorizedError, InsufficientPermissionsError } from './auth-errors.js';

export class ACLService {
  // URL внешнего API пользователей (можно настроить через переменные окружения)
  static USER_API_BASE_URL = process.env.USER_API_BASE_URL || 'http://hotelio-monolith:8080';
  
  /**
   * Проверяет авторизацию пользователя (перенесено из hotel-subgraph)
   * @param {string} userId - ID пользователя из заголовка X-User-ID
   * @returns {Promise<Object>} объект с результатом авторизации и деталями
   */
  static async checkUserAuthorization(userId) {
    console.log(`🔐 [AUTH] Starting authorization check for user: ${userId}`);
    
    if (!userId) {
      console.log(`❌ [AUTH] User ID is missing`);
      return {
        authorized: false,
        status: 401,
        error: 'User ID header X-User-ID is required',
        reason: 'MISSING_USER_ID'
      };
    }
    
    try {
      const authUrl = `${this.USER_API_BASE_URL}/api/users/${userId}/authorized`;
      console.log(`🔐 [AUTH] Calling authorization endpoint: ${authUrl}`);
      
      const response = await fetch(authUrl);
      console.log(`🔐 [AUTH] Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        console.warn(`⚠️ [AUTH] Authorization check failed for user ${userId}: HTTP ${response.status}`);
        return {
          authorized: false,
          status: response.status === 404 ? 401 : response.status,
          error: `User authorization check failed: HTTP ${response.status}`,
          reason: response.status === 404 ? 'USER_NOT_FOUND' : 'AUTHORIZATION_CHECK_FAILED'
        };
      }
      
      const isAuthorized = await response.json();
      console.log(`🔐 [AUTH] Raw authorization response for user ${userId}: ${isAuthorized}`);
      
      if (!isAuthorized) {
        console.log(`❌ [AUTH] User ${userId} is NOT authorized`);
        return {
          authorized: false,
          status: 401, // Всегда 401 для неавторизованных пользователей
          error: 'User is not authorized to access hotel information',
          reason: 'USER_NOT_AUTHORIZED'
        };
      }
      
      console.log(`✅ [AUTH] User ${userId} is authorized`);
      return {
        authorized: true,
        status: 200,
        error: null,
        reason: null
      };
      
    } catch (error) {
      console.error(`❌ [AUTH] Error checking user authorization for user ${userId}:`, error);
      return {
        authorized: false,
        status: 500,
        error: `Authorization service error: ${error.message}`,
        reason: 'SERVICE_ERROR'
      };
    }
  }

  /**
   * Получает информацию о пользователе по ID
   * @param {string} userId - ID пользователя
   * @returns {Promise<Object|null>} информация о пользователе или null если не найден
   */
  static async getUserById(userId) {
    try {
      const response = await fetch(`${this.USER_API_BASE_URL}/api/users/${userId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log(`User with ID ${userId} not found`);
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const user = await response.json();
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        city: user.city,
        status: user.status,
        blacklisted: user.blacklisted || false,
        active: user.active || false
      };
      
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error);
      return null;
    }
  }
  
  /**
   * Проверяет, заблокирован ли пользователь
   * @param {string} userId - ID пользователя
   * @returns {Promise<boolean>} true если пользователь заблокирован
   */
  static async isUserBlacklisted(userId) {
    try {
      const response = await fetch(`${this.USER_API_BASE_URL}/api/users/${userId}/blacklisted`);
      
      if (!response.ok) {
        console.warn(`Failed to check blacklist status for user ${userId}`);
        return true; // по умолчанию считаем заблокированным
      }
      
      return await response.json();
      
    } catch (error) {
      console.error(`Error checking blacklist status for user ${userId}:`, error);
      return true; // по умолчанию считаем заблокированным
    }
  }
  
  /**
   * Проверяет, активен ли пользователь
   * @param {string} userId - ID пользователя
   * @returns {Promise<boolean>} true если пользователь активен
   */
  static async isUserActive(userId) {
    try {
      const response = await fetch(`${this.USER_API_BASE_URL}/api/users/${userId}/active`);
      
      if (!response.ok) {
        console.warn(`Failed to check active status for user ${userId}`);
        return false; // по умолчанию считаем неактивным
      }
      
      return await response.json();
      
    } catch (error) {
      console.error(`Error checking active status for user ${userId}:`, error);
      return false; // по умолчанию считаем неактивным
    }
  }
  
  /**
   * Проверяет, авторизован ли пользователь
   * @param {string} userId - ID пользователя
   * @returns {Promise<boolean>} true если пользователь авторизован
   */
  static async isUserAuthorized(userId) {
    try {
      const response = await fetch(`${this.USER_API_BASE_URL}/api/users/${userId}/authorized`);
      
      if (!response.ok) {
        console.warn(`Failed to check authorization status for user ${userId}`);
        return false; // по умолчанию считаем неавторизованным
      }
      
      return await response.json();
      
    } catch (error) {
      console.error(`Error checking authorization status for user ${userId}:`, error);
      return false; // по умолчанию считаем неавторизованным
    }
  }
  
  /**
   * Проверяет, является ли пользователь VIP
   * @param {string} userId - ID пользователя
   * @returns {Promise<boolean>} true если пользователь VIP
   */
  static async isUserVip(userId) {
    try {
      const response = await fetch(`${this.USER_API_BASE_URL}/api/users/${userId}/vip`);
      
      if (!response.ok) {
        console.warn(`Failed to check VIP status for user ${userId}`);
        return false; // по умолчанию считаем не VIP
      }
      
      return await response.json();
      
    } catch (error) {
      console.error(`Error checking VIP status for user ${userId}:`, error);
      return false; // по умолчанию считаем не VIP
    }
  }
  
  /**
   * Получает статус пользователя
   * @param {string} userId - ID пользователя
   * @returns {Promise<string|null>} статус пользователя или null если не найден
   */
  static async getUserStatus(userId) {
    try {
      const response = await fetch(`${this.USER_API_BASE_URL}/api/users/${userId}/status`);
      
      if (!response.ok) {
        console.warn(`Failed to get status for user ${userId}`);
        return null;
      }
      
      return await response.text();
      
    } catch (error) {
      console.error(`Error getting status for user ${userId}:`, error);
      return null;
    }
  }
  
  /**
   * Комплексная проверка доступа пользователя
   * @param {string} userId - ID пользователя
   * @returns {Promise<Object>} объект с результатами проверок
   */
  static async checkUserAccess(userId) {
    try {
      const [blacklisted, active, authorized, vip, status] = await Promise.allSettled([
        this.isUserBlacklisted(userId),
        this.isUserActive(userId),
        this.isUserAuthorized(userId),
        this.isUserVip(userId),
        this.getUserStatus(userId)
      ]);
      
      return {
        userId,
        blacklisted: blacklisted.status === 'fulfilled' ? blacklisted.value : true,
        active: active.status === 'fulfilled' ? active.value : false,
        authorized: authorized.status === 'fulfilled' ? authorized.value : false,
        vip: vip.status === 'fulfilled' ? vip.value : false,
        status: status.status === 'fulfilled' ? status.value : 'UNKNOWN',
        canAccess: false // будет вычислено ниже
      };
    } catch (error) {
      console.error(`Error checking user access for ${userId}:`, error);
      return {
        userId,
        blacklisted: true,
        active: false,
        authorized: false,
        vip: false,
        status: 'ERROR',
        canAccess: false
      };
    }
  }
  
  /**
   * Проверяет, может ли пользователь получить доступ к ресурсу
   * @param {string} userId - ID пользователя
   * @param {string} resourceType - тип ресурса (bookings, hotels, etc.)
   * @param {string} action - действие (read, write, delete)
   * @param {Object} context - дополнительный контекст (например, requestedUserId)
   * @returns {Promise<boolean>} true если доступ разрешен
   */
  static async canAccessResource(userId, resourceType, action = 'read', context = {}) {
    try {
      const accessInfo = await this.checkUserAccess(userId);
      
      // Используем логику монолита: пользователь авторизован если активен И не заблокирован
      if (accessInfo.blacklisted) {
        console.log(`❌ Access denied: User ${userId} is blacklisted`);
        throw new UserBlacklistedError(userId);
      }
      
      if (!accessInfo.active) {
        console.log(`❌ Access denied: User ${userId} is not active`);
        throw new UserInactiveError(userId);
      }
      
      // Дополнительная проверка через монолит
      const isAuthorized = await this.isUserAuthorized(userId);
      if (!isAuthorized) {
        console.log(`❌ Access denied: User ${userId} is not authorized according to monolith`);
        throw new UserUnauthorizedError(userId);
      }
      
      // Специфичные для ресурса проверки
      switch (resourceType) {
        case 'bookings':
          // Для бронирований проверяем, что пользователь запрашивает свои данные
          if (context.requestedUserId && context.requestedUserId !== userId) {
            console.log(`❌ Access denied: User ${userId} cannot access bookings for user ${context.requestedUserId}`);
            throw new InsufficientPermissionsError(userId, 'bookings', 'read');
          }
          accessInfo.canAccess = true;
          break;
          
        case 'hotels':
          // Для отелей нужна базовая авторизация
          accessInfo.canAccess = true;
          break;
          
        case 'admin':
          // Для админ функций нужен VIP статус
          accessInfo.canAccess = accessInfo.vip;
          break;
          
        default:
          accessInfo.canAccess = true;
      }
      
      if (accessInfo.canAccess) {
        console.log(`✅ Access granted: User ${userId} can ${action} ${resourceType}`);
      } else {
        console.log(`❌ Access denied: User ${userId} cannot ${action} ${resourceType}`);
      }
      
      return accessInfo.canAccess;
      
    } catch (error) {
      console.error(`Error checking resource access for user ${userId}:`, error);
      return false;
    }
  }
}
