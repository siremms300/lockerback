// scripts/test-integration.ts
import mongoose from 'mongoose';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function testIntegration() {
  try {
    // 1. Test health endpoint
    const health = await axios.get('http://localhost:5000/health');
    console.log('✅ Health check:', health.data);
    
    // 2. Login
    const login = await axios.post(`${API_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = login.data.token;
    console.log('✅ Login successful');
    
    // 3. Set auth header
    const headers = { Authorization: `Bearer ${token}` };
    
    // 4. Get parcels
    const parcels = await axios.get(`${API_URL}/parcels`, { headers });
    console.log(`✅ Fetched ${parcels.data.parcels?.length || 0} parcels`);
    
    // 5. Get analytics
    const analytics = await axios.get(`${API_URL}/analytics/dashboard`, { headers });
    console.log('✅ Analytics:', analytics.data.overview);
    
    console.log('\n🎉 All systems operational!');
  } catch (error: any) {
    console.error('❌ Integration test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  } finally {
    await mongoose.disconnect();
  }
}

testIntegration();