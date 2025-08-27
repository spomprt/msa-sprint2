import fetch from 'node-fetch';

export class BookingService {
  // URL внешнего API бронирований (можно настроить через переменные окружения)
  static BOOKING_API_BASE_URL = process.env.BOOKING_API_BASE_URL || 'http://booking-service:8080';
  
  /**
   * Получает список бронирований пользователя через REST API
   * @param {string} userId - ID пользователя
   * @returns {Promise<Array>} массив бронирований
   */
  static async getBookingsByUser(userId) {
    try {
      console.log(`🔍 Fetching bookings for user: ${userId}`);
      
      const response = await fetch(`${this.BOOKING_API_BASE_URL}/api/v1/bookings/user?userId=${encodeURIComponent(userId)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log(`No bookings found for user ${userId}`);
          return [];
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.bookings) {
        console.log(`No bookings array in response for user ${userId}`);
        return [];
      }
      
      // Преобразуем REST API ответ в формат GraphQL
      const bookings = data.bookings.map(booking => ({
        id: booking.id?.toString(),
        userId: booking.userId,
        hotelId: booking.hotelId,
        promoCode: booking.promoCode || null,
        discountPercent: Math.round(booking.discountPercent || 0),
        price: booking.price || 0,
        createdAt: booking.createdAt ? new Date(booking.createdAt).toISOString() : null
      }));
      
      console.log(`✅ Found ${bookings.length} bookings for user ${userId}`);
      return bookings;
      
    } catch (error) {
      console.error(`Error fetching bookings for user ${userId}:`, error);
      throw new Error(`Failed to fetch bookings: ${error.message}`);
    }
  }
  
  /**
   * Создает новое бронирование через REST API
   * @param {Object} bookingData - данные бронирования
   * @returns {Promise<Object>} созданное бронирование
   */
  static async createBooking(bookingData) {
    try {
      console.log(`🔍 Creating booking for user: ${bookingData.userId}, hotel: ${bookingData.hotelId}`);
      
      const requestBody = {
        userId: bookingData.userId,
        hotelId: bookingData.hotelId,
        promoCode: bookingData.promoCode || null
      };
      
      const response = await fetch(`${this.BOOKING_API_BASE_URL}/api/v1/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        throw new Error(`Failed to create booking: HTTP ${response.status}`);
      }
      
      const booking = await response.json();
      
      // Преобразуем REST API ответ в формат GraphQL
      const createdBooking = {
        id: booking.id?.toString(),
        userId: booking.userId,
        hotelId: booking.hotelId,
        promoCode: booking.promoCode || null,
        discountPercent: Math.round(booking.discountPercent || 0),
        price: booking.price || 0,
        createdAt: booking.createdAt ? new Date(booking.createdAt).toISOString() : new Date().toISOString()
      };
      
      console.log(`✅ Created booking with ID: ${createdBooking.id}`);
      return createdBooking;
      
    } catch (error) {
      console.error('Error creating booking:', error);
      throw new Error(`Failed to create booking: ${error.message}`);
    }
  }
  
  /**
   * Получает бронирование по ID через REST API
   * @param {string} bookingId - ID бронирования
   * @returns {Promise<Object|null>} бронирование или null если не найдено
   */
  static async getBookingById(bookingId) {
    try {
      console.log(`🔍 Fetching booking by ID: ${bookingId}`);
      
      const response = await fetch(`${this.BOOKING_API_BASE_URL}/api/v1/bookings/${bookingId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log(`Booking with ID ${bookingId} not found`);
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const booking = await response.json();
      
      // Преобразуем REST API ответ в формат GraphQL
      const bookingData = {
        id: booking.id?.toString(),
        userId: booking.userId,
        hotelId: booking.hotelId,
        promoCode: booking.promoCode || null,
        discountPercent: Math.round(booking.discountPercent || 0),
        price: booking.price || 0,
        createdAt: booking.createdAt ? new Date(booking.createdAt).toISOString() : null
      };
      
      console.log(`✅ Found booking: ${bookingData.id}`);
      return bookingData;
      
    } catch (error) {
      console.error(`Error fetching booking ${bookingId}:`, error);
      throw new Error(`Failed to fetch booking: ${error.message}`);
    }
  }
  
  /**
   * Получает несколько бронирований по ID
   * @param {Array<string>} bookingIds - массив ID бронирований
   * @returns {Promise<Array>} массив бронирований
   */
  static async getBookingsByIds(bookingIds) {
    try {
      console.log(`🔍 Fetching bookings by IDs: ${bookingIds.join(', ')}`);
      
      if (!bookingIds || bookingIds.length === 0) {
        return [];
      }
      
      // Для оптимизации делаем параллельные запросы
      const bookingPromises = bookingIds.map(id => this.getBookingById(id));
      const bookings = await Promise.allSettled(bookingPromises);
      
      // Фильтруем успешные результаты и убираем null
      const validBookings = bookings
        .filter(result => result.status === 'fulfilled' && result.value !== null)
        .map(result => result.value);
      
      console.log(`✅ Found ${validBookings.length} bookings out of ${bookingIds.length} requested`);
      return validBookings;
      
    } catch (error) {
      console.error('Error fetching bookings by IDs:', error);
      throw new Error(`Failed to fetch bookings: ${error.message}`);
    }
  }
}
