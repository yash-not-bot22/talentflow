// Simple test to verify candidate API functionality
// This test will run in the browser context

function testCandidateAPI() {
  console.log('🔧 Starting candidate API test...');
  
  // Test basic candidates endpoint
  fetch('/api/candidates?pageSize=5')
    .then(response => {
      console.log('📡 Candidates API response status:', response.status);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('✅ Candidates API working!');
      console.log('📊 Data structure:', {
        totalCandidates: data.pagination?.totalCount,
        returnedCount: data.data?.length,
        firstCandidate: data.data?.[0]
      });
      
      if (data.data && data.data.length > 0) {
        const testId = data.data[0].id;
        console.log(`🧪 Testing timeline for candidate ID: ${testId}`);
        
        // Test timeline endpoint
        return fetch(`/api/candidates/${testId}/timeline`);
      } else {
        throw new Error('No candidates found in response');
      }
    })
    .then(response => {
      console.log('📅 Timeline API response status:', response.status);
      if (!response.ok) {
        throw new Error(`Timeline API failed: HTTP ${response.status}`);
      }
      return response.json();
    })
    .then(timelineData => {
      console.log('✅ Timeline API working!');
      console.log('📅 Timeline data:', timelineData);
    })
    .catch(error => {
      console.error('❌ API Test failed:', error);
    });
}

// Wait for page to load and MSW to initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(testCandidateAPI, 2000); // Wait 2 seconds for MSW
  });
} else {
  setTimeout(testCandidateAPI, 2000);
}