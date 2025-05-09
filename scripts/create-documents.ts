import { db } from '../lib/db';
import { scrape } from '../lib/db/schema/scrape';
import { documents } from '../lib/db/schema/documents';
import { createDocument } from '../lib/actions/document';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    // Fetch all scrapes
    const scrapes = await db.select().from(scrape);

    console.log(`Found ${scrapes.length} scrapes to process`);

    for (const scrapeData of scrapes) {
      try {
        // Check if document with this source already exists
        const [existingDocument] = await db
          .select()
          .from(documents)
          .where(sql`${documents.metadata}->>'source' = ${scrapeData.url}`);

        if (existingDocument) {
          console.log(`Document already exists for URL: ${scrapeData.url}`);
          continue;
        }

        if (!scrapeData.title || !scrapeData.description) {
          console.log(
            `Skipping scrape ${scrapeData.id} - missing title or description`
          );
          continue;
        }

        const result = await createDocument({
          content: scrapeData.markdown,
          metadata: {
            source: scrapeData.url,
            title: scrapeData.title,
            description: scrapeData.description,
          },
        });

        console.log(`Created document for ${scrapeData.url}: ${result}`);
      } catch (error) {
        console.error(`Error processing scrape ${scrapeData.id}:`, error);
      }
    }

    console.log('Finished processing all scrapes');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
