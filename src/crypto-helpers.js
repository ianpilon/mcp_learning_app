/**
 * Helper functions for cryptocurrency pricing tool in the MCP Learning App
 */

/**
 * Format currency values with appropriate symbol and decimals
 * @param {number} value - The value to format
 * @param {string} currency - The currency code (e.g., 'usd', 'eur')
 * @returns {string} - Formatted currency string
 */
function formatCurrency(value, currency = 'usd') {
  if (typeof value !== 'number') return 'N/A';
  
  const currencySymbols = {
    usd: '$',
    eur: '€',
    gbp: '£',
    jpy: '¥',
    btc: '₿',
    eth: 'Ξ'
  };
  
  const symbol = currencySymbols[currency.toLowerCase()] || '';
  const decimals = ['jpy'].includes(currency.toLowerCase()) ? 0 : 2;
  
  return `${symbol}${value.toFixed(decimals)}`;
}

/**
 * Extract cryptocurrency parameters from a query string
 * @param {string} query - The query string to analyze
 * @returns {Object} - Extracted parameters
 */
function extractCryptoParams(query) {
  console.log('Extracting crypto params from query:', query);
  const lowerQuery = query.toLowerCase();
  const params = {
    action: 'getPrice',
    coinId: 'cardano',
    currency: 'usd'
  };
  
  // Check if this is a staking calculation
  if (lowerQuery.includes('stake') || lowerQuery.includes('staking') || lowerQuery.includes('apy')) {
    params.action = 'calculateStaking';
    params.amount = 10000; // Default amount
    params.years = 1;     // Default period
    params.apy = 5;       // Default APY
    
    // First, extract all numbers from the query
    const allNumbers = [];
    const numberRegex = /\b(\d+(?:[,\.]\d+)*)\b/g;
    let match;
    
    while ((match = numberRegex.exec(lowerQuery)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (match.index === numberRegex.lastIndex) {
        numberRegex.lastIndex++;
      }
      
      // Remove commas and convert to number
      const cleanNumber = match[1].replace(/,/g, '');
      allNumbers.push({
        value: parseFloat(cleanNumber),
        index: match.index,
        text: match[0]
      });
    }
    
    console.log('All numbers found in query:', allNumbers);
    
    // Look for numbers near 'ada', 'cardano', 'stake', etc.
    if (allNumbers.length > 0) {
      // First, try to find a number directly followed by 'ada' or 'cardano'
      const adaMatch = lowerQuery.match(/\b(\d+(?:[,\.]\d+)*)\s*(?:ada|cardano|tokens?|coins?)\b/i);
      if (adaMatch) {
        const extractedAmount = adaMatch[1].replace(/,/g, '');
        params.amount = parseFloat(extractedAmount);
        console.log('Found amount with ada/cardano:', extractedAmount, '→ Parsed as:', params.amount);
      } 
      // Then try to find a number after 'stake'
      else if (lowerQuery.includes('stake')) {
        // Find the position of 'stake'
        const stakeIndex = lowerQuery.indexOf('stake');
        
        // Find the closest number after 'stake'
        const numbersAfterStake = allNumbers.filter(n => n.index > stakeIndex);
        if (numbersAfterStake.length > 0) {
          params.amount = numbersAfterStake[0].value;
          console.log('Found amount after stake:', numbersAfterStake[0].text, '→ Parsed as:', params.amount);
        }
      }
      // If still not found, just use the first number in the query
      else {
        params.amount = allNumbers[0].value;
        console.log('Using first number in query as amount:', allNumbers[0].text, '→ Parsed as:', params.amount);
      }
    } else {
      console.log('No numbers found in query, using default amount:', params.amount);
    }
    
    // Try to extract years
    const yearsMatch = lowerQuery.match(/\b(\d+)\s*(years?|yrs?)\b/i);
    if (yearsMatch) {
      params.years = parseFloat(yearsMatch[1]);
    }
    
    // Try to extract APY
    const apyMatch = lowerQuery.match(/\b(\d+(?:\.\d+)?)\s*(%|percent|apy)\b/i);
    if (apyMatch) {
      params.apy = parseFloat(apyMatch[1]);
    }
  }
  // Check if this is a search query
  else if (lowerQuery.includes('find') || lowerQuery.includes('search') || lowerQuery.includes('list')) {
    params.action = 'search';
    params.query = query;
  }
  // Otherwise it's a price query
  else {
    // Try to identify the coin
    const coins = {
      'ada': 'cardano',
      'cardano': 'cardano',
      'btc': 'bitcoin',
      'bitcoin': 'bitcoin',
      'eth': 'ethereum',
      'ethereum': 'ethereum',
      'dot': 'polkadot',
      'polkadot': 'polkadot',
      'sol': 'solana',
      'solana': 'solana'
    };
    
    for (const [keyword, coinId] of Object.entries(coins)) {
      if (lowerQuery.includes(keyword)) {
        params.coinId = coinId;
        break;
      }
    }
    
    // Try to identify the currency
    const currencies = ['usd', 'eur', 'gbp', 'jpy', 'btc', 'eth'];
    for (const currency of currencies) {
      if (lowerQuery.includes(currency)) {
        params.currency = currency;
        break;
      }
    }
  }
  
  return params;
}

// Export the helper functions
window.formatCurrency = formatCurrency;
window.extractCryptoParams = extractCryptoParams;
