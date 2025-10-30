/**
 * Get user-friendly error message and guidance based on error type
 */
export const getErrorGuidance = (errorMessage: string) => {
  let guidance = "";
  let shouldRetry = false;
  let maxRetries = 1;

  if (errorMessage.includes("429") || errorMessage.includes("Too Many Requests")) {
    guidance = "\n\n🚦 Rate Limit Error - GitHub servers are busy:\n1. WAIT 15-30 minutes for rate limits to reset\n2. Try incognito/private browsing mode\n3. Use mobile hotspot (different IP address)\n4. Try early morning (6-8 AM) or late night (10 PM-12 AM)\n5. GitHub limits ~60 downloads per hour per IP address";
    shouldRetry = true;
    maxRetries = 3;
  } else if (errorMessage.includes("Cache") || errorMessage.includes("cache")) {
    guidance = "\n\n🔧 Cache Error Solutions:\n1. Clear browser cache (Ctrl+Shift+Delete)\n2. Try incognito/private browsing mode\n3. Disable browser extensions temporarily\n4. Try a different browser (Chrome/Edge recommended)";
    shouldRetry = true;
    maxRetries = 2;
  } else if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
    guidance = "\n\n🌐 Network Error Solutions:\n1. Check internet connection\n2. Try again in a few minutes\n3. Disable VPN/proxy if active\n4. Allow browser permissions for this site";
    shouldRetry = true;
    maxRetries = 2;
  } else if (errorMessage.includes("memory") || errorMessage.includes("Memory")) {
    guidance = "\n\n💾 Memory Error Solutions:\n1. Close other browser tabs\n2. Try a smaller model (Llama 3.2 1B)\n3. Restart browser\n4. Use a device with more RAM";
    shouldRetry = false;
    maxRetries = 0;
  } else {
    guidance = "\n\n💡 General Solutions:\n1. Refresh the page (F5)\n2. Try a different model\n3. Use Chrome or Edge browser\n4. Check browser console for details";
    shouldRetry = true;
    maxRetries = 1;
  }

  return { guidance, shouldRetry, maxRetries };
};

/**
 * Wait with countdown display
 */
export const waitWithCountdown = async (
  seconds: number, 
  onUpdate: (message: string) => void,
  errorMessage: string,
  modelId: string
): Promise<void> => {
  for (let i = seconds; i > 0; i--) {
    onUpdate(`Retrying ${modelId} in ${i}s... (${errorMessage})`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
};
