import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { ApolloGateway } from '@apollo/gateway';
import { ACLService } from './acl-service.js';
import { UserExtractor } from './user-extractor.js';
import { InsufficientPermissionsError, MissingUserIdHeaderError } from './auth-errors.js';

const gateway = new ApolloGateway({
  serviceList: [
    { name: 'booking', url: 'http://booking-subgraph:4001' },
    { name: 'hotel', url: 'http://hotel-subgraph:4002' }
  ]
});

const server = new ApolloServer({ 
  gateway, 
  subscriptions: false,
  plugins: [
    {
      // Плагин для ACL проверок
      requestDidStart: async ({ request, contextValue }) => {
        const { query, variables = {} } = request;
        
        // Проверяем наличие обязательного заголовка X-User-ID
        const userId = UserExtractor.extractUserIdFromHeaders(contextValue.req);
        
        if (!userId) {
          console.log('❌ Missing required header X-User-ID');
          throw new MissingUserIdHeaderError();
        }
        
        console.log(`🔐 ACL check in plugin for user: ${userId}`);
        
        // Проверяем существование пользователя в базе
        const userExists = await ACLService.getUserById(userId);
        if (!userExists) {
          console.log(`❌ User with ID ${userId} not found in database`);
          throw new Error(`User with ID ${userId} not found in database`);
        }
        
        // Проверяем авторизацию пользователя
        const authResult = await ACLService.checkUserAuthorization(userId);
        if (!authResult.authorized) {
          console.log(`❌ User ${userId} is not authorized: ${authResult.error}`);
          const error = new Error(authResult.error);
          error.extensions = { 
            code: 'UNAUTHORIZED', 
            http: { status: authResult.status },
            reason: authResult.reason
          };
          throw error;
        }
        
        // Определяем тип ресурса на основе запроса
        let resourceType = 'general';
        console.log(`🔍 Raw query: ${query}`);
        console.log(`🔍 Query length: ${query.length}`);
        console.log(`🔍 Checking for bookings fields...`);
        
        // Проверяем простым поиском подстроки для отладки
        const hasBookingsByUser = query.includes('bookingsByUser');
        console.log(`🔍 Query contains 'bookingsByUser': ${hasBookingsByUser}`);
        
        const hasBookingsFields = UserExtractor.containsFields(query, ['bookings', 'createBooking', 'bookingsByUser']);
        console.log(`🔍 Has bookings fields (parsed): ${hasBookingsFields}`);
        
        if (hasBookingsFields) {
          resourceType = 'bookings';
        } else if (UserExtractor.containsFields(query, ['hotels', 'hotelsByIds', 'hotelsByCity'])) {
          resourceType = 'hotels';
        }
        
        console.log(`🔍 Plugin determined resource type: ${resourceType}`);
        
        // Проверяем доступ пользователя
        try {
          // Для бронирований добавляем контекст с requestedUserId
          let aclContext = {};
          if (resourceType === 'bookings') {
            // Извлекаем requestedUserId из GraphQL запроса
            const requestedUserId = UserExtractor.extractRequestedUserId(query, variables);
            if (requestedUserId) {
              aclContext.requestedUserId = requestedUserId;
              console.log(`🔍 Requested userId: ${requestedUserId}`);
            }
          }
          
          await ACLService.canAccessResource(userId, resourceType, 'read', aclContext);
          console.log(`✅ Plugin ACL check passed for user ${userId} accessing ${resourceType}`);
        } catch (error) {
          console.log(`❌ Plugin ACL check failed for user ${userId}:`, error.message);
          // Пробрасываем ошибку, которая должна остановить выполнение
          throw error;
        }
        
        return {
          willSendResponse: async ({ response }) => {
            console.log(`📡 Plugin: Response sent for user: ${userId || 'anonymous'}`);
          }
        };
      }
    }
  ]
});

startStandaloneServer(server, {
  listen: { port: 4000 },
  context: async ({ req }) => {
    // Базовый контекст
    const context = { req };
    
    // Проверяем наличие обязательного заголовка X-User-ID
    const userId = UserExtractor.extractUserIdFromHeaders(req);
    
    if (!userId) {
      console.log('❌ Missing required header X-User-ID in context');
      throw new MissingUserIdHeaderError();
    }
    
    try {
      console.log(`🔐 ACL check in context for user: ${userId}`);
      
      // Проверяем существование пользователя в базе
      const userExists = await ACLService.getUserById(userId);
      if (!userExists) {
        console.log(`❌ User with ID ${userId} not found in database`);
        throw new Error(`User with ID ${userId} not found in database`);
      }
      
      // Проверяем авторизацию пользователя
      const authResult = await ACLService.checkUserAuthorization(userId);
      if (!authResult.authorized) {
        console.log(`❌ User ${userId} is not authorized: ${authResult.error}`);
        const error = new Error(authResult.error);
        error.extensions = { 
          code: 'UNAUTHORIZED', 
          http: { status: authResult.status },
          reason: authResult.reason
        };
        throw error;
      }
      
      // Определяем тип ресурса на основе запроса
      let resourceType = 'general';
      if (req.body && req.body.query) {
        const { query } = req.body;
        console.log(`🔍 Context query: ${query}`);
        
        // Проверяем простым поиском подстроки
        if (query.includes('bookingsByUser') || query.includes('createBooking')) {
          resourceType = 'bookings';
        } else if (query.includes('hotels') || query.includes('hotelsByCity')) {
          resourceType = 'hotels';
        }
        
        console.log(`🔍 Context determined resource type: ${resourceType}`);
        
        // Для бронирований добавляем проверку на доступ к чужим данным
        if (resourceType === 'bookings') {
          const requestedUserId = UserExtractor.extractRequestedUserId(query, req.body.variables || {});
          if (requestedUserId && requestedUserId !== userId) {
            console.log(`❌ Access denied: User ${userId} cannot access bookings for user ${requestedUserId}`);
            throw new InsufficientPermissionsError(userId, 'bookings', 'read');
          }
        }
      }
      
      const userAccess = await ACLService.checkUserAccess(userId);
      context.userId = userId;
      context.userAccess = userAccess;
      
      console.log(`✅ Context ACL check passed for user ${userId} accessing ${resourceType}`);
      console.log(`👤 User context loaded: ${userId} (${userAccess.status})`);
      
    } catch (error) {
      console.error(`❌ Context ACL check failed for user ${userId}:`, error.message);
      // Пробрасываем ошибку дальше
      throw error;
    }
    
    return context;
  },
}).then(({ url }) => {
  console.log(`🚀 Gateway ready at ${url}`);
  console.log('🔐 ACL enabled using AppUserController');
  console.log('🔐 X-User-ID header is now MANDATORY for all requests');
  console.log('🔐 User authorization centralized in gateway');
  console.log('🔌 User API: ' + ACLService.USER_API_BASE_URL);
  console.log('📡 Available endpoints:');
  console.log('   - GET /api/users/{userId}');
  console.log('   - GET /api/users/{userId}/status');
  console.log('   - GET /api/users/{userId}/blacklisted');
  console.log('   - GET /api/users/{userId}/active');
  console.log('   - GET /api/users/{userId}/authorized');
  console.log('   - GET /api/users/{userId}/vip');
}).catch((error) => {
  console.error('❌ Failed to start gateway:', error);
  process.exit(1);
});
