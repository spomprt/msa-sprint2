import fetch from 'node-fetch';

const MONOLITH_BASE_URL = process.env.HOTEL_API_BASE_URL || 'http://hotelio-monolith:8080';

async function checkMonolithEndpoints() {
  console.log('🔍 Checking hotelio-monolith endpoints...\n');
  
  const endpoints = [
    { path: '/api/users/1', name: 'Get User by ID' },
    { path: '/api/users/1/authorized', name: 'Check User Authorization' },
    { path: '/api/users/1/status', name: 'Get User Status' },
    { path: '/api/users/1/active', name: 'Check User Active' },
    { path: '/api/users/1/blacklisted', name: 'Check User Blacklisted' },
    { path: '/api/users/1/vip', name: 'Check User VIP' },
    { path: '/api/hotels/1', name: 'Get Hotel by ID' },
    { path: '/api/hotels/by-city?city=Moscow', name: 'Get Hotels by City' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`📋 Testing: ${endpoint.name}`);
      console.log(`   URL: ${endpoint.path}`);
      
      const response = await fetch(`${MONOLITH_BASE_URL}${endpoint.path}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Status: ${response.status} - OK`);
        console.log(`   📊 Response: ${JSON.stringify(data).substring(0, 100)}...`);
      } else {
        console.log(`   ❌ Status: ${response.status} - ${response.statusText}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log(''); // пустая строка для разделения
  }
  
  console.log('🏁 Monolith endpoint checking completed');
}

// Запускаем проверку
checkMonolithEndpoints().catch(console.error);

