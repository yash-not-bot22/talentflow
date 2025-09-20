// Test script to check candidate API endpoints
const BASE_URL = 'http://localhost:5173';

async function testAPI() {
  console.log('🔧 Testing candidate API endpoints...');
  
  try {
    // First, test the basic candidates endpoint
    console.log('\n📡 Testing GET /api/candidates...');
    const candidatesResponse = await fetch(`${BASE_URL}/api/candidates?pageSize=5`);
    
    if (!candidatesResponse.ok) {
      throw new Error(`HTTP ${candidatesResponse.status} - ${candidatesResponse.statusText}`);
    }
    
    const candidatesData = await candidatesResponse.json();
    console.log('✅ Candidates API Response:', {
      status: candidatesResponse.status,
      totalCount: candidatesData.pagination?.totalCount,
      candidatesCount: candidatesData.data?.length,
      firstCandidate: candidatesData.data?.[0] ? {
        id: candidatesData.data[0].id,
        name: candidatesData.data[0].name,
        stage: candidatesData.data[0].stage
      } : 'No candidates'
    });
    
    if (candidatesData.data && candidatesData.data.length > 0) {
      const testCandidateId = candidatesData.data[0].id;
      
      // Test the specific candidate timeline endpoint
      console.log(`\n📅 Testing GET /api/candidates/${testCandidateId}/timeline...`);
      const timelineResponse = await fetch(`${BASE_URL}/api/candidates/${testCandidateId}/timeline`);
      
      if (!timelineResponse.ok) {
        console.log('❌ Timeline API failed:', timelineResponse.status, timelineResponse.statusText);
        const errorText = await timelineResponse.text();
        console.log('Error response:', errorText);
      } else {
        const timelineData = await timelineResponse.json();
        console.log('✅ Timeline API Response:', {
          status: timelineResponse.status,
          timelineLength: timelineData.timeline?.length,
          timeline: timelineData.timeline?.slice(0, 3) // Show first 3 entries
        });
      }
      
      // Test PATCH endpoint (without actually changing anything)
      console.log(`\n🔧 Testing PATCH /api/candidates/${testCandidateId} (dry run)...`);
      const patchResponse = await fetch(`${BASE_URL}/api/candidates/${testCandidateId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notes: 'Test note from API test script'
        })
      });
      
      if (!patchResponse.ok) {
        console.log('❌ PATCH API failed:', patchResponse.status, patchResponse.statusText);
      } else {
        const patchData = await patchResponse.json();
        console.log('✅ PATCH API Response:', {
          status: patchResponse.status,
          updatedCandidate: {
            id: patchData.id,
            name: patchData.name,
            notesCount: patchData.notes?.length
          }
        });
      }
    }
    
  } catch (error) {
    console.error('❌ API Test Error:', error.message);
  }
}

testAPI();