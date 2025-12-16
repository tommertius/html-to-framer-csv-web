import { JSDOM } from 'jsdom';
import { invokeLLM } from './_core/llm';
import Papa from 'papaparse';

interface ConversionMetadata {
  slug?: string;
  meta_title?: string;
  meta_description?: string;
  keywords?: string;
  preview?: string;
  category?: string;
  image_alt?: string;
  date?: string;
}

interface ConversionResult {
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  preview: string;
  category: string;
  date: string;
  readingTime: string;
  imageUrl: string;
  imageAlt: string;
  firstParagraph: string;
  content: string;
  sources: string;
}

/**
 * Convert BeautifulSoup-style element to clean Framer-compatible HTML
 */
function elementToHtml(element: Element, isContent: boolean = true): string {
  const tagName = element.tagName.toLowerCase();

  if (tagName === 'p') {
    let html = '<p>';
    
    for (const child of Array.from(element.childNodes)) {
      if (child.nodeType === 3) { // Text node
        const text = child.textContent?.trim();
        if (text) {
          html += text + ' ';
        }
      } else if (child.nodeType === 1) { // Element node
        const childElement = child as Element;
        const childTag = childElement.tagName.toLowerCase();
        const classes = childElement.className.split(' ');
        const textContent = childElement.textContent?.trim() || '';

        if (childTag === 'span') {
          if (classes.includes('c9')) { // bold
            html += `<strong>${textContent}</strong> `;
          } else if (classes.includes('c26')) { // italic
            if (isContent) {
              html = html.trimEnd() + '</p><p><em>' + textContent + '</em>';
            } else {
              html += `<em>${textContent}</em> `;
            }
          } else {
            html += textContent + ' ';
          }
        } else if (childTag === 'a') {
          const href = childElement.getAttribute('href') || '';
          html += `<a href="${href}">${textContent}</a> `;
        } else if (childTag === 'br') {
          if (isContent) {
            html = html.trimEnd() + '</p><p>';
          }
        }
      }
    }
    
    html = html.trimEnd() + '</p>';
    return html.replace(/  +/g, ' ');
  } else if (tagName === 'h2' || tagName === 'h3') {
    const text = element.textContent?.trim() || '';
    return `<h2>${text}</h2>`;
  } else if (tagName === 'table') {
    let html = '<table>';
    const rows = Array.from(element.querySelectorAll('tr'));
    for (const row of rows) {
      html += '<tr>';
      const cells = Array.from(row.querySelectorAll('td, th'));
      for (const cell of cells) {
        const tag = cell.tagName.toLowerCase();
        const text = cell.textContent?.trim() || '';
        html += `<${tag}>${text}</${tag}>`;
      }
      html += '</tr>';
    }
    html += '</table>';
    return html;
  }

  return '';
}

/**
 * Analyze image using vision AI and generate accessibility-focused alt text
 */
async function analyzeImageWithVision(imageUrl: string): Promise<string | null> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Beschrijf deze afbeelding in het Nederlands voor een screenreader. Geef een volledige, informatieve beschrijving van wat er visueel te zien is (kleuren, vormen, objecten, personen). Maximaal 125 tekens. Wees specifiek en compleet.'
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ]
    });

    const content = response.choices[0]?.message?.content;
    let altText = typeof content === 'string' ? content.trim() : '';
    
    // Ensure it's not too long
    if (altText.length > 125) {
      altText = altText.substring(0, 122) + '...';
    }
    
    return altText;
  } catch (error) {
    console.error('Vision AI analysis failed:', error);
    return null;
  }
}

/**
 * Generate SEO fields using AI with professional guidelines
 */
async function generateSeoFieldsWithAI(
  title: string,
  firstParagraph: string,
  contentPreview: string
): Promise<Partial<ConversionMetadata> | null> {
  const prompt = `Je bent een SEO-specialist en content manager voor DutchStartup.ai, het platform dat het Nederlandse AI-ecosysteem verbindt en zichtbaar maakt.

DOELGROEP:
Een algemeen persoon met affiniteit voor technologie en specifiek AI. Mensen die wel wat van de wereld weten (zoals namen van grote bedrijven) maar niet iedere founder of technologie kennen.

ARTIKEL INFORMATIE:
Titel: ${title}
Eerste paragraaf: ${firstParagraph}
Content preview: ${contentPreview.substring(0, 500)}

GENEREER DE VOLGENDE SEO-VELDEN:

1. META TITLE (50-60 tekens):
   - Inclusief hoofdkeyword
   - Wervend en aantrekkelijk
   - Sluit aan op de gegeven titel
   - Passend voor algemeen publiek met redelijke kennis van tech

2. META DESCRIPTION (150-155 tekens):
   Volg deze professionele SEO-richtlijnen:
   - Gebruik actieve taal en maak het actionable
   - Gebruik je focus keyphrase natuurlijk
   - Toon specificaties wanneer relevant
   - Zorg dat het matcht met de content
   - Maak het uniek en onderscheidend
   - GEEN clichématige call-to-actions zoals "Lees verder!" of "Ontdek meer!"
   - Wees professioneel en natuurlijk, niet AI-achtig
   - Geef concrete waarde of inzicht aan

3. KEYWORDS (4-5 relevante zoektermen):
   - Gescheiden door komma's
   - Relevant voor Nederlandse AI/tech/startup context
   - Focus op wat de doelgroep zou zoeken

4. PREVIEW (1-2 zinnen, max 200 tekens):
   - Dit is een intro/teaser voor het artikel
   - Moet teasen om verder te lezen
   - NIET te direct of nep
   - Professioneel en natuurlijk
   - Geef context en waarde
   - Geen clichés of overdreven marketing taal
   - SCHRIJF GEEN "dit artikel" of "deze blog" - blijf natuurlijk
   - Schrijf alsof je direct de content introduceert

5. CATEGORY:
   Kies EXACT een van deze drie categorieën:
   - "Founders & Startups" - Wanneer het gaat over founders of profielen van Nederlandse AI bedrijven
   - "Nederlandse AI in de wereld" - Wanneer het gaat over internationaal nieuws of succesverhalen op grote schaal
   - "Investeren in Nederlandse AI" - Wanneer het gaat over regels, investeringsklimaat of nieuws dat hierbij aansluit

FORMAAT VAN JE ANTWOORD (exact deze structuur):
META_TITLE: [jouw meta title]
META_DESCRIPTION: [jouw meta description]
KEYWORDS: [keyword1, keyword2, keyword3, keyword4, keyword5]
PREVIEW: [jouw preview tekst]
CATEGORY: [exact een van de drie categorieën]`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'Je bent een expert SEO-specialist en content manager voor DutchStartup.ai. Je schrijft professionele, natuurlijke en wervende SEO-content die voldoet aan moderne SEO best practices. Je vermijdt clichés en AI-achtige formuleringen.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const content = response.choices[0]?.message?.content;
    const result = typeof content === 'string' ? content.trim() : '';
    
    // Parse the result
    const seoFields: Partial<ConversionMetadata> = {};
    for (const line of result.split('\n')) {
      if (line.startsWith('META_TITLE:')) {
        seoFields.meta_title = line.replace('META_TITLE:', '').trim();
      } else if (line.startsWith('META_DESCRIPTION:')) {
        seoFields.meta_description = line.replace('META_DESCRIPTION:', '').trim();
      } else if (line.startsWith('KEYWORDS:')) {
        seoFields.keywords = line.replace('KEYWORDS:', '').trim();
      } else if (line.startsWith('PREVIEW:')) {
        seoFields.preview = line.replace('PREVIEW:', '').trim();
      } else if (line.startsWith('CATEGORY:')) {
        seoFields.category = line.replace('CATEGORY:', '').trim();
      }
    }
    
    return seoFields;
  } catch (error) {
    console.error('AI SEO generation failed:', error);
    return null;
  }
}

/**
 * Fallback: Determine category based on content analysis
 */
function determineCategoryFallback(title: string, content: string): string {
  const combined = `${title} ${content}`.toLowerCase();
  
  const foundersKeywords = ['founder', 'oprichter', 'startup', 'bedrijf', 'ceo', 'ondernemer', 'profiel'];
  const internationalKeywords = ['internationaal', 'wereld', 'global', 'europa', 'amerika', 'succes', 'groei', 'schaal'];
  const investmentKeywords = ['investering', 'kapitaal', 'funding', 'venture', 'regels', 'wet', 'beleid', 'klimaat', 'financiering'];
  
  const foundersScore = foundersKeywords.filter(kw => combined.includes(kw)).length;
  const internationalScore = internationalKeywords.filter(kw => combined.includes(kw)).length;
  const investmentScore = investmentKeywords.filter(kw => combined.includes(kw)).length;
  
  const scores = {
    'Founders & Startups': foundersScore,
    'Nederlandse AI in de wereld': internationalScore,
    'Investeren in Nederlandse AI': investmentScore
  };
  
  const maxCategory = Object.entries(scores).reduce((max, [cat, score]) => 
    score > max[1] ? [cat, score] : max
  , ['Founders & Startups', 0]);
  
  return maxCategory[1] > 0 ? maxCategory[0] : 'Founders & Startups';
}

/**
 * Fallback: Generate SEO-optimized meta title
 */
function generateMetaTitleFallback(title: string, maxLength: number = 60): string {
  if (title.length <= maxLength) {
    return title;
  }
  
  const truncated = title.substring(0, maxLength).split(' ').slice(0, -1).join(' ');
  return truncated;
}

/**
 * Fallback: Generate SEO-optimized meta description
 */
function generateMetaDescriptionFallback(firstParagraph: string, maxLength: number = 155): string {
  const cleanText = firstParagraph.replace(/\s+/g, ' ').trim();
  
  if (cleanText.length <= maxLength) {
    return cleanText;
  }
  
  const sentences = cleanText.split(/[.!?]\s+/);
  let description = '';
  for (const sentence of sentences) {
    if (description.length + sentence.length + 1 <= maxLength) {
      description += sentence + '. ';
    } else {
      break;
    }
  }
  
  if (description.trim().length >= 100) {
    return description.trim();
  }
  
  const truncated = cleanText.substring(0, maxLength).split(' ').slice(0, -1).join(' ');
  return truncated.endsWith('.') ? truncated : truncated + '.';
}

/**
 * Fallback: Generate relevant keywords from title and content
 */
function generateKeywordsFallback(title: string, content: string, count: number = 5): string {
  const text = `${title} ${content}`.toLowerCase();
  
  const stopWords = new Set(['de', 'het', 'een', 'en', 'van', 'in', 'op', 'is', 'voor', 'met', 
    'aan', 'als', 'dat', 'die', 'dit', 'te', 'zijn', 'er', 'ook', 'om',
    'naar', 'bij', 'door', 'maar', 'niet', 'heeft', 'kan', 'wordt', 'deze',
    'worden', 'werd', 'was', 'uit', 'over', 'onder', 'na', 'nog',
    'zich', 'meer', 'geen', 'wel', 'waar', 'dan', 'zo']);
  
  const words = text.match(/\b[a-zà-ÿ]{3,}\b/g) || [];
  
  const wordFreq: Record<string, number> = {};
  for (const word of words) {
    if (!stopWords.has(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  }
  
  const topKeywords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([word]) => word);
  
  return topKeywords.join(', ');
}

/**
 * Fallback: Generate intriguing preview text
 */
function generatePreviewFallback(firstParagraph: string, maxSentences: number = 2): string {
  const sentences = firstParagraph.split(/[.!?]\s+/);
  const previewSentences = sentences.slice(0, maxSentences);
  let preview = previewSentences.join('. ');
  
  if (!preview.endsWith('.') && !preview.endsWith('!') && !preview.endsWith('?')) {
    preview += '.';
  }
  
  return preview;
}

/**
 * Fallback: Generate SEO-friendly image alt text
 */
function generateImageAltFallback(title: string, maxLength: number = 125): string {
  const alt = `Illustratie bij artikel over ${title.toLowerCase()}`;
  
  if (alt.length <= maxLength) {
    return alt;
  }
  
  const truncated = alt.substring(0, maxLength).split(' ').slice(0, -1).join(' ');
  return truncated;
}

/**
 * Convert HTML blog article to Framer CMS data structure
 */
export async function convertHtmlToFramerData(
  htmlContent: string,
  imageUrl: string,
  useAI: boolean = true,
  metadata: ConversionMetadata = {},
  uploadDate?: Date
): Promise<ConversionResult> {
  const dom = new JSDOM(htmlContent);
  const document = dom.window.document;
  
  // Extract title (H1)
  const titleTag = document.querySelector('h1');
  const title = titleTag?.textContent?.trim() || '';
  
  // Extract first paragraph (H4)
  const firstPTag = document.querySelector('h4');
  const firstParagraph = firstPTag?.textContent?.trim() || '';
  
  // Find HR to split content and sources
  const contentElements: Element[] = [];
  const sourcesElements: Element[] = [];
  let foundHr = false;
  
  const bodyChildren = Array.from(document.body.children);
  for (const element of bodyChildren) {
    if (element.tagName.toLowerCase() === 'hr') {
      foundHr = true;
      continue;
    }
    
    if (!foundHr) {
      if (element.tagName.toLowerCase() === 'h1' || element.tagName.toLowerCase() === 'h4') {
        continue; // Skip title and first paragraph
      }
      contentElements.push(element);
    } else {
      sourcesElements.push(element);
    }
  }
  
  // Convert to clean HTML
  const contentHtml = contentElements
    .map(e => elementToHtml(e, true))
    .join('')
    .replace(/<p><\/p>/g, '')
    .replace(/<p> <\/p>/g, '');
  
  // Filter out any "Referenties" heading at any level (h1-h6)
  const filteredSourcesElements = sourcesElements.filter(e => {
    const tagName = e.tagName.toLowerCase();
    // Check if it's a heading element
    if (tagName.match(/^h[1-6]$/)) {
      const text = e.textContent?.trim().toLowerCase();
      // Remove if it contains "referenties" or "bronnen"
      return text !== 'referenties' && text !== 'bronnen';
    }
    return true;
  });
  
  const sourcesHtml = '<h2>Referenties</h2>' + 
    filteredSourcesElements
      .map(e => elementToHtml(e, false))
      .join('')
      .replace(/<p><\/p>/g, '')
      .replace(/<p> <\/p>/g, '');
  
  // Calculate reading time (225 words per minute)
  const wordCount = document.body.textContent?.match(/\w+/g)?.length || 0;
  const readingTime = Math.max(1, Math.round(wordCount / 225));
  
  // Generate slug from title if not provided
  let slug = metadata.slug;
  if (!slug) {
    slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  
  // Get content preview for AI generation
  const contentText = document.body.textContent || '';
  const contentPreview = contentText.split(/\s+/).slice(0, 200).join(' ');
  
  // Try AI generation first if enabled and no metadata provided
  let aiGenerated = false;
  if (useAI && (!metadata.meta_title || !metadata.meta_description || 
      !metadata.keywords || !metadata.preview || !metadata.category)) {
    console.log('🤖 Generating SEO fields with AI...');
    const seoFields = await generateSeoFieldsWithAI(title, firstParagraph, contentPreview);
    
    if (seoFields) {
      aiGenerated = true;
      if (!metadata.meta_title) metadata.meta_title = seoFields.meta_title;
      if (!metadata.meta_description) metadata.meta_description = seoFields.meta_description;
      if (!metadata.keywords) metadata.keywords = seoFields.keywords;
      if (!metadata.preview) metadata.preview = seoFields.preview;
      if (!metadata.category) metadata.category = seoFields.category;
    }
  }
  
  // Fallback to rule-based generation for any missing fields
  const metaTitle = metadata.meta_title || generateMetaTitleFallback(title, 60);
  const metaDescription = metadata.meta_description || generateMetaDescriptionFallback(firstParagraph, 155);
  const keywords = metadata.keywords || generateKeywordsFallback(title, contentText, 5);
  const preview = metadata.preview || generatePreviewFallback(firstParagraph, 2);
  
  // Generate image alt text using vision AI if not provided
  let imageAlt: string | undefined = metadata.image_alt;
  if (!imageAlt && imageUrl) {
    console.log('🖼️  Analyzing image with vision AI...');
    const visionResult = await analyzeImageWithVision(imageUrl);
    imageAlt = visionResult || undefined;
    if (imageAlt) {
      console.log(`✨ Vision AI generated alt text: ${imageAlt}`);
    } else {
      console.log('⚠️  Vision AI failed, using fallback');
      imageAlt = generateImageAltFallback(title, 125);
    }
  } else if (!imageAlt) {
    imageAlt = generateImageAltFallback(title, 125);
  }
  
  const category = metadata.category || determineCategoryFallback(title, contentText);
  // Use upload date if provided, otherwise use current date
  const dateToUse = uploadDate || new Date();
  // Format as ISO8601 (YYYY-MM-DD) for Framer compatibility
  const date = metadata.date || dateToUse.toISOString().split('T')[0];
  
  if (aiGenerated) {
    console.log('✨ SEO fields generated with AI');
  }
  
  console.log(`\n📊 Generated fields:`);
  console.log(`   Category: ${category}`);
  console.log(`   Image Alt: ${imageAlt}`);
  
  return {
    title,
    slug,
    metaTitle,
    metaDescription,
    keywords,
    preview,
    category,
    date,
    readingTime: `${readingTime} min`,
    imageUrl,
    imageAlt,
    firstParagraph,
    content: contentHtml,
    sources: sourcesHtml
  };
}

/**
 * Convert conversion result to CSV format
 */
export function convertToCSV(data: ConversionResult): string {
  const csvData = [
    {
      'Title': data.title,
      'Slug': data.slug,
      'Meta Title': data.metaTitle,
      'Meta Description': data.metaDescription,
      'Keywords': data.keywords,
      'Preview': data.preview,
      'Category': data.category,
      'Date': data.date,
      'Reading Time': data.readingTime,
      'Image': data.imageUrl,
      'Image:alt': data.imageAlt,
      'First Paragraph': data.firstParagraph,
      'Content': data.content,
      'Sources': data.sources
    }
  ];
  
  return Papa.unparse(csvData, {
    quotes: true,
    header: true
  });
}
