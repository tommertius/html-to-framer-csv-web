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
          data: result, // Full conversion data for preview/edit
          csvContent,
          fileName,
        };
      } catch (error) {
        console.error('Conversion error:', error);
        throw new Error(`Conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),
  
  /**
   * Generate CSV from edited conversion data
   */
  generateCSV: publicProcedure
    .input(z.object({
      title: z.string(),
      slug: z.string(),
      metaTitle: z.string(),
      metaDescription: z.string(),
      keywords: z.string(),
      preview: z.string(),
      category: z.string(),
      date: z.string(),
      readingTime: z.string(),
      imageUrl: z.string(),
      imageAlt: z.string(),
      firstParagraph: z.string(),
      content: z.string(),
      sources: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        // Convert edited data to CSV
        const csvContent = convertToCSV(input);
        const fileName = `${input.slug}.csv`;
        
        return {
          success: true,
          csvContent,
          fileName,
        };
      } catch (error) {
        console.error('CSV generation error:', error);
        throw new Error(`CSV generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),
});
