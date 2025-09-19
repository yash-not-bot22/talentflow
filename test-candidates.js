// Simple test script to verify candidates API is working
async function testCandidatesAPI() {
  try {
    console.log('🔍 Testing GET /api/candidates...');
    
    const response = await fetch('http://localhost:5174/api/candidates?pageSize=5');
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ SUCCESS! Candidates API is working');
      console.log(`📊 Found ${data.data.length} candidates (total: ${data.pagination.totalCount})`);
      
      if (data.data.length > 0) {
        console.log('👤 First candidate:', data.data[0].name, '-', data.data[0].email, '-', data.data[0].stage);
      }
    } else {
      console.log('❌ ERROR Response:', response.status, data);
    }
  } catch (error) {
    console.log('❌ NETWORK ERROR:', error.message);
  }
}

testCandidatesAPI();