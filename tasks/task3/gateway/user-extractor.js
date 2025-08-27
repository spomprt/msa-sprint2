import { parse } from 'graphql';

export class UserExtractor {
  /**
   * Извлекает userId из HTTP заголовка X-User-ID
   * @param {Object} req - объект запроса
   * @returns {string|null} userId или null если заголовок отсутствует
   */
  static extractUserIdFromHeaders(req) {
    try {
      if (!req || !req.headers) {
        return null;
      }
      
      const userId = req.headers['x-user-id'] || req.headers['X-User-ID'];
      if (userId) {
        console.log(`🔐 Extracted userId from header: ${userId}`);
        return userId;
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting userId from header:', error.message);
      return null;
    }
  }

  /**
   * Извлекает userId из HTTP заголовка или GraphQL запроса
   * @param {string} query - GraphQL запрос
   * @param {Object} variables - переменные запроса
   * @param {Object} req - объект запроса (для заголовков)
   * @returns {string|null} userId или null если не найден
   */
  static extractUserId(query, variables = {}, req = null) {
    // Заголовок X-User-ID теперь обязателен
    if (req) {
      const userIdFromHeader = this.extractUserIdFromHeaders(req);
      if (userIdFromHeader) {
        return userIdFromHeader;
      }
    }
    
    // Если заголовка нет, возвращаем null (заголовок обязателен)
    return null;
  }

  /**
   * Извлекает userId из GraphQL запроса
   * @param {string} query - GraphQL запрос
   * @param {Object} variables - переменные запроса
   * @returns {string|null} userId или null если не найден
   */
  static extractUserIdFromQuery(query, variables = {}) {
    try {
      // Парсим GraphQL запрос
      const parsedQuery = parse(query);
      
      // Ищем аргументы в запросах и мутациях
      const userId = this.extractFromSelections(parsedQuery.definitions, variables);
      
      if (userId) {
        console.log(`🔍 Extracted userId from query: ${userId}`);
        return userId;
      }
      
      console.log('🔍 No userId found in query');
      return null;
      
    } catch (error) {
      console.error('Error parsing GraphQL query:', error);
      return null;
    }
  }
  
  /**
   * Рекурсивно извлекает userId из селекций GraphQL
   * @param {Array} definitions - определения GraphQL
   * @param {Object} variables - переменные запроса
   * @returns {string|null} userId или null если не найден
   */
  static extractFromSelections(definitions, variables) {
    for (const definition of definitions) {
      if (definition.operation === 'query' || definition.operation === 'mutation') {
        const userId = this.extractFromSelectionSet(definition.selectionSet, variables);
        if (userId) return userId;
      }
    }
    return null;
  }
  
  /**
   * Извлекает userId из набора селекций
   * @param {Object} selectionSet - набор селекций
   * @param {Object} variables - переменные запроса
   * @returns {string|null} userId или null если не найден
   */
  static extractFromSelectionSet(selectionSet, variables) {
    if (!selectionSet || !selectionSet.selections) {
      return null;
    }
    
    for (const selection of selectionSet.selections) {
      // Проверяем аргументы
      if (selection.arguments) {
        const userId = this.extractFromArguments(selection.arguments, variables);
        if (userId) return userId;
      }
      
      // Рекурсивно проверяем вложенные селекции
      if (selection.selectionSet) {
        const userId = this.extractFromSelectionSet(selection.selectionSet, variables);
        if (userId) return userId;
      }
    }
    
    return null;
  }
  
  /**
   * Извлекает userId из аргументов
   * @param {Array} args - аргументы GraphQL
   * @param {Object} variables - переменные запроса
   * @returns {string|null} userId или null если не найден
   */
  static extractFromArguments(args, variables) {
    for (const arg of args) {
      if (arg.name.value === 'userId') {
        return this.extractValue(arg.value, variables);
      }
      
      if (arg.name.value === 'input' && arg.value.kind === 'ObjectValue') {
        const userId = this.extractFromObjectValue(arg.value, variables);
        if (userId) return userId;
      }
    }
    return null;
  }
  
  /**
   * Извлекает userId из объекта input
   * @param {Object} objectValue - объект GraphQL
   * @param {Object} variables - переменные запроса
   * @returns {string|null} userId или null если не найден
   */
  static extractFromObjectValue(objectValue, variables) {
    if (!objectValue.fields) {
      return null;
    }
    
    for (const field of objectValue.fields) {
      if (field.name.value === 'userId') {
        return this.extractValue(field.value, variables);
      }
    }
    
    return null;
  }
  
  /**
   * Извлекает значение из GraphQL значения
   * @param {Object} value - GraphQL значение
   * @param {Object} variables - переменные запроса
   * @returns {string|null} значение или null если не найдено
   */
  static extractValue(value, variables) {
    switch (value.kind) {
      case 'StringValue':
        return value.value;
        
      case 'Variable':
        return variables[value.name.value] || null;
        
      default:
        return null;
    }
  }
  
  /**
   * Проверяет, содержит ли запрос определенные поля
   * @param {string} query - GraphQL запрос
   * @param {Array} fields - массив полей для поиска
   * @returns {boolean} true если содержит хотя бы одно поле
   */
  static containsFields(query, fields) {
    try {
      const parsedQuery = parse(query);
      
      // Ищем поля в определениях GraphQL
      for (const definition of parsedQuery.definitions) {
        if (definition.operation === 'query' || definition.operation === 'mutation') {
          if (definition.selectionSet && definition.selectionSet.selections) {
            for (const selection of definition.selectionSet.selections) {
              const fieldName = selection.name.value;
              if (fields.includes(fieldName)) {
                console.log(`🔍 Found field: ${fieldName} in query`);
                return true;
              }
            }
          }
        }
      }
      
      console.log(`🔍 No matching fields found. Available fields: ${fields.join(', ')}`);
      return false;
      
    } catch (error) {
      console.error('Error checking fields in query:', error);
      return false;
    }
  }
  
  /**
   * Определяет тип операции GraphQL
   * @param {string} query - GraphQL запрос
   * @returns {string} тип операции (query, mutation, subscription)
   */
  static getOperationType(query) {
    try {
      const parsedQuery = parse(query);
      
      if (parsedQuery.definitions.length > 0) {
        return parsedQuery.definitions[0].operation || 'query';
      }
      
      return 'query';
      
    } catch (error) {
      console.error('Error getting operation type:', error);
      return 'query';
    }
  }

  /**
   * Извлекает requestedUserId из GraphQL запроса (для проверки доступа к чужим данным)
   * @param {string} query - GraphQL запрос
   * @param {Object} variables - переменные запроса
   * @returns {string|null} requestedUserId или null если не найден
   */
  static extractRequestedUserId(query, variables = {}) {
    try {
      // Парсим GraphQL запрос
      const parsedQuery = parse(query);
      
      // Ищем аргументы в запросах и мутациях
      const requestedUserId = this.extractFromSelections(parsedQuery.definitions, variables);
      
      if (requestedUserId) {
        console.log(`🔍 Extracted requested userId: ${requestedUserId} from query`);
        return requestedUserId;
      }
      
      return null;
      
    } catch (error) {
      console.error('Error parsing GraphQL query for requested userId:', error);
      return null;
    }
  }
}
