import { describe, expect, it } from "vitest";
import { convertHtmlToFramerData, convertToCSV } from "./converter";

// Increase timeout for tests that may call external services
const TEST_TIMEOUT = 30000;

describe("HTML to Framer CSV Converter", () => {
  const sampleHtml = `
    <!DOCTYPE html>
    <html>
    <head><title>Test Article</title></head>
    <body>
      <h1>Test Artikel Titel</h1>
      <h4>Dit is de eerste paragraaf die een introductie geeft.</h4>
      <p>Dit is de eerste content paragraaf met wat <span class="c9">vetgedrukte</span> tekst.</p>
      <p>Dit is de tweede paragraaf met een <a href="https://example.com">link</a>.</p>
      <hr>
      <p>Bron 1: <a href="https://source1.com">Source One</a></p>
      <p>Bron 2: <a href="https://source2.com">Source Two</a></p>
    </body>
    </html>
  `;
  
  const sampleImageUrl = "https://example.com/test-image.jpg";

  it("should extract title from H1 tag", async () => {
    const result = await convertHtmlToFramerData(sampleHtml, sampleImageUrl, false);
    expect(result.title).toBe("Test Artikel Titel");
  }, TEST_TIMEOUT);

  it("should extract first paragraph from H4 tag", async () => {
    const result = await convertHtmlToFramerData(sampleHtml, sampleImageUrl, false);
    expect(result.firstParagraph).toBe("Dit is de eerste paragraaf die een introductie geeft.");
  }, TEST_TIMEOUT);

  it("should generate slug from title", async () => {
    const result = await convertHtmlToFramerData(sampleHtml, sampleImageUrl, false);
    expect(result.slug).toBe("test-artikel-titel");
  }, TEST_TIMEOUT);

  it("should calculate reading time", async () => {
    const result = await convertHtmlToFramerData(sampleHtml, sampleImageUrl, false);
    expect(result.readingTime).toMatch(/\d+ min/);
  }, TEST_TIMEOUT);

  it("should preserve HTML formatting in content", async () => {
    const result = await convertHtmlToFramerData(sampleHtml, sampleImageUrl, false);
    expect(result.content).toContain("<strong>");
    expect(result.content).toContain("<a href=");
  }, TEST_TIMEOUT);

  it("should separate sources from content", async () => {
    const result = await convertHtmlToFramerData(sampleHtml, sampleImageUrl, false);
    expect(result.sources).toContain("Referenties");
    expect(result.sources).toContain("source1.com");
    expect(result.sources).toContain("source2.com");
  }, TEST_TIMEOUT);

  it("should generate fallback SEO fields when AI is disabled", async () => {
    const result = await convertHtmlToFramerData(sampleHtml, sampleImageUrl, false);
    expect(result.metaTitle).toBeTruthy();
    expect(result.metaDescription).toBeTruthy();
    expect(result.keywords).toBeTruthy();
    expect(result.preview).toBeTruthy();
    expect(result.category).toBeTruthy();
  }, TEST_TIMEOUT);

  it("should generate fallback image alt text when AI is disabled", async () => {
    const result = await convertHtmlToFramerData(sampleHtml, sampleImageUrl, false);
    expect(result.imageAlt).toBeTruthy();
    expect(result.imageAlt.length).toBeLessThanOrEqual(125);
  }, TEST_TIMEOUT);

  it("should convert result to CSV format", async () => {
    const result = await convertHtmlToFramerData(sampleHtml, sampleImageUrl, false);
    const csv = convertToCSV(result);
    
    // Check CSV headers
    expect(csv).toContain("Title");
    expect(csv).toContain("Slug");
    expect(csv).toContain("Meta Title");
    expect(csv).toContain("Meta Description");
    expect(csv).toContain("Keywords");
    expect(csv).toContain("Preview");
    expect(csv).toContain("Category");
    expect(csv).toContain("Image:alt");
    expect(csv).toContain("Content");
    expect(csv).toContain("Sources");
    
    // Check CSV contains data
    expect(csv).toContain("Test Artikel Titel");
    expect(csv).toContain("test-artikel-titel");
  }, TEST_TIMEOUT);

  it("should handle custom metadata overrides", async () => {
    const customMetadata = {
      slug: "custom-slug",
      meta_title: "Custom Meta Title",
      category: "Founders & Startups"
    };
    
    const result = await convertHtmlToFramerData(
      sampleHtml, 
      sampleImageUrl, 
      false,
      customMetadata
    );
    
    expect(result.slug).toBe("custom-slug");
    expect(result.metaTitle).toBe("Custom Meta Title");
    expect(result.category).toBe("Founders & Startups");
  }, TEST_TIMEOUT);

  it("should include image URL in result", async () => {
    const result = await convertHtmlToFramerData(sampleHtml, sampleImageUrl, false);
    expect(result.imageUrl).toBe(sampleImageUrl);
  }, TEST_TIMEOUT);

  it("should generate valid category from predefined list", async () => {
    const result = await convertHtmlToFramerData(sampleHtml, sampleImageUrl, false);
    const validCategories = [
      "Founders & Startups",
      "Nederlandse AI in de wereld",
      "Investeren in Nederlandse AI"
    ];
    expect(validCategories).toContain(result.category);
  }, TEST_TIMEOUT);
});
