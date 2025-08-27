import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { buildSubgraphSchema } from '@apollo/subgraph';
import gql from 'graphql-tag';
import { HotelService } from './hotel-service.js';

const typeDefs = gql`
  type Hotel @key(fields: "id") {
    id: ID!
    name: String
    city: String
    stars: Int
    address: String
    description: String
    amenities: [String]
    rating: Float
    operational: Boolean
    fullyBooked: Boolean
  }

  type Query {
    hotelsByIds(ids: [ID!]!): [Hotel]
    hotelsByCity(city: String!): [Hotel]
    topRatedHotelsInCity(city: String!, limit: Int): [Hotel]
    hotelOperational(hotelId: ID!): Boolean
    hotelFullyBooked(hotelId: ID!): Boolean
  }
`;

const resolvers = {
  Hotel: {
    // Критически важный резолвер для GraphQL Federation
    // Позволяет gateway получать информацию об отеле по ID
    __resolveReference: async (reference, context) => {
      try {
        console.log(`🔍 Resolving hotel reference for ID: ${reference.id}`);
        
        // Авторизация уже проверена в gateway, можно сразу получать данные
        const hotel = await HotelService.getHotelById(reference.id);
        
        if (!hotel) {
          console.warn(`⚠️ Hotel with ID ${reference.id} not found during reference resolution`);
          return null;
        }
        
        console.log(`✅ Hotel reference resolved: ${hotel.name}`);
        return hotel;
        
      } catch (error) {
        console.error(`❌ Error resolving hotel reference for ID ${reference.id}:`, error);
        throw error;
      }
    },
  },
  
  Query: {
    hotelsByIds: async (_, { ids }, context) => {
      try {
        console.log(`🔍 Fetching hotels by IDs: ${ids.join(', ')}`);
        
        // Авторизация уже проверена в gateway, можно сразу получать данные
        if (!ids || ids.length === 0) {
          return [];
        }
        
        const hotels = await HotelService.getHotelsByIds(ids);
        console.log(`✅ Found ${hotels.length} hotels out of ${ids.length} requested`);
        
        return hotels;
        
      } catch (error) {
        console.error('❌ Error in hotelsByIds resolver:', error);
        
        // Для ошибок создаем новую с правильным форматированием
        const newError = new Error(error.message);
        newError.extensions = { 
          code: 'INTERNAL_SERVER_ERROR', 
          http: { status: 500 }
        };
        throw newError;
      }
    },
    
    hotelsByCity: async (_, { city }, context) => {
      try {
        console.log(`🔍 Fetching hotels in city: ${city}`);
        
        // Авторизация уже проверена в gateway, можно сразу получать данные
        if (!city || city.trim() === '') {
          throw new Error('City parameter is required');
        }
        
        const hotels = await HotelService.getHotelsByCity(city.trim());
        console.log(`✅ Found ${hotels.length} hotels in ${city}`);
        
        return hotels;
        
      } catch (error) {
        console.error(`❌ Error in hotelsByCity resolver for city ${city}:`, error);
        
        // Для ошибок создаем новую с правильным форматированием
        const newError = new Error(error.message);
        newError.extensions = { 
          code: 'INTERNAL_SERVER_ERROR', 
          http: { status: 500 }
        };
        throw newError;
      }
    },
    
    topRatedHotelsInCity: async (_, { city, limit = 5 }, context) => {
      try {
        console.log(`🔍 Fetching top ${limit} rated hotels in city: ${city}`);
        
        // Авторизация уже проверена в gateway, можно сразу получать данные
        if (!city || city.trim() === '') {
          throw new Error('City parameter is required');
        }
        
        const hotels = await HotelService.getTopRatedHotelsInCity(city.trim(), limit);
        console.log(`✅ Found ${hotels.length} top-rated hotels in ${city}`);
        
        return hotels;
        
      } catch (error) {
        console.error(`❌ Error in topRatedHotelsInCity resolver for city ${city}:`, error);
        throw error;
      }
    },
    
    hotelOperational: async (_, { hotelId }, context) => {
      try {
        console.log(`🔍 Checking operational status for hotel: ${hotelId}`);
        
        // Авторизация уже проверена в gateway, можно сразу получать данные
        const operational = await HotelService.isHotelOperational(hotelId);
        console.log(`✅ Hotel ${hotelId} operational status: ${operational}`);
        
        return operational;
        
      } catch (error) {
        console.error(`❌ Error in hotelOperational resolver for hotel ${hotelId}:`, error);
        throw error;
      }
    },
    
    hotelFullyBooked: async (_, { hotelId }, context) => {
      try {
        console.log(`🔍 Checking booking status for hotel: ${hotelId}`);
        
        // Авторизация уже проверена в gateway, можно сразу получать данные
        const fullyBooked = await HotelService.isHotelFullyBooked(hotelId);
        console.log(`✅ Hotel ${hotelId} fully booked status: ${fullyBooked}`);
        
        return fullyBooked;
        
      } catch (error) {
        console.error(`❌ Error in hotelFullyBooked resolver for hotel ${hotelId}:`, error);
        throw error;
      }
    },
  },
};

const server = new ApolloServer({
  schema: buildSubgraphSchema([{ typeDefs, resolvers }]),
  formatError: (error) => {
    console.error('🔍 [FORMAT_ERROR] Raw error:', error);
    console.error('🔍 [FORMAT_ERROR] Error extensions:', error.extensions);
    console.error('🔍 [FORMAT_ERROR] Error message:', error.message);
    
    // Упрощенная обработка ошибок, так как авторизация проверяется в gateway
    const formattedError = {
      message: error.message,
      code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
      extensions: {
        ...error.extensions,
        http: { status: error.extensions?.http?.status || 500 }
      }
    };
    
    console.error('🔍 [FORMAT_ERROR] Formatted error:', formattedError);
    
    return formattedError;
  },
});

startStandaloneServer(server, {
  listen: { port: 4002 },
  context: async ({ req }) => {
    // Простой контекст - заголовки передаются от gateway
    const headers = req.headers;
    console.log(`📡 Hotel subgraph received headers:`, Object.keys(headers));
    
    return {
      headers: headers,
      req: req
    };
  },
}).then(() => {
  console.log('✅ Hotel subgraph ready at http://localhost:4002/');
  console.log('🔌 External API: ' + HotelService.HOTEL_API_BASE_URL);
  console.log('🔑 Federation key: Hotel.id');
  console.log('📡 __resolveReference enabled for federation');
  console.log('�� User authorization handled by Apollo Gateway');
  console.log('🏨 Available endpoints:');
  console.log('   - GET /api/hotels/{id}');
  console.log('   - GET /api/hotels/by-city?city={city}');
  console.log('   - GET /api/hotels/top-rated?city={city}&limit={limit}');
  console.log('   - GET /api/hotels/{id}/operational');
  console.log('   - GET /api/hotels/{id}/fully-booked');
}).catch((error) => {
  console.error('❌ Failed to start hotel subgraph:', error);
  process.exit(1);
});
