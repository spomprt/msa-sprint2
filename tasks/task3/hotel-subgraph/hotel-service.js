import fetch from 'node-fetch';

export class HotelService {
  // URL внешнего API отелей (можно настроить через переменные окружения)
  static HOTEL_API_BASE_URL = process.env.HOTEL_API_BASE_URL || 'http://hotelio-monolith:8080';
  
  /**
   * Получает информацию об отеле по ID
   * @param {string} hotelId - ID отеля
   * @returns {Promise<Object|null>} информация об отеле или null если не найден
   */
  static async getHotelById(hotelId) {
    try {
      const response = await fetch(`${this.HOTEL_API_BASE_URL}/api/hotels/${hotelId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log(`Hotel with ID ${hotelId} not found`);
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const hotel = await response.json();
      
      // Преобразуем в формат GraphQL согласно структуре Hotel entity
      return {
        id: hotel.id?.toString(),
        name: hotel.name || `Hotel ${hotel.id}`, // name отсутствует в entity, используем fallback
        city: hotel.city,
        stars: Math.round(hotel.rating || 0), // конвертируем rating в stars
        address: hotel.address || `${hotel.city}`, // address отсутствует в entity
        description: hotel.description,
        amenities: hotel.amenities || [], // amenities отсутствует в entity
        rating: hotel.rating || 0,
        operational: hotel.operational || false,
        fullyBooked: hotel.fullyBooked || false
      };
      
    } catch (error) {
      console.error(`Error fetching hotel ${hotelId}:`, error);
      throw new Error(`Failed to fetch hotel: ${error.message}`);
    }
  }
  
  /**
   * Получает информацию о нескольких отелях по ID
   * @param {Array<string>} hotelIds - массив ID отелей
   * @returns {Promise<Array>} массив информации об отелях
   */
  static async getHotelsByIds(hotelIds) {
    try {
      // Для оптимизации делаем параллельные запросы
      const hotelPromises = hotelIds.map(id => this.getHotelById(id));
      const hotels = await Promise.allSettled(hotelPromises);
      
      // Фильтруем успешные результаты и убираем null
      return hotels
        .filter(result => result.status === 'fulfilled' && result.value !== null)
        .map(result => result.value);
        
    } catch (error) {
      console.error('Error fetching hotels by IDs:', error);
      throw new Error(`Failed to fetch hotels: ${error.message}`);
    }
  }
  
  /**
   * Получает список отелей по городу
   * @param {string} city - название города
   * @returns {Promise<Array>} массив отелей в городе
   */
  static async getHotelsByCity(city) {
    try {
      const response = await fetch(`${this.HOTEL_API_BASE_URL}/api/hotels/by-city?city=${encodeURIComponent(city)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const hotels = await response.json();
      
      return hotels.map(hotel => ({
        id: hotel.id?.toString(),
        name: hotel.name || `Hotel ${hotel.id}`,
        city: hotel.city,
        stars: Math.round(hotel.rating || 0),
        address: hotel.address || `${hotel.city}`,
        description: hotel.description,
        amenities: hotel.amenities || [],
        rating: hotel.rating || 0,
        operational: hotel.operational || false,
        fullyBooked: hotel.fullyBooked || false
      }));
      
    } catch (error) {
      console.error(`Error fetching hotels in city ${city}:`, error);
      throw new Error(`Failed to fetch hotels: ${error.message}`);
    }
  }
  
  /**
   * Получает топ-рейтинговые отели в городе
   * @param {string} city - название города
   * @param {number} limit - максимальное количество отелей
   * @returns {Promise<Array>} массив топ-отелей
   */
  static async getTopRatedHotelsInCity(city, limit = 5) {
    try {
      const response = await fetch(`${this.HOTEL_API_BASE_URL}/api/hotels/top-rated?city=${encodeURIComponent(city)}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const hotels = await response.json();
      
      return hotels.map(hotel => ({
        id: hotel.id?.toString(),
        name: hotel.name || `Hotel ${hotel.id}`,
        city: hotel.city,
        stars: Math.round(hotel.rating || 0),
        address: hotel.address || `${hotel.city}`,
        description: hotel.description,
        amenities: hotel.amenities || [],
        rating: hotel.rating || 0,
        operational: hotel.operational || false,
        fullyBooked: hotel.fullyBooked || false
      }));
      
    } catch (error) {
      console.error(`Error fetching top-rated hotels in city ${city}:`, error);
      throw new Error(`Failed to fetch top-rated hotels: ${error.message}`);
    }
  }
  
  /**
   * Проверяет, работает ли отель
   * @param {string} hotelId - ID отеля
   * @returns {Promise<boolean>} true если отель работает
   */
  static async isHotelOperational(hotelId) {
    try {
      const response = await fetch(`${this.HOTEL_API_BASE_URL}/api/hotels/${hotelId}/operational`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.error(`Error checking operational status for hotel ${hotelId}:`, error);
      return false; // по умолчанию считаем неработающим
    }
  }
  
  /**
   * Проверяет, полностью ли забронирован отель
   * @param {string} hotelId - ID отеля
   * @returns {Promise<boolean>} true если отель полностью забронирован
   */
  static async isHotelFullyBooked(hotelId) {
    try {
      const response = await fetch(`${this.HOTEL_API_BASE_URL}/api/hotels/${hotelId}/fully-booked`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.error(`Error checking booking status for hotel ${hotelId}:`, error);
      return true; // по умолчанию считаем забронированным
    }
  }
}
