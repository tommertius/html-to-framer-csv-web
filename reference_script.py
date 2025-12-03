#!/usr/bin/env python3
"""
HTML to Framer CMS CSV Converter with AI-powered SEO generation
Converts Google Docs exported HTML blog articles to Framer CMS compatible CSV format.

Usage:
    python3 html_to_framer_csv.py <html_file> <image_url> [options]

Example:
    python3 html_to_framer_csv.py article.html "https://example.com/image.jpg" \
        --slug "my-article" \
        --meta-title "My Article Title" \
        --meta-description "Article description" \
        --keywords "keyword1, keyword2"
"""

import csv
import re
import argparse
import os
from datetime import datetime
from pathlib import Path

try:
    from bs4 import BeautifulSoup
except ImportError:
    print("Error: BeautifulSoup4 is required. Install with: pip3 install beautifulsoup4")
    exit(1)

try:
    from openai import OpenAI
except ImportError:
    print("Error: OpenAI is required. Install with: pip3 install openai")
    exit(1)

try:
    import requests
except ImportError:
    print("Error: requests is required. Install with: pip3 install requests")
    exit(1)


def analyze_image_with_vision(image_url):
    """Analyze image using vision AI and generate accessibility-focused alt text."""
    
    client = OpenAI()
    
    try:
        response = client.chat.completions.create(
            model="gemini-2.5-flash",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Beschrijf deze afbeelding in het Nederlands voor een screenreader. Geef een volledige, informatieve beschrijving van wat er visueel te zien is (kleuren, vormen, objecten, personen). Maximaal 125 tekens. Wees specifiek en compleet."
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": image_url
                            }
                        }
                    ]
                }
            ],
            max_tokens=300,
            temperature=0.3
        )
        
        alt_text = response.choices[0].message.content.strip()
        
        # Ensure it's not too long
        if len(alt_text) > 125:
            alt_text = alt_text[:122] + '...'
        
        return alt_text
        
    except Exception as e:
        print(f"Warning: Vision AI analysis failed ({e}), using fallback")
        return None


def element_to_html(elem, is_content=True):
    """Convert BeautifulSoup element to clean Framer-compatible HTML."""
    
    if elem.name == 'p':
        html = '<p>'
        
        for child in elem.children:
            if isinstance(child, str):
                text = child.strip()
                if text:
                    html += text + ' '
            elif child.name == 'span':
                classes = child.get('class', [])
                text_content = child.get_text().strip()
                if 'c9' in classes:  # bold (Google Docs class)
                    html += f'<strong>{text_content}</strong> '
                elif 'c26' in classes:  # italic (Google Docs class)
                    if is_content:
                        # Close current p and start new one for italic
                        html = html.rstrip() + '</p><p><em>' + text_content + '</em>'
                    else:
                        html += f'<em>{text_content}</em> '
                else:
                    html += text_content + ' '
            elif child.name == 'a':
                href = child.get('href', '')
                html += f'<a href="{href}">{child.get_text()}</a> '
            elif child.name == 'br':
                # BR creates new paragraph
                if is_content:
                    html = html.rstrip() + '</p><p>'
        
        html = html.rstrip() + '</p>'
        return html.replace('  ', ' ')
    
    elif elem.name in ['h2', 'h3']:
        text = elem.get_text().strip()
        return f'<h2>{text}</h2>'
    
    elif elem.name == 'table':
        # Only ONE blank line before table
        html = '<p><br></p><table>'
        for row in elem.find_all('tr'):
            html += '<tr>'
            for cell in row.find_all(['td', 'th']):
                tag = cell.name
                text = cell.get_text().strip()
                html += f'<{tag}>{text}</{tag}>'
            html += '</tr>'
        html += '</table>'
        return html
    
    return ''


