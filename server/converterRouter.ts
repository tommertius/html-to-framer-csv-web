import { z } from 'zod';
import { publicProcedure, router } from './_core/trpc';
import { convertHtmlToFramerData, convertToCSV } from './converter';
import { storagePut } from './storage';

export const converterRouter = router({
  /**
   * Convert HTML and image to Framer CSV
   * Accepts HTML content and image URL, returns CSV data
   */
  convert: publicProcedure
    .input(z.object({
      htmlContent: z.string(),
      imageUrl: z.string(),
      useAI: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      try {
        // Convert HTML to Framer data structure
        const result = await convertHtmlToFramerData(
          input.htmlContent,
          input.imageUrl,
          input.useAI
        );
        
        // Convert to CSV format
        const csvContent = convertToCSV(result);
        
        // Upload CSV to S3
        const fileName = `${result.slug}-${Date.now()}.csv`;
        const { url: csvUrl } = await storagePut(
          `conversions/${fileName}`,
          csvContent,
          'text/csv'
        );
        
        return {
          success: true,
          csvUrl,
          fileName,
          preview: {
            title: result.title,
            category: result.category,
            readingTime: result.readingTime,
          }
        };
      } catch (error) {
        console.error('Conversion error:', error);
        throw new Error(`Conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),
});
