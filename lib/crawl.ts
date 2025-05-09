import Firecrawl, { ScrapeResponse } from '@mendable/firecrawl-js';
import { env } from './env.mjs';
import { db } from './db';
import { crawls, insertCrawlSchema } from './db/schema/crawl';
import { scrape, insertScrapeSchema } from './db/schema/scrape';
import { eq } from 'drizzle-orm';

const firecrawl = new Firecrawl({
  apiKey: env.FIRECRAWL_API_KEY,
});

interface CrawlResponse {
  success: boolean;
  error?: string;
  id?: string;
  status?: string;
  data?: {
    scrapes: ScrapeResponse[];
  };
}

export async function startCrawl(url: string) {
  try {
    // Start the async crawl
    const crawlResponse = (await firecrawl.asyncCrawlUrl(url, {
      limit: 50,
    })) as CrawlResponse;

    if (!crawlResponse.success) {
      throw new Error(`Failed to start crawl: ${crawlResponse.error}`);
    }

    const data = insertCrawlSchema.parse({
      url,
      status: 'pending',
      firecrawlId: crawlResponse.id,
    });

    const [crawl] = await db.insert(crawls).values(data).returning();

    return {
      success: true,
      crawlId: crawl.id,
      firecrawlId: crawlResponse.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function checkCrawlStatus(crawlId: string) {
  try {
    const [crawl] = await db
      .select()
      .from(crawls)
      .where(eq(crawls.firecrawlId, crawlId));

    if (!crawl) {
      console.log('Crawl not found, creating new crawl');
      await db.insert(crawls).values({
        id: crawlId,
        status: 'pending',
        firecrawlId: crawlId,
        url: 'https://udacity.com',
      });
    }

    const crawlResponse = (await firecrawl.checkCrawlStatus(
      crawlId
    )) as CrawlResponse;

    if (!crawlResponse.success) {
      throw new Error(`Failed to check crawl status: ${crawlResponse.error}`);
    }
    console.log('crawlResponse status ---->', crawlResponse.status);
    // @ts-ignore
    console.log('crawlResponse ---->', crawlResponse.data?.length);

    if (crawlResponse.status === 'completed' && crawlResponse.data) {
      console.log(crawlResponse.data[0])
      // @ts-ignore
      const scrapes = crawlResponse.data
        // @ts-ignore
        .map((scrape) => {
          const result = insertScrapeSchema.safeParse({
            url: scrape.metadata.url,
            markdown: scrape.markdown,
            title: scrape.metadata?.title,
            description: scrape.metadata?.description,
            statusCode: scrape.metadata?.statusCode,
            crawlId: crawl.id,
          });

       

          if (!result.success) {
            console.error('Failed to parse scrape:', {
              scrape,
              errors: result.error.errors,
            });
            return null;
          }

          return result.data;
        })
        .filter(
          (scrape: any): scrape is NonNullable<typeof scrape> => scrape !== null
        );

      console.log('Saving', scrapes.length, 'scrapes');
      // await db.insert(scrape).values(scrapes);
    }

    await db
      .update(crawls)
      .set({
        status: crawlResponse.status,
        updatedAt: new Date(),
      })
      .where(eq(crawls.id, crawlId));

    return {
      success: true,
      status: crawlResponse.status,
      data: crawlResponse.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