def generate_seo_fields_with_ai(title, first_paragraph, content_preview):
    """Generate SEO fields using AI with professional guidelines."""
    
    client = OpenAI()
    
    prompt = f"""Je bent een SEO-specialist en content manager voor DutchStartup.ai, het platform dat het Nederlandse AI-ecosysteem verbindt en zichtbaar maakt.

DOELGROEP:
Een algemeen persoon met affiniteit voor technologie en specifiek AI. Mensen die wel wat van de wereld weten (zoals namen van grote bedrijven) maar niet iedere founder of technologie kennen.

ARTIKEL INFORMATIE:
Titel: {title}
Eerste paragraaf: {first_paragraph}
Content preview: {content_preview[:500]}

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

5. IMAGE ALT (max 125 tekens):
   - SEO-vriendelijk
   - Beschrijvend voor de context van het artikel
   - Relevant voor Nederlandse AI/startup ecosysteem

6. CATEGORY:
   Kies EXACT een van deze drie categorieën:
   - "Founders & Startups" - Wanneer het gaat over founders of profielen van Nederlandse AI bedrijven
   - "Nederlandse AI in de wereld" - Wanneer het gaat over internationaal nieuws of succesverhalen op grote schaal
   - "Investeren in Nederlandse AI" - Wanneer het gaat over regels, investeringsklimaat of nieuws dat hierbij aansluit

FORMAAT VAN JE ANTWOORD (exact deze structuur):
META_TITLE: [jouw meta title]
META_DESCRIPTION: [jouw meta description]
KEYWORDS: [keyword1, keyword2, keyword3, keyword4, keyword5]
PREVIEW: [jouw preview tekst]
CATEGORY: [exact een van de drie categorieën]

NOTE: Image alt text wordt apart gegenereerd via vision AI, dus niet nodig in deze output.
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {"role": "system", "content": "Je bent een expert SEO-specialist en content manager voor DutchStartup.ai. Je schrijft professionele, natuurlijke en wervende SEO-content die voldoet aan moderne SEO best practices. Je vermijdt clichés en AI-achtige formuleringen."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=700
        )
        
        result = response.choices[0].message.content.strip()
        
        # Parse the result
        seo_fields = {}
        for line in result.split('\n'):
            if line.startswith('META_TITLE:'):
                seo_fields['meta_title'] = line.replace('META_TITLE:', '').strip()
            elif line.startswith('META_DESCRIPTION:'):
                seo_fields['meta_description'] = line.replace('META_DESCRIPTION:', '').strip()
            elif line.startswith('KEYWORDS:'):
                seo_fields['keywords'] = line.replace('KEYWORDS:', '').strip()
            elif line.startswith('PREVIEW:'):
                seo_fields['preview'] = line.replace('PREVIEW:', '').strip()
            elif line.startswith('CATEGORY:'):
                seo_fields['category'] = line.replace('CATEGORY:', '').strip()
        
        return seo_fields
        
    except Exception as e:
        print(f"Warning: AI generation failed ({e}), using fallback methods")
        return None


def determine_category_fallback(title, content):
    """Fallback: Determine category based on content analysis."""
    combined = f"{title} {content}".lower()
    
    # Category keywords
    founders_keywords = ['founder', 'oprichter', 'startup', 'bedrijf', 'ceo', 'ondernemer', 'profiel']
    international_keywords = ['internationaal', 'wereld', 'global', 'europa', 'amerika', 'succes', 'groei', 'schaal']
    investment_keywords = ['investering', 'kapitaal', 'funding', 'venture', 'regels', 'wet', 'beleid', 'klimaat', 'financiering']
    
    # Count matches
    founders_score = sum(1 for kw in founders_keywords if kw in combined)
    international_score = sum(1 for kw in international_keywords if kw in combined)
    investment_score = sum(1 for kw in investment_keywords if kw in combined)
    
    # Determine category
    scores = {
        'Founders & Startups': founders_score,
        'Nederlandse AI in de wereld': international_score,
        'Investeren in Nederlandse AI': investment_score
    }
    
    # Return category with highest score, default to Founders & Startups
    max_category = max(scores.items(), key=lambda x: x[1])
    return max_category[0] if max_category[1] > 0 else 'Founders & Startups'


def generate_meta_title_fallback(title, max_length=60):
    """Fallback: Generate SEO-optimized meta title (50-60 characters)."""
    if len(title) <= max_length:
        return title
    
    # Try to truncate at word boundary
    truncated = title[:max_length].rsplit(' ', 1)[0]
    return truncated


def generate_meta_description_fallback(first_paragraph, max_length=155):
    """Fallback: Generate SEO-optimized meta description (150-155 characters)."""
    # Clean the text
    clean_text = re.sub(r'\s+', ' ', first_paragraph).strip()
    
    if len(clean_text) <= max_length:
        return clean_text
    
    # Truncate at sentence boundary if possible
    sentences = re.split(r'[.!?]\s+', clean_text)
    description = ""
    for sentence in sentences:
        if len(description) + len(sentence) + 1 <= max_length:
            description += sentence + ". "
        else:
            break
    
    # If we have a good description, return it
    if len(description.strip()) >= 100:
        return description.strip()
    
    # Otherwise truncate at word boundary
    truncated = clean_text[:max_length].rsplit(' ', 1)[0]
    if not truncated.endswith('.'):
        truncated += '.'
    return truncated


def generate_keywords_fallback(title, content, count=5):
    """Fallback: Generate relevant keywords from title and content."""
    # Combine title and content
    text = f"{title} {content}".lower()
    
    # Remove common Dutch stop words
    stop_words = {'de', 'het', 'een', 'en', 'van', 'in', 'op', 'is', 'voor', 'met', 
                  'aan', 'als', 'dat', 'die', 'dit', 'te', 'zijn', 'er', 'ook', 'om',
                  'naar', 'bij', 'door', 'maar', 'niet', 'heeft', 'kan', 'wordt', 'deze',
                  'zijn', 'worden', 'werd', 'was', 'uit', 'over', 'onder', 'na', 'nog',
                  'zich', 'meer', 'geen', 'wel', 'waar', 'dan', 'zo'}
    
    # Extract words (3+ characters)
    words = re.findall(r'\b[a-zà-ÿ]{3,}\b', text)
    
    # Count word frequency
    word_freq = {}
    for word in words:
        if word not in stop_words:
            word_freq[word] = word_freq.get(word, 0) + 1
    
    # Get top keywords
    top_keywords = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:count]
    
    return ', '.join([word for word, _ in top_keywords])


def generate_preview_fallback(first_paragraph, max_sentences=2):
    """Fallback: Generate intriguing preview text (1-2 sentences)."""
    # Split into sentences
    sentences = re.split(r'[.!?]\s+', first_paragraph)
    
    # Take first 1-2 sentences
    preview_sentences = sentences[:max_sentences]
    preview = '. '.join(preview_sentences)
    
    # Ensure it ends with punctuation
    if not preview.endswith(('.', '!', '?')):
        preview += '.'
    
    return preview


def generate_image_alt_fallback(title, max_length=125):
    """Fallback: Generate SEO-friendly image alt text."""
    # More contextual alt text for DutchStartup.ai
    alt = f"Illustratie bij artikel over {title.lower()}"
    
    if len(alt) <= max_length:
        return alt
    
    # Truncate at word boundary
    truncated = alt[:max_length].rsplit(' ', 1)[0]
    return truncated


def convert_html_to_framer_csv(html_file, image_url, output_file=None, use_ai=True, **metadata):
    """
    Convert HTML blog article to Framer CMS CSV format.
    
    Args:
        html_file: Path to HTML file (Google Docs export)
        image_url: URL of the article's featured image
        output_file: Output CSV file path (optional, auto-generated if not provided)
        use_ai: Whether to use AI for SEO generation (default: True)
        **metadata: Optional metadata fields (slug, meta_title, meta_description, etc.)
    
    Returns:
        Path to generated CSV file
    """
    
    # Read HTML file
    with open(html_file, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Extract title (H1)
    title_tag = soup.find('h1')
    title = title_tag.get_text().strip() if title_tag else ''
    
    # Extract first paragraph (H4)
    first_p_tag = soup.find('h4')
    first_paragraph = first_p_tag.get_text().strip() if first_p_tag else ''
    
    # Find HR to split content and sources
    content_elements = []
    sources_elements = []
    found_hr = False
    
    for element in soup.body.children:
        if element.name == 'hr':
            found_hr = True
            continue
        
        if not found_hr:
            if element.name in ['h1', 'h4']:  # Skip title and first paragraph
                continue
            if element.name:
                content_elements.append(element)
        else:
            if element.name:
                sources_elements.append(element)
    
    # Convert to clean HTML
    content_html = ''.join([element_to_html(e, is_content=True) for e in content_elements if e.name])
    sources_html = '<h2>Referenties</h2>' + ''.join([element_to_html(e, is_content=False) for e in sources_elements if e.name and e.name != 'h2'])
    
    # Remove empty paragraphs
    content_html = content_html.replace('<p></p>', '').replace('<p> </p>', '')
    sources_html = sources_html.replace('<p></p>', '').replace('<p> </p>', '')
    
    # Calculate reading time (200-250 words per minute, using 225 as average)
    word_count = len(re.findall(r'\w+', soup.get_text()))
    reading_time = max(1, round(word_count / 225))
    
    # Generate slug from title if not provided
    slug = metadata.get('slug')
    if not slug:
        slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')
    
    # Get content preview for AI generation
    content_text = soup.get_text()
    content_preview = ' '.join(content_text.split()[:200])  # First 200 words
    
    # Try AI generation first if enabled and no metadata provided
    ai_generated = False
    if use_ai and not all([metadata.get('meta_title'), metadata.get('meta_description'), 
                           metadata.get('keywords'), metadata.get('preview'), 
                           metadata.get('category')]):
        print("🤖 Generating SEO fields with AI...")
        seo_fields = generate_seo_fields_with_ai(title, first_paragraph, content_preview)
        
        if seo_fields:
            ai_generated = True
            # Use AI-generated fields if not provided in metadata
            if not metadata.get('meta_title'):
                metadata['meta_title'] = seo_fields.get('meta_title')
            if not metadata.get('meta_description'):
                metadata['meta_description'] = seo_fields.get('meta_description')
            if not metadata.get('keywords'):
                metadata['keywords'] = seo_fields.get('keywords')
            if not metadata.get('preview'):
                metadata['preview'] = seo_fields.get('preview')
            if not metadata.get('category'):
                metadata['category'] = seo_fields.get('category')
    
    # Fallback to rule-based generation for any missing fields
    meta_title = metadata.get('meta_title') or generate_meta_title_fallback(title, max_length=60)
    meta_description = metadata.get('meta_description') or generate_meta_description_fallback(first_paragraph, max_length=155)
    keywords = metadata.get('keywords') or generate_keywords_fallback(title, content_text, count=5)
    preview = metadata.get('preview') or generate_preview_fallback(first_paragraph, max_sentences=2)
    
    # Generate image alt text using vision AI if not provided
    image_alt = metadata.get('image_alt')
    if not image_alt and image_url:
        print("🖼️  Analyzing image with vision AI...")
        image_alt = analyze_image_with_vision(image_url)
        if image_alt:
            print(f"✨ Vision AI generated alt text: {image_alt}")
        else:
            print("⚠️  Vision AI failed, using fallback")
            image_alt = generate_image_alt_fallback(title, max_length=125)
    elif not image_alt:
        image_alt = generate_image_alt_fallback(title, max_length=125)
    
    category = metadata.get('category') or determine_category_fallback(title, content_text)
    
    # Other metadata with defaults
    date = metadata.get('date', datetime.now().strftime("%d-%m-%Y"))
    
    # Generate output filename if not provided
    if not output_file:
        output_file = f"{slug}.csv"
    
    # Create CSV
    with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile, quoting=csv.QUOTE_ALL)
        
        writer.writerow([
            'Title', 'Slug', 'Meta Title', 'Meta Description', 'Keywords', 
            'Preview', 'Category', 'Date', 'Reading Time', 'Image', 'Image:alt',
            'First Paragraph', 'Content', 'Sources'
        ])
        
        writer.writerow([
            title, slug, meta_title, meta_description, keywords, preview, category,
            date, f"{reading_time} min", image_url, image_alt, first_paragraph,
            content_html, sources_html
        ])
    
    if ai_generated:
        print("✨ SEO fields generated with AI")
    
    print(f"\n📊 Generated fields:")
    print(f"   Category: {category}")
    print(f"   Image Alt: {image_alt}")
    
    return output_file


def main():
    parser = argparse.ArgumentParser(
        description='Convert HTML blog article to Framer CMS CSV format with AI-powered SEO',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Basic usage with AI SEO generation
  python3 html_to_framer_csv.py article.html "https://example.com/image.jpg"
  
  # Without AI (fallback only)
  python3 html_to_framer_csv.py article.html "https://example.com/image.jpg" --no-ai
  
  # With custom metadata
  python3 html_to_framer_csv.py article.html "https://example.com/image.jpg" \\
      --slug "my-article" \\
      --meta-title "Custom SEO Title" \\
      --meta-description "Custom meta description for SEO" \\
      --keywords "AI, healthcare, Netherlands" \\
      --category "Founders & Startups"
        """
    )
    
    parser.add_argument('html_file', help='Path to HTML file (Google Docs export)')
    parser.add_argument('image_url', help='URL of the featured image')
    parser.add_argument('-o', '--output', help='Output CSV file path')
    parser.add_argument('--no-ai', action='store_true', help='Disable AI SEO generation')
    parser.add_argument('--slug', help='URL slug (auto-generated from title if not provided)')
    parser.add_argument('--meta-title', help='SEO meta title (AI-generated if not provided)')
    parser.add_argument('--meta-description', help='SEO meta description (AI-generated if not provided)')
    parser.add_argument('--keywords', help='SEO keywords (AI-generated if not provided)')
    parser.add_argument('--preview', help='Article preview text (AI-generated if not provided)')
    parser.add_argument('--category', help='Article category (AI-selected if not provided)')
    parser.add_argument('--image-alt', help='Image alt text (AI-generated if not provided)')
    
    args = parser.parse_args()
    
    # Check if HTML file exists
    if not Path(args.html_file).exists():
        print(f"Error: HTML file not found: {args.html_file}")
        exit(1)
    
    # Prepare metadata
    metadata = {
        'slug': args.slug,
        'meta_title': args.meta_title,
        'meta_description': args.meta_description,
        'keywords': args.keywords,
        'preview': args.preview,
        'category': args.category,
        'image_alt': args.image_alt,
    }
    
    # Remove None values
    metadata = {k: v for k, v in metadata.items() if v is not None}
    
    # Convert
    output_file = convert_html_to_framer_csv(
        args.html_file,
        args.image_url,
        args.output,
        use_ai=not args.no_ai,
        **metadata
    )
    
    print(f"\n✅ CSV created successfully: {output_file}")
    print(f"\nYou can now import this CSV into Framer CMS!")


if __name__ == '__main__':
    main()
