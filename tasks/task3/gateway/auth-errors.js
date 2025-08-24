import { GraphQLError } from 'graphql';

/**
 * Ошибка - отсутствует обязательный заголовок X-User-ID
 */
export class MissingUserIdHeaderError extends GraphQLError {
  constructor() {
    super(
      'Missing required header X-User-ID. This header is mandatory for all requests.',
      {
        extensions: {
          code: 'BAD_REQUEST',
          http: { status: 400 },
          reason: 'MISSING_USER_ID_HEADER',
          requiredHeader: 'X-User-ID'
        }
      }
    );
  }
}

/**
 * Ошибка доступа - пользователь заблокирован
 */
export class UserBlacklistedError extends GraphQLError {
  constructor(userId) {
    super(
      `User ${userId} is blacklisted and cannot access resources`,
      {
        extensions: {
          code: 'FORBIDDEN',
          http: { status: 403 },
          reason: 'USER_BLACKLISTED',
          userId: userId
        }
      }
    );
  }
}

/**
 * Ошибка доступа - пользователь неактивен
 */
export class UserInactiveError extends GraphQLError {
  constructor(userId) {
    super(
      `User ${userId} is not active and cannot access resources`,
      {
        extensions: {
          code: 'FORBIDDEN',
          http: { status: 403 },
          reason: 'USER_INACTIVE',
          userId: userId
        }
      }
    );
  }
}

/**
 * Ошибка доступа - пользователь не авторизован
 */
export class UserUnauthorizedError extends GraphQLError {
  constructor(userId) {
    super(
      `User ${userId} is not authorized to access this resource`,
      {
        extensions: {
          code: 'FORBIDDEN',
          http: { status: 403 },
          reason: 'USER_UNAUTHORIZED',
          userId: userId
        }
      }
    );
  }
}

/**
 * Ошибка доступа - недостаточно прав для ресурса
 */
export class InsufficientPermissionsError extends GraphQLError {
  constructor(userId, resourceType, action) {
    super(
      `User ${userId} does not have sufficient permissions to ${action} ${resourceType}`,
      {
        extensions: {
          code: 'FORBIDDEN',
          http: { status: 403 },
          reason: 'INSUFFICIENT_PERMISSIONS',
          userId: userId,
          resourceType: resourceType,
          action: action
        }
      }
    );
  }
}

