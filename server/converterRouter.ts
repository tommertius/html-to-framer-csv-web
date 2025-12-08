import { z } from 'zod';
import { publicProcedure, router } from './_core/trpc';
import { convertHtmlToFramerData, convertToCSV } from './converter';

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
        // Use current timestamp as upload date
        const uploadDate = new Date();
        
        // Convert HTML to Framer data structure
        const result = await convertHtmlToFramerData(
          input.htmlContent,
          input.imageUrl,
          input.useAI,
          {}, // metadata
          uploadDate
        );
        
        // Convert to CSV format
        const csvContent = convertToCSV(result);
        const fileName = `${result.slug}.csv`;
        
        return {
          success: true,
          csvContent,
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
