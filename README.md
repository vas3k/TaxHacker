<div align="center"><a name="readme-top"></a>

<img src="public/logo/512.png" alt="" width="320">

<br>

# TaxHacker — self-hosted AI accountant

[![GitHub Stars](https://img.shields.io/github/stars/vas3k/TaxHacker?color=ffcb47&labelColor=black&style=flat-square)](https://github.com/vas3k/TaxHacker/stargazers)
[![License](https://img.shields.io/badge/license-MIT-ffcb47?labelColor=black&style=flat-square)](https://github.com/vas3k/TaxHacker/blob/main/LICENSE)
[![GitHub Issues](https://img.shields.io/github/issues/vas3k/TaxHacker?color=ff80eb&labelColor=black&style=flat-square)](https://github.com/vas3k/TaxHacker/issues)
[![Donate](https://img.shields.io/badge/-Donate-f04f88?logo=githubsponsors&logoColor=white&style=flat-square)](https://vas3k.com/donate/)

</div>

TaxHacker is a self-hosted accounting app designed for freelancers, indie hackers, and small businesses who want to save time and automate expense and income tracking using the power of modern AI.

Upload photos of receipts, invoices, or PDFs, and TaxHacker will automatically recognize and extract all the important data you need for accounting: product names, amounts, items, dates, merchants, taxes, and save it into a structured Excel-like database. You can even create custom fields with your own AI prompts to extract any specific information you need.

The app features automatic currency conversion (including crypto!) based on historical exchange rates from the transaction date. With built-in filtering, multi-project support, import/export capabilities, and custom categories, TaxHacker simplifies reporting and makes tax filing a bit easier.

> 🎥 [Watch demo video](public/landing/video.mp4)

![Dashboard](public/landing/main-page.webp)

> \[!IMPORTANT]
>
> This project is still in early development. Use at your own risk! **Star us** to get notified about new features and bugfixes ⭐️

## ✨ Features

### `1` Analyze photos and invoices with AI

![Currency Conversion](public/landing/ai-scanner-big.webp)

Snap a photo of any receipt or upload an invoice PDF, and TaxHacker will automatically recognize, extract, categorize, and store all the information in a structured database.

- **Upload and organize your docs**: Store multiple documents in "unsorted" until you're ready to process them manually or with AI assistance
- **AI data extraction**: Use AI to automatically pull key information like dates, amounts, vendors, and line items
- **Auto-categorization**: Transactions are automatically sorted into relevant categories based on their content
- **Item splitting**: Extract individual items from invoices and split them into separate transactions when needed
- **Structured storage**: Everything gets saved in an organized database for easy filtering and retrieval
- **Customizable AI providers**: Choose from OpenAI, Google Gemini, or Mistral (local LLM support coming soon)

TaxHacker works with a wide variety of documents, including store receipts, restaurant bills, invoices, bank statements, letters, even handwritten receipts. It handles any language and any currency with ease.

### `2` Multi-currency support with automatic conversion (even crypto!)

![Currency Conversion](public/landing/multi-currency.webp)

TaxHacker automatically detects currencies in your documents and converts them to your base currency using historical exchange rates.

- **Foreight currency detection**: Automatically identify the currency used in any document
- **Historical rates**: Get conversion rates from the actual transaction date
- **All-world coverage**: Support for 170+ world currencies and 14 popular cryptocurrencies (BTC, ETH, LTC, DOT, and more)
- **Flexible input**: Manual entry is always available when you need more control

### `3` Organize your transactions using fully customizable categories, projects and fields

![Transactions Table](public/landing/transactions-big.webp)

Adapt TaxHacker to your unique needs with unlimited customization options. Create custom fields, projects, and categories that better suit your specific needs, idustry standards or country.

- **Custom categories and projecst**: Create your own categories and projects to group your transactions in any convenient way
- **Custom fields**: You can create unlimited number of custom fields to extraxt more information from your invoices (it's like creating extra columns in Excel)
- **Full-text search**: Search through the actual content of recognized documents
- **Advanced filtering**: Find exactly what you need with search and filter options
- **AI-powered extraction**: Write your own prompts to extract any custom information from documents
- **Bulk operations**: Process multiple documents or transactions at once

### `4` Customize any LLM prompt. Even system ones

![Custom Categories](public/landing/custom-llm.webp)

Take full control of how TaxHacker's AI processes your documents. Write custom AI prompts for fields, categories, and projects, or modify the built-in ones to match your specific needs.

- **Customizable system prompts**: Modify the general prompt template in settings to suit your business
- **Field or project-specific prompts**: Create custom extraction rules for your industry-specific documents
- **Full control**: Adjust field extraction priorities and naming conventions to match your workflow
- **Industry optimization**: Fine-tune the AI to understand your specific type of business documents
- **Full transparency**: Every aspect of the AI extraction process is under your control and can be changed right in settings

TaxHacker is 100% adaptable and tunable to your unique requirements — whether you need to extract emails, addresses, project codes, or any other custom information from your documents.

### `5` Flexible data filtering and export

![Data Export](public/landing/export.webp)

Once your documents are processed, easily view, filter, and export your complete transaction history exactly how you need it.

- **Advanced filtering**: Filter by date ranges, categories, projects, amounts, and any custom fields
- **Flexible exports**: Export filtered transactions to CSV with all attached documents included
- **Tax-ready reports**: Generate comprehensive reports for your accountant or tax advisor
- **Data portability**: Download complete data archives to migrate to other services—your data stays yours

### `6` Self-hosted mode for data privacy

![Self-hosting](docs/screenshots/exported_archive.png)

Keep complete control over your financial data with local storage and self-hosting options. TaxHacker respects your privacy and gives you full ownership of your information.

- **Home server ready**: Host on your own infrastructure for maximum privacy and control
- **Docker native**: Simple setup with provided Docker containers and compose files
- **Data ownership**: Your financial documents never leaves your control
- **No vendor lock-in**: Export everything and migrate whenever you want
- **Transparent operations**: Full access to source code and complete operational transparency

## 🛳 Deployment and Self-hosting

TaxHacker can be easily self-hosted on your own infrastructure for complete control over your data and application environment. We provide a [Docker image](./Dockerfile) and [Docker Compose](./docker-compose.yml) setup that makes deployment simple:

```bash
curl -O https://raw.githubusercontent.com/vas3k/TaxHacker/main/docker-compose.yml

docker compose up
```

The Docker Compose setup includes:

- TaxHacker application container
- PostgreSQL 17 database (or connect to your existing database)
- Automatic database migrations on startup
- Volume mounts for persistent data storage
- Production-ready configuration

New Docker images are automatically built and published with every release. You can use specific version tags (e.g., `v1.0.0`) or `latest` for the most recent version.

For advanced setups, you can customize the Docker Compose configuration to fit your infrastructure. The default configuration uses the pre-built image from GitHub Container Registry, but you can also build locally using the provided [Dockerfile](./Dockerfile).

Example custom configuration:

```yaml
services:
  app:
    image: ghcr.io/vas3k/taxhacker:latest
    ports:
      - "7331:7331"
    environment:
      - SELF_HOSTED_MODE=true
      - UPLOAD_PATH=/app/data/uploads
      - DATABASE_URL=postgresql://postgres:postgres@localhost:5432/taxhacker
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

### Environment Variables

Configure TaxHacker for your specific needs with these environment variables:

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `UPLOAD_PATH` | Yes | Local directory for file uploads and storage | `./data/uploads` |
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://user@localhost:5432/taxhacker` |
| `PORT` | No | Port to run the application on | `7331` (default) |
| `BASE_URL` | No | Base URL for the application | `http://localhost:7331` |
| `SELF_HOSTED_MODE` | No | Set to "true" for self-hosting: enables auto-login, custom API keys, and additional features | `true` |
| `DISABLE_SIGNUP` | No | Disable new user registration on your instance | `false` |
| `BETTER_AUTH_SECRET` | Yes | Secret key for authentication (minimum 16 characters) | `your-secure-random-key` |

You can also configure LLM provider settings in the application or via environment variables:

- **OpenAI**: `OPENAI_MODEL_NAME` and `OPENAI_API_KEY`
- **Google Gemini**: `GOOGLE_MODEL_NAME` and `GOOGLE_API_KEY`
- **Mistral**: `MISTRAL_MODEL_NAME` and `MISTRAL_API_KEY`

## ⌨️ Local Development

We use:

- **Next.js 15+** for the frontend and API
- **Prisma** for database models and migrations
- **PostgreSQL** as the database (PostgreSQL 17+ recommended)
- **Ghostscript and GraphicsMagick** for PDF processing (install on macOS via `brew install gs graphicsmagick`)

Set up your local development environment:

```bash
# Clone the repository
git clone https://github.com/vas3k/TaxHacker.git
cd TaxHacker

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Edit .env with your configuration
# Make sure to set DATABASE_URL to your PostgreSQL connection string
# Example: postgresql://user@localhost:5432/taxhacker

# Initialize the database
npx prisma generate && npx prisma migrate dev

# Start the development server
npm run dev
```

Visit `http://localhost:7331` to see your local TaxHacker instance in action.

For a production build, instead of `npm run dev` use the following commands:

```bash
# Build the application
npm run build

# Start the production server
npm run start
```

## 🤝 Contributing

We welcome contributions to TaxHacker! Here's how you can help make it even better:

- **🐛 Bug Reports**: File detailed issues when you encounter problems
- **💡 Feature Requests**: Share your ideas for new features and improvements
- **🔧 Code Contributions**: Submit pull requests to improve the application
- **📚 Documentation**: Help improve documentation and guides
- **🎥 Content Creation**: Videos, tutorials, and reviews help us reach more users!

All development happens on GitHub through issues and pull requests. We appreciate any help.

[![PRs Welcome](https://img.shields.io/badge/🤯_PRs-welcome-ffcb47?labelColor=black&style=for-the-badge)](https://github.com/vas3k/TaxHacker/pulls)

## ❤️ Support the Project

If TaxHacker has helped you save time or manage your finances better, consider supporting its continued development! Your donations help us maintain the project, add new features, and keep it free and open source. Every contribution helps ensure we can keep improving and maintaining this tool for the community.

[![Thank the TaxHacker devs](https://img.shields.io/badge/❤️-donate%20to%20Taxhacker%20devs-f08080?labelColor=black&style=for-the-badge)](https://vas3k.com/donate/)

## 📄 License

TaxHacker is licensed under the [MIT License](LICENSE).
