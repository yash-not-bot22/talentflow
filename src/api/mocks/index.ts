async function enableMocking() {
  // Only enable client-side mocking for this project
  if (typeof window !== 'undefined') {
    try {
      console.log('🔧 Starting MSW worker...');
      const { worker } = await import('./browser');
      await worker.start({
        onUnhandledRequest: 'warn',
      });
      console.log('✅ MSW worker started successfully');
      
      // Add a small delay to ensure MSW is fully ready
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log('✅ MSW worker initialization complete');
    } catch (error) {
      console.error('❌ Failed to start MSW worker:', error);
    }
  }
}

export { enableMocking };