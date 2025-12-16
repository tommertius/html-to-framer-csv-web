# Project TODO

## Core Features
- [x] Backend: Port Python conversion logic to TypeScript
- [x] Backend: Create tRPC procedure for file upload and conversion
- [x] Backend: Integrate with Manus LLM for SEO generation
- [x] Backend: Integrate with Manus Vision AI for image alt text
- [x] Backend: Generate CSV output from converted data
- [x] Frontend: File upload interface (HTML + image)
- [x] Frontend: Framer-style UI design (clean, minimal, centered modal)
- [x] Frontend: Conversion progress indicator
- [x] Frontend: CSV download functionality
- [x] Frontend: Error handling and user feedback

## Bugs
- [x] Fix CSV download - Framer import fails with "url must be a valid uri" error
- [x] Fix image URL - S3 storage returns relative path instead of full URL with https://
- [x] Fix filename encoding - Special characters and spaces in filenames break CloudFront URLs

- [x] Fix date field - Should use upload date consistently, not conversion processing date
- [x] Fix date format - Use ISO8601 format (YYYY-MM-DD) instead of nl-NL locale format for Framer compatibility
- [x] Fix sources detection - Should recognize "Referenties" regardless of heading level (H2, H3, etc.)
- [x] Fix duplicate "Referenties" title in sources column - Should only appear once

## New Features
- [x] Preview/edit screen - Show all generated fields after conversion with ability to edit before download
- [x] Editable fields: title, slug, meta title, meta description, keywords, preview, category, date, image alt
- [x] Download button on preview screen to generate CSV with edited values
- [x] Drag & drop support - Allow dragging files into upload areas
- [x] Zip file support - Extract HTML from zipped files automatically
- [x] Fix extra whitespace before tables in content output
- [x] Fix links in CSV - Handle nested links within span tags and extract clean URLs
- [x] Magical progress feedback - Show real-time updates during conversion with playful messaging
- [x] Progress steps: HTML parsing, SEO generation, image analysis, CSV creation
- [x] Animated progress indicators with emoji and "touch of magic" wording

## Recent Changes
- [x] Remove "Klaar!" step from progress messages to allow continuous looping until conversion completes
