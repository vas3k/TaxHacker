# Paperless-ngx Integration

TaxHacker supports bidirectional integration with [Paperless-ngx](https://docs.paperless-ngx.com/), a popular self-hosted document management system. Import documents from Paperless-ngx into TaxHacker for AI-powered financial data extraction, and export processed transactions back to Paperless-ngx for long-term archival.

## Setup

### 1. Get your Paperless-ngx API token

In your Paperless-ngx instance, navigate to **My Profile** (click your username in the top-right) and scroll to **Auth Tokens**. Click **+ Add** to generate a new token. Copy it.

### 2. Configure TaxHacker

Navigate to **Settings > Paperless-ngx** in TaxHacker and fill in:

| Field | Description | Example |
|-------|-------------|---------|
| **Enable** | Toggle the integration on/off | Checked |
| **Paperless-ngx URL** | Full URL to your Paperless-ngx instance | `https://paperless.example.com` |
| **API Token** | The token you generated above | `abc123...` |
| **Default Tags** | (Optional) Comma-separated tag names to apply when exporting | `taxhacker, invoices` |

Click **Save Settings**, then **Test Connection** to verify everything works. A successful test will show the number of documents in your Paperless-ngx instance.

## Importing Documents

### From the sidebar

Click **Import from Paperless** in the sidebar to open the import page.

### How it works

1. TaxHacker fetches your document list from Paperless-ngx (server-side -- your API token never leaves the server)
2. Browse, search, and paginate through your Paperless-ngx documents
3. Select the documents you want to import using the checkboxes
4. Click **Import N documents**
5. Each selected document is downloaded and saved to TaxHacker's unsorted files
6. Navigate to **Unsorted** to analyze them with AI, just like any other uploaded document

### Deduplication

TaxHacker tracks the Paperless-ngx document ID for each imported file. If you try to import a document that's already been imported, it will be automatically skipped. The import summary shows how many documents were imported vs. skipped.

### What gets imported

| Paperless-ngx | TaxHacker |
|---------------|-----------|
| Original document file (PDF, image) | Saved as unsorted file |
| Title, tags, correspondent, date | Stored in file metadata for reference |
| OCR content (first 2000 chars) | Stored in file metadata |
| Document ID | Stored on file record for deduplication |

After import, the documents enter TaxHacker's normal processing pipeline -- you can run AI analysis, edit extracted data, and save as transactions.

## Exporting Transactions

### From the transactions page

1. Go to **Transactions**
2. Select one or more transactions using the checkboxes
3. Click **Export to Paperless** in the bottom action bar (only visible when Paperless-ngx is configured)
4. Choose a **correspondent** and **tags** to apply in Paperless-ngx
5. Click **Export to Paperless-ngx**

### How it works

1. For each selected transaction, TaxHacker uploads all associated files to Paperless-ngx
2. Files that were previously exported (already have a Paperless document ID) are skipped
3. TaxHacker polls the Paperless-ngx task queue until each upload is consumed
4. On success, the Paperless-ngx document ID is saved back to the TaxHacker file record

### What gets exported

| TaxHacker | Paperless-ngx |
|-----------|---------------|
| Document file (PDF, image) | Uploaded as new document |
| Transaction name | Document title |
| Transaction date | Document created date |
| Selected tags | Applied as tags |
| Selected correspondent | Applied as correspondent |

## Architecture

All Paperless-ngx API calls are made **server-side** via Next.js server actions. The API token is stored in the database (Setting model) and is never sent to the browser.

### Files

```
lib/paperless/
  types.ts          # TypeScript interfaces for Paperless-ngx API
  client.ts         # HTTP client (native fetch, auth, pagination, error handling)
  settings.ts       # Helper to create client from user settings
  index.ts          # Re-exports

app/(app)/settings/paperless/
  page.tsx           # Settings page
  actions.ts         # Test connection server action

app/(app)/import/paperless/
  page.tsx           # Import page
  actions.ts         # Fetch + import server actions

app/(app)/export/paperless/
  actions.ts         # Fetch metadata + export server actions

components/settings/paperless-settings-form.tsx   # Settings form
components/import/paperless.tsx                    # Import UI
components/export/paperless-export-dialog.tsx      # Export dialog
```

### Database

The `File` model has a `paperlessDocumentId` (nullable integer) field used for deduplication:

```sql
ALTER TABLE "files" ADD COLUMN "paperless_document_id" INTEGER;
CREATE INDEX "files_user_id_paperless_document_id_idx"
  ON "files"("user_id", "paperless_document_id");
```

Settings are stored in the `Setting` model (key-value pairs per user):
- `paperless_enabled` -- `"true"` or `"false"`
- `paperless_url` -- Base URL of the Paperless-ngx instance
- `paperless_api_token` -- API token
- `paperless_default_tags` -- Comma-separated default tag names

## Security

- **SSRF prevention**: The Paperless URL is validated to only allow `http:` and `https:` schemes
- **Server-side only**: All API calls happen in server actions, never from the browser
- **Token storage**: The API token is stored in the database and transmitted via hidden form fields only within server actions
- **Request timeout**: All Paperless API requests have a 30-second timeout

## Troubleshooting

### "Connection failed" on test

- Verify the URL includes the protocol (e.g., `https://paperless.example.com`, not just `paperless.example.com`)
- Verify the URL does not include a trailing `/api/` -- TaxHacker adds this automatically
- Check that TaxHacker can reach the Paperless-ngx instance on the network (especially if both are in Docker -- they may need to share a network)
- Verify the API token is correct and has not expired

### "Invalid API token or insufficient permissions"

- Regenerate the API token in Paperless-ngx and update it in TaxHacker settings
- Ensure the Paperless-ngx user has sufficient permissions to list/read/create documents

### Import shows 0 documents

- Verify Paperless-ngx has documents. The test connection button shows the total document count.
- Check the Paperless-ngx logs for API errors

### Export fails with timeout

- Large files may take longer to upload. The upload timeout is 60 seconds, and task polling waits up to 20 seconds for consumption.
- Check Paperless-ngx consumer logs for processing errors
- Ensure Paperless-ngx has sufficient disk space

## Paperless-ngx API Reference

This integration uses the following Paperless-ngx API endpoints:

| Endpoint | Method | Usage |
|----------|--------|-------|
| `/api/` | GET | Connection test |
| `/api/documents/` | GET | List and search documents |
| `/api/documents/<id>/` | GET | Get document metadata |
| `/api/documents/<id>/download/` | GET | Download document file |
| `/api/documents/post_document/` | POST | Upload new document |
| `/api/tasks/` | GET | Poll upload task status |
| `/api/tags/` | GET | List tags |
| `/api/correspondents/` | GET | List correspondents |

Full API documentation: [Paperless-ngx API docs](https://docs.paperless-ngx.com/api/)
