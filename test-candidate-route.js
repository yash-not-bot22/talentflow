// Test script to check candidate route functionality
import { db } from './src/db.js';

async function testCandidateRoute() {
  try {
    console.log('🔧 Opening database...');
    await db.open();
    
    console.log('📋 Fetching candidates...');
    const candidates = await db.candidates.limit(5).toArray();
    
    console.log(`Found ${candidates.length} candidates:`);
    candidates.forEach(candidate => {
      console.log(`- ID: ${candidate.id}, Name: ${candidate.name}, Stage: ${candidate.stage}`);
      console.log(`  Route: http://localhost:5174/candidates/${candidate.id}`);
    });
    
    if (candidates.length > 0) {
      console.log('\n✅ Test the first candidate route:');
      console.log(`http://localhost:5174/candidates/${candidates[0].id}`);
    }
    
    await db.close();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testCandidateRoute();