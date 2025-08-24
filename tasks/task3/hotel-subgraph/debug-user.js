import fetch from 'node-fetch';

const MONOLITH_BASE_URL = process.env.HOTEL_API_BASE_URL || 'http://hotelio-monolith:8080';
const HOTEL_SUBGRAPH_URL = 'http://localhost:4002/graphql';

async function debugUserAuthorization() {
  console.log('🔍 Debugging user authorization for test-user-1...\n');
  
  const userId = 'test-user-1';
  
  // 1. Проверяем все endpoints для пользователя
  console.log('📋 Checking all user endpoints:');
  const endpoints = [
    { path: `/api/users/${userId}`, name: 'Get User by ID' },
    { path: `/api/users/${userId}/status`, name: 'Get User Status' },
    { path: `/api/users/${userId}/active`, name: 'Check User Active' },
    { path: `/api/users/${userId}/blacklisted`, name: 'Check User Blacklisted' },
    { path: `/api/users/${userId}/authorized`, name: 'Check User Authorization' },
    { path: `/api/users/${userId}/vip`, name: 'Check User VIP' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n   Testing: ${endpoint.name}`);
      console.log(`   URL: ${endpoint.path}`);
      
      const response = await fetch(`${MONOLITH_BASE_URL}${endpoint.path}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Status: ${response.status} - OK`);
        console.log(`   📊 Response: ${JSON.stringify(data)}`);
      } else {
        console.log(`   ❌ Status: ${response.status} - ${response.statusText}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  // 2. Тестируем GraphQL запрос
  console.log('\n\n📋 Testing GraphQL query with test-user-1:');
  
  try {
    const response = await fetch(HOTEL_SUBGRAPH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': userId
      },
      body: JSON.stringify({
        query: `
          query {
            hotelsByCity(city: "Seoul") {
              id
              name
              city
            }
          }
        `
      })
    });
    
    const result = await response.json();
    
    if (result.errors) {
      console.log('❌ GraphQL Error:');
      result.errors.forEach((error, index) => {
        console.log(`   Error ${index + 1}:`);
        console.log(`     Message: ${error.message}`);
        console.log(`     Code: ${error.extensions?.code || 'N/A'}`);
        console.log(`     HTTP Status: ${error.extensions?.http?.status || 'N/A'}`);
        console.log(`     Reason: ${error.extensions?.reason || 'N/A'}`);
      });
    } else {
      console.log('✅ GraphQL Success:');
      console.log(`   Hotels found: ${result.data?.hotelsByCity?.length || 0}`);
      console.log(`   Data: ${JSON.stringify(result.data, null, 2)}`);
    }
    
  } catch (error) {
    console.log(`❌ GraphQL request failed: ${error.message}`);
  }
  
  console.log('\n🏁 Debug completed');
}

// Запускаем отладку
debugUserAuthorization().catch(console.error);

