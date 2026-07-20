import React from "react"

interface EmailLayoutProps {
  children: React.ReactNode
  preview?: string
}

export const EmailLayout: React.FC<EmailLayoutProps> = ({ children, preview = "" }) => (
  <html>
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="color-scheme" content="light" />
      <meta name="supported-color-schemes" content="light" />
      {preview && <title>{preview}</title>}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 0;
          color: #333;
          background-color: #f9f9f9;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .header {
          margin-bottom: 20px;
          text-align: left;
        }
        .logo {
          width: 60px;
          height: 60px;
          margin-bottom: 10px;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
      `,
        }}
      />
    </head>
    <body>
      <div className="container">{children}</div>
    </body>
  </html>
)
