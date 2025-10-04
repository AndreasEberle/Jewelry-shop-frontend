// Simple script to test backend connectivity
const axios = require('axios');

async function testBackend() {
  const baseURL = 'http://localhost:8080';
  
  console.log('🧪 Testing Backend Connectivity...\n');
  
  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${baseURL}/api/health`);
    console.log('✅ Health check passed:', healthResponse.data);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }
  
  try {
    // Test products endpoint
    console.log('\n2. Testing products endpoint...');
    const productsResponse = await axios.get(`${baseURL}/api/products`);
    console.log('✅ Products endpoint accessible');
    console.log('📊 Found', productsResponse.data.content?.length || 0, 'products');
  } catch (error) {
    console.log('❌ Products endpoint failed:', error.message);
  }
  
  try {
    // Test auth endpoints
    console.log('\n3. Testing auth endpoints...');
    const authResponse = await axios.get(`${baseURL}/api/auth/2fa/global-status`);
    console.log('✅ Auth endpoints accessible:', authResponse.data);
  } catch (error) {
    console.log('❌ Auth endpoints failed:', error.message);
  }
  
  console.log('\n🎯 Backend test complete!');
}

testBackend().catch(console.error);
