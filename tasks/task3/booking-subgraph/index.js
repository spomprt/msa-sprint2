import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { buildSubgraphSchema } from '@apollo/subgraph';
import gql from 'graphql-tag';
import { BookingService } from './booking-service.js';

const typeDefs = gql`
  type Booking @key(fields: "id") {
    id: ID!
    userId: String!
    hotelId: String!
    promoCode: String
    discountPercent: Int
    price: Float
    createdAt: String
  }

  input CreateBookingInput {
    userId: String!
    hotelId: String!
    promoCode: String
  }

  type Query {
    bookingsByUser(userId: String!): [Booking]
    bookingById(id: ID!): Booking
    bookingsByIds(ids: [ID!]!): [Booking]
  }

  type Mutation {
    createBooking(input: CreateBookingInput!): Booking
  }
`;

const resolvers = {
  Query: {
    bookingsByUser: async (_, { userId }, context) => {
      try {
        console.log(`🔍 Fetching bookings for user: ${userId}`);
        console.log(`🔍 Context:`, context ? 'exists' : 'null');
        console.log(`🔍 Headers:`, context?.headers ? Object.keys(context.headers) : 'null');
        
        // Проверяем доступ к чужим данным
        const authenticatedUserId = context?.headers?.['x-user-id'];
        console.log(`🔐 Authenticated user: ${authenticatedUserId}`);
        
        if (authenticatedUserId && authenticatedUserId !== userId) {
          console.log(`❌ Access denied: User ${authenticatedUserId} cannot access bookings for user ${userId}`);
          throw new Error(`Access denied: You can only view your own bookings`);
        }
        
        // Получаем бронирования через REST API
        const bookings = await BookingService.getBookingsByUser(userId);
        return bookings;
        
      } catch (error) {
        console.error('Error in bookingsByUser resolver:', error);
        throw new Error(`Failed to fetch bookings: ${error.message}`);
      }
    },
    
    bookingById: async (_, { id }) => {
      try {
        console.log(`🔍 Fetching booking by ID: ${id}`);
        
        // Получаем бронирование по ID
        const booking = await BookingService.getBookingById(id);
        
        if (!booking) {
          throw new Error('Booking not found');
        }
        
        return booking;
        
      } catch (error) {
        console.error('Error in bookingById resolver:', error);
        throw new Error(`Failed to fetch booking: ${error.message}`);
      }
    },
    
    bookingsByIds: async (_, { ids }) => {
      try {
        console.log(`🔍 Fetching bookings by IDs: ${ids.join(', ')}`);
        
        // Получаем бронирования по ID
        const bookings = await BookingService.getBookingsByIds(ids);
        return bookings;
        
      } catch (error) {
        console.error('Error in bookingsByIds resolver:', error);
        throw new Error(`Failed to fetch bookings: ${error.message}`);
      }
    },
  },
  
  Mutation: {
    createBooking: async (_, { input }) => {
      try {
        console.log(`🔍 Creating booking for user: ${input.userId}, hotel: ${input.hotelId}`);
        
        // Создаем бронирование через REST API
        const booking = await BookingService.createBooking(input);
        return booking;
        
      } catch (error) {
        console.error('Error in createBooking resolver:', error);
        throw new Error(`Failed to create booking: ${error.message}`);
      }
    },
  },
  
  Booking: {
    // Резолвер для поля @key - используется для федерации
    __resolveReference: async (reference) => {
      try {
        console.log(`🔍 Resolving booking reference for ID: ${reference.id}`);
        
        // Получаем полную информацию о бронировании по ID
        const booking = await BookingService.getBookingById(reference.id);
        
        if (!booking) {
          console.warn(`⚠️ Booking with ID ${reference.id} not found during reference resolution`);
          return null;
        }
        
        console.log(`✅ Booking reference resolved: ${booking.id}`);
        return booking;
        
      } catch (error) {
        console.error(`❌ Error resolving booking reference for ID ${reference.id}:`, error);
        throw new Error(`Failed to resolve booking reference: ${error.message}`);
      }
    },
  },
};

const server = new ApolloServer({
  schema: buildSubgraphSchema([{ typeDefs, resolvers }]),
  formatError: (error) => {
    console.error('GraphQL Error:', error);
    return {
      message: error.message,
      code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
    };
  },
});

startStandaloneServer(server, {
  listen: { port: 4001 },
  context: async ({ req }) => {
    // Получаем заголовки из запроса gateway
    const headers = req.headers;
    console.log(`📡 Booking subgraph received headers:`, Object.keys(headers));
    
    if (headers['x-user-id']) {
      console.log(`🔐 User ID from header: ${headers['x-user-id']}`);
    }
    
    return { 
      req,
      headers: headers
    };
  },
}).then(() => {
  console.log('✅ Booking subgraph ready at http://localhost:4001/');
  console.log('🔌 REST API client connected to booking-service:8080');
  console.log('🔐 ACL handled by gateway - no local authorization');
  console.log('🏨 Available endpoints:');
  console.log('   - POST /api/v1/bookings');
  console.log('   - GET /api/v1/bookings/user?userId={userId}');
  console.log('   - GET /api/v1/bookings/{id}');
}).catch((error) => {
  console.error('❌ Failed to start booking subgraph:', error);
  process.exit(1);
});
