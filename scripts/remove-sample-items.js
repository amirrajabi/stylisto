// Quick script to remove sample items
// Run this in the browser console or as a Node.js script

console.log('Starting sample items removal...');

// This would be executed in the app context
async function removeSampleItems() {
  try {
    // In browser console, you can access the wardrobeService
    if (typeof window !== 'undefined' && window.wardrobeService) {
      const result = await window.wardrobeService.removeSampleItems();
      console.log('Sample items removal result:', result);
      return result;
    }

    console.log(
      'This script needs to be run in the app context where wardrobeService is available'
    );
    console.log('Alternative: Use the RemoveSampleItems component in the app');
  } catch (error) {
    console.error('Error removing sample items:', error);
  }
}

// Auto-run if possible
if (typeof window !== 'undefined') {
  removeSampleItems();
}

console.log(
  'Sample items removal script loaded. Call removeSampleItems() to execute.'
);
