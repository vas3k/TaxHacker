import config from "@/lib/config"

export default async function PrivacyPolicy() {
  return (
    <div className="prose prose-slate max-w-none">
      <h2 className="text-3xl font-bold mb-6 text-slate-900 border-b pb-2">
        <strong>Privacy Policy</strong>
      </h2>

      <p className="text-slate-700 mb-6 leading-relaxed bg-yellow-50 p-3 border-l-4 border-yellow-400">
        <strong className="text-slate-800">TL;DR:</strong> If you really care about privacy of your data, use our
        self-hosted version instead. No cloud is safe. Use the platform is at your own risk.
      </p>

      <p className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
        <strong className="text-slate-700">Effective Date</strong>: April 22, 2025
        <br />
        <strong className="text-slate-700">Contact Email</strong>:{" "}
        <a href={`mailto:${config.app.supportEmail}`} className="text-blue-600 hover:text-blue-800">
          {config.app.supportEmail}
        </a>
        <br />
        <strong className="text-slate-700">Domain</strong>:{" "}
        <a href="https://taxhacker.app" className="text-blue-600 hover:text-blue-800">
          https://taxhacker.app
        </a>
      </p>

      <p className="text-slate-700 mb-6 leading-relaxed">
        TaxHacker (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is committed to protecting your privacy. This
        Privacy Policy describes how we collect, use, store, and protect your personal data when you use our services at{" "}
        <a href="https://taxhacker.app" className="text-blue-600 hover:text-blue-800">
          taxhacker.app
        </a>
        .
      </p>

      <hr className="my-8 border-slate-200" />

      <h3 className="text-2xl font-semibold text-slate-800 mb-4">
        1. <strong>What Data We Collect</strong>
      </h3>
      <p className="text-slate-700 mb-3">We collect the following types of data when you use TaxHacker:</p>
      <ul className="list-disc pl-6 mb-6 space-y-2 text-slate-700">
        <li>
          <strong className="text-slate-800">Account Data</strong>: Email address, display name, optional avatar image.
          No passwords are stored.
        </li>
        <li>
          <strong className="text-slate-800">Communication Data</strong>: Email messages we send for verification,
          updates, or newsletters.
        </li>
        <li>
          <strong className="text-slate-800">Uploaded Files</strong>: Invoices, receipts and any other files that you
          upload, which may contain sensitive personal or financial information.
        </li>
        <li>
          <strong className="text-slate-800">Session Metadata</strong>: IP address, browser type, and timestamps for
          session security.
        </li>
        <li>
          <strong className="text-slate-800">Service Usage Data</strong>: Metadata related to your activity within the
          platform (e.g. number of uploaded files, AI tokens usage).
        </li>
      </ul>

      <hr className="my-8 border-slate-200" />

      <h3 className="text-2xl font-semibold text-slate-800 mb-4">
        2. <strong>How We Use Your Data</strong>
      </h3>
      <p className="text-slate-700 mb-3">We use your data to:</p>
      <ul className="list-disc pl-6 mb-6 space-y-2 text-slate-700">
        <li>Create and manage your TaxHacker account</li>
        <li>Store and analyze your uploaded files</li>
        <li>Improve your financial organization through AI-powered insights</li>
        <li>Communicate with you about your account and service updates</li>
        <li>Comply with legal obligations</li>
      </ul>

      <hr className="my-8 border-slate-200" />

      <h3 className="text-2xl font-semibold text-slate-800 mb-4">
        3. <strong>AI-Powered Processing</strong>
      </h3>
      <p className="text-slate-700 mb-3">
        We use external AI services, specifically <strong className="text-slate-800">OpenAI (ChatGPT)</strong>, to:
      </p>
      <ul className="list-disc pl-6 mb-4 space-y-2 text-slate-700">
        <li>Extract and interpret information from invoices using OCR</li>
        <li>Analyze financial data for better user insights</li>
      </ul>

      <p className="text-slate-700 mb-6 leading-relaxed">
        By using TaxHacker, you consent to the transfer of relevant data to these third-party providers for the purpose
        of processing. These providers may operate outside the EU, in compliance with appropriate safeguards under GDPR
        (e.g., SCCs).
      </p>

      <hr className="my-8 border-slate-200" />

      <h3 className="text-2xl font-semibold text-slate-800 mb-4">
        4. <strong>Cookies and Tracking</strong>
      </h3>
      <p className="text-slate-700 mb-6 leading-relaxed">
        TaxHacker does <strong className="text-slate-800">not use tracking cookies</strong> or third-party analytics. We
        only collect aggregate access logs and usage statistics via{" "}
        <strong className="text-slate-800">Cloudflare</strong> for infrastructure performance and security.
      </p>

      <hr className="my-8 border-slate-200" />

      <h3 className="text-2xl font-semibold text-slate-800 mb-4">
        5. <strong>Data Storage and Security</strong>
      </h3>
      <ul className="list-disc pl-6 mb-4 space-y-2 text-slate-700">
        <li>
          All data is stored on servers in <strong className="text-slate-800">Germany</strong>, hosted by{" "}
          <strong className="text-slate-800">Hetzner Cloud</strong>.
        </li>
        <li>Files and personal data are stored in an unencrypted form.</li>
        <li>Access to personal data is limited to authorized team members for debugging or support purposes only.</li>
      </ul>

      <p className="text-slate-700 mb-6 leading-relaxed bg-yellow-50 p-3 border-l-4 border-yellow-400">
        While we strive to maintain reasonable safeguards, no system is completely secure. Use the platform at your own
        risk.
      </p>

      <hr className="my-8 border-slate-200" />

      <h3 className="text-2xl font-semibold text-slate-800 mb-4">
        6. <strong>Legal Basis for Processing</strong>
      </h3>
      <p className="text-slate-700 mb-3">We process personal data based on:</p>
      <ul className="list-disc pl-6 mb-4 space-y-2 text-slate-700">
        <li>
          <strong className="text-slate-800">Your consent</strong>, which you grant when you create an account or upload
          data
        </li>
        <li>
          <strong className="text-slate-800">Our contractual obligations</strong> to provide the services you signed up
          for
        </li>
      </ul>

      <p className="text-slate-700 mb-6 leading-relaxed">
        You can withdraw consent at any time by deleting your account or contacting us directly.
      </p>

      <hr className="my-8 border-slate-200" />

      <h3 className="text-2xl font-semibold text-slate-800 mb-4">
        7. <strong>Data Retention</strong>
      </h3>
      <p className="text-slate-700 mb-3">We retain your data:</p>
      <ul className="list-disc pl-6 mb-4 space-y-2 text-slate-700">
        <li>As long as your account remains active</li>
        <li>Until you request deletion</li>
      </ul>

      <p className="text-slate-700 mb-6 leading-relaxed">
        Once deleted, your data is removed from our systems, though some residual logs may remain for a short time due
        to backups or operational needs.
      </p>

      <hr className="my-8 border-slate-200" />

      <h3 className="text-2xl font-semibold text-slate-800 mb-4">
        8. <strong>Your Rights (under GDPR and similar laws)</strong>
      </h3>
      <p className="text-slate-700 mb-3">As a user, you have the right to:</p>
      <ul className="list-disc pl-6 mb-4 space-y-2 text-slate-700">
        <li>Access and review your personal data</li>
        <li>Correct or update inaccurate information</li>
        <li>Download a full backup of your data</li>
        <li>Request permanent deletion of your account and associated data</li>
        <li>Object to certain forms of processing</li>
        <li>Lodge a complaint with a data protection authority</li>
      </ul>

      <p className="text-slate-700 mb-6 leading-relaxed">
        To exercise your rights, contact us at{" "}
        <a href={`mailto:${config.app.supportEmail}`} className="text-blue-600 hover:text-blue-800">
          {config.app.supportEmail}
        </a>
        .
      </p>

      <hr className="my-8 border-slate-200" />

      <h3 className="text-2xl font-semibold text-slate-800 mb-4">
        9. <strong>Children's Privacy</strong>
      </h3>
      <p className="text-slate-700 mb-6 leading-relaxed">
        TaxHacker is <strong className="text-slate-800">not intended for users under the age of 18</strong>. We do not
        knowingly collect or store data from minors.
      </p>

      <hr className="my-8 border-slate-200" />

      <h3 className="text-2xl font-semibold text-slate-800 mb-4">
        10. <strong>Changes to This Policy</strong>
      </h3>
      <p className="text-slate-700 mb-6 leading-relaxed">
        We may update this Privacy Policy from time to time. Any changes will be published on this page with an updated
        &quot;Effective Date.&quot; We encourage you to review the policy periodically.
      </p>
    </div>
  )
}
