export default async function Terms() {
  return (
    <div className="prose prose-slate max-w-none">
      <h1 className="text-3xl font-bold mb-6 text-slate-900 border-b pb-2">Terms of Service</h1>
      <p className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
        <strong className="text-slate-700">Effective Date:</strong> April 22, 2025
        <br />
        <strong className="text-slate-700">Service:</strong>{" "}
        <a href="https://taxhacker.app" className="text-blue-600 hover:text-blue-800">
          https://taxhacker.app
        </a>
        <br />
        <strong className="text-slate-700">Contact:</strong>{" "}
        <a href="mailto:me@vas3k.com" className="text-blue-600 hover:text-blue-800">
          me@vas3k.com
        </a>
      </p>

      <p className="text-slate-700 mb-6 leading-relaxed">
        These Terms of Service (&quot;Terms&quot;) govern your access to and use of TaxHacker, an automated invoice
        analyzer and expense tracker powered by artificial intelligence (AI). By accessing or using our services, you
        agree to be bound by these Terms.
      </p>

      <h2 className="text-2xl font-semibold text-slate-800 mb-4">1. Service Overview</h2>
      <p className="text-slate-700 mb-3">TaxHacker offers:</p>
      <ul className="list-disc pl-6 mb-6 space-y-2 text-slate-700">
        <li>
          A <strong className="text-slate-800">cloud-based platform</strong> with paid subscription tiers
          (monthly/yearly)
        </li>
        <li>
          A <strong className="text-slate-800">self-hosted version</strong> available for free with no support
          guarantees
        </li>
      </ul>
      <p className="text-slate-700 mb-6 leading-relaxed">
        Users can upload invoices and receipts, analyze transactions, and manage expenses via AI-powered tools. The
        service is primarily designed for freelancers and small businesses.
      </p>

      <h2 className="text-2xl font-semibold text-slate-800 mb-4">2. Eligibility and Account Use</h2>
      <ul className="list-disc pl-6 mb-6 space-y-2 text-slate-700">
        <li>
          You must be at least <strong className="text-slate-800">18 years old</strong> to use TaxHacker.
        </li>
        <li>
          You may register and maintain <strong className="text-slate-800">multiple accounts</strong>.
        </li>
        <li>
          You are responsible for maintaining the confidentiality of access credentials and for all activities under
          your account.
        </li>
      </ul>

      <h2 className="text-2xl font-semibold text-slate-800 mb-4">3. Subscriptions & Payments</h2>
      <ul className="list-disc pl-6 mb-6 space-y-2 text-slate-700">
        <li>
          Paid plans are managed through <strong className="text-slate-800">Stripe</strong>, and all subscriptions{" "}
          <strong className="text-slate-800">renew automatically</strong> unless cancelled.
        </li>
        <li>You may cancel your subscription or delete your account at any time via your dashboard.</li>
        <li>
          We offer a <strong className="text-slate-800">no-questions-asked refund policy</strong>, but reserve the right
          to <strong className="text-slate-800">deduct costs</strong> for AI usage (e.g., token consumption) and
          third-party service charges already incurred.
        </li>
      </ul>

      <h2 className="text-2xl font-semibold text-slate-800 mb-4">4. User Responsibilities</h2>
      <ul className="list-disc pl-6 mb-6 space-y-2 text-slate-700">
        <li>
          You may upload any invoice or receipt <strong className="text-slate-800">at your discretion</strong>, but{" "}
          <strong className="text-slate-800">you are solely responsible</strong> for the content you upload.
        </li>
        <li>
          <strong className="text-slate-800">Illegal, fraudulent, or copyrighted material</strong> without permission is
          strictly prohibited. Violations may lead to immediate account suspension or termination.
        </li>
        <li>
          You{" "}
          <strong className="text-slate-800">may not redistribute, resell, or offer our AI analysis or services</strong>{" "}
          to third parties without our written consent.
        </li>
      </ul>

      <h2 className="text-2xl font-semibold text-slate-800 mb-4">5. AI Usage and Third-Party Integrations</h2>
      <ul className="list-disc pl-6 mb-6 space-y-2 text-slate-700">
        <li>
          TaxHacker uses <strong className="text-slate-800">OpenAI (ChatGPT)</strong> and other third-party APIs to
          process and analyze documents.
        </li>
        <li>
          By using the service, you grant us permission to process your data through these providers under appropriate
          GDPR safeguards.
        </li>
        <li>
          We may allow community-developed <strong className="text-slate-800">plugins and integrations</strong> for
          extended functionality.
        </li>
      </ul>

      <h2 className="text-2xl font-semibold text-slate-800 mb-4">6. Intellectual Property</h2>
      <ul className="list-disc pl-6 mb-6 space-y-2 text-slate-700">
        <li>
          You retain <strong className="text-slate-800">full ownership</strong> of your uploaded content and all
          resulting analysis.
        </li>
        <li>
          TaxHacker does <strong className="text-slate-800">not claim any rights</strong> over your data.
        </li>
        <li>
          You are free to <strong className="text-slate-800">reuse, download, publish, or export</strong> any data
          processed by the service.
        </li>
      </ul>

      <h2 className="text-2xl font-semibold text-slate-800 mb-4">7. Limitations of Liability</h2>
      <ul className="list-disc pl-6 mb-6 space-y-2 text-slate-700">
        <li>
          TaxHacker is provided <strong className="text-slate-800">&quot;as is&quot;</strong>, without warranties of any
          kind.
        </li>
        <li>
          We make <strong className="text-slate-800">no guarantees</strong> about the accuracy of AI-generated outputs
          or the suitability of our services for accounting, tax filing, or compliance purposes.
        </li>
        <li className="bg-yellow-50 p-3 border-l-4 border-yellow-400">
          <strong className="text-slate-800">⚠️ Important:</strong> TaxHacker is{" "}
          <strong className="text-slate-800">not a substitute</strong> for professional tax or legal advice. You use the
          service <strong className="text-slate-800">at your own risk</strong>.
        </li>
      </ul>

      <h2 className="text-2xl font-semibold text-slate-800 mb-4">8. Service Modifications and Termination</h2>
      <ul className="list-disc pl-6 mb-6 space-y-2 text-slate-700">
        <li>
          We reserve the right to <strong className="text-slate-800">modify or discontinue</strong> the service at any
          time, with or without notice.
        </li>
        <li>We may suspend or terminate your account if you violate these Terms or abuse the service.</li>
      </ul>

      <h2 className="text-2xl font-semibold text-slate-800 mb-4">9. Governing Law and Dispute Resolution</h2>
      <p className="text-slate-700 mb-6 leading-relaxed">
        These Terms are governed by the laws of <strong className="text-slate-800">Germany</strong>.<br />
        Any disputes shall be resolved exclusively in the courts located in{" "}
        <strong className="text-slate-800">Germany</strong>, unless otherwise required by applicable law.
      </p>

      <h2 className="text-2xl font-semibold text-slate-800 mb-4">10. Changes to These Terms</h2>
      <p className="text-slate-700 mb-6 leading-relaxed">
        We may revise these Terms at any time. If we make material changes, we'll notify users via email or in-app
        notification. Continued use after changes constitutes acceptance of the new Terms.
      </p>
    </div>
  )
}
