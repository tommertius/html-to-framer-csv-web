# HTML to Framer CSV Converter (Web App)

Modern web-based tool to convert HTML articles (Google Docs exports) and images into Framer CMS-importable CSV files with AI-powered SEO generation.

## Features

- 🎨 **Framer-style UI** - Clean, minimal interface inspired by Framer plugins
- 🤖 **AI-Powered SEO** - Automatic generation of meta titles, descriptions, and keywords using Manus LLM
- 👁️ **Vision AI** - Automatic image alt text generation for accessibility
- 📁 **Simple Upload** - Drag & drop HTML files and images
- 💾 **Direct Download** - Get your CSV file ready for Framer import
- 🔧 **Smart Sanitization** - Automatic filename cleaning for CloudFront compatibility

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS 4
- **Backend**: Express, tRPC (type-safe API)
- **AI**: Manus LLM & Vision AI integration
- **Parsing**: JSDOM for HTML processing
- **CSV**: PapaParse for CSV generation

## Quick Start

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Run development server**:
   ```bash
   pnpm dev
   ```

3. **Build for production**:
   ```bash
   pnpm build
   pnpm start
   ```

## How It Works

1. Upload an HTML file (exported from Google Docs) and an image
2. The backend:
   - Extracts title, content, and structure from HTML
   - Generates SEO fields (meta title, description, keywords) using AI
   - Analyzes the image and generates accessibility-friendly alt text
   - Creates a slug and calculates reading time
   - Formats everything into a Framer-compatible CSV
3. Download the CSV file
4. Import into Framer CMS

## Project Structure

```
├── client/              # React frontend
│   ├── src/
│   │   ├── pages/      # Page components
│   │   ├── components/ # Reusable UI components (shadcn/ui)
│   │   └── lib/        # tRPC client setup
├── server/              # Express backend
│   ├── _core/          # Framework (OAuth, LLM, storage)
│   ├── converter.ts    # HTML to CSV conversion logic
│   ├── converterRouter.ts # tRPC API endpoints
│   └── uploadRouter.ts # File upload handling
├── drizzle/            # Database schema
└── shared/             # Shared types and constants
```

## Environment Variables

The app uses Manus platform environment variables (automatically injected):

- `BUILT_IN_FORGE_API_URL` - Manus API endpoint
- `BUILT_IN_FORGE_API_KEY` - API authentication
- `DATABASE_URL` - Database connection
- `JWT_SECRET` - Session management

## Development

- **Type checking**: `pnpm check`
- **Tests**: `pnpm test`
- **Format code**: `pnpm format`

## License

MIT
