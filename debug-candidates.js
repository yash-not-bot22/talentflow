// Quick debug script to test candidates API
console.log('🔧 Testing candidates API endpoint...');

fetch('http://localhost:5173/api/candidates?pageSize=5')
  .then(response => {
    console.log('📡 Response status:', response.status);
    if (response.ok) {
      return response.json();
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  })
  .then(data => {
    console.log('✅ SUCCESS! API returned data:');
    console.log(`📊 Found ${data.data.length} candidates (total: ${data.pagination.totalCount})`);
    if (data.data.length > 0) {
      console.log('👤 First candidate:', data.data[0].name, '-', data.data[0].stage);
      console.log('📧 Email:', data.data[0].email);
    }
  })
  .catch(error => {
    console.log('❌ ERROR:', error.message);
  });