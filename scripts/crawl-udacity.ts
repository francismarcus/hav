import { startCrawl, checkCrawlStatus } from '../lib/crawl';

async function crawlUdacity() {
  try {
    console.log('Starting crawl of udacity.com...');
    const result = await startCrawl('https://udacity.com');

    if (!result.success || !result.crawlId) {
      throw new Error(result.error || 'Failed to get crawl ID');
    }

    console.log('Crawl started successfully!');
    console.log('Crawl ID:', result.crawlId);
    console.log('Firecrawl ID:', result.firecrawlId);

    // Wait for 30 seconds
    console.log('\nWaiting 30 seconds before checking status...');
    await new Promise((resolve) => setTimeout(resolve, 30000));

    // Check the status
    console.log('\nChecking crawl status...');
    const statusResult = await checkCrawlStatus(result.crawlId);

    if (!statusResult.success) {
      throw new Error(statusResult.error);
    }

    console.log('Crawl status:', statusResult.status);
    if (statusResult.data?.scrapes) {
      console.log('Number of pages scraped:', statusResult.data.scrapes.length);
    }
  } catch (error) {
    console.error(
      'Error:',
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
    process.exit(1);
  }
}

// Run the crawl
crawlUdacity();
