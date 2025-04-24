export default async function AI() {
  return (
    <div className="prose prose-slate max-w-none">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-6">AI Use Disclosure</h1>

      <p className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
        <strong className="text-slate-700">Effective Date</strong>: April 22, 2025
        <br />
        <strong className="text-slate-700">Contact Email</strong>:{" "}
        <a href="mailto:me@vas3k.com" className="text-blue-600 hover:text-blue-800">
          me@vas3k.com
        </a>
        <br />
        <strong className="text-slate-700">Domain</strong>:{" "}
        <a href="https://taxhacker.app" className="text-blue-600 hover:text-blue-800">
          https://taxhacker.app
        </a>
      </p>

      <p className="text-gray-700 leading-relaxed mb-6">
        At TaxHacker, we use artificial intelligence (&quot;AI&quot;) to power the core features of our platform. This
        document outlines how and why we use AI technologies, what data is processed, and how it may affect you as a
        user.
      </p>

      <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">1. Purpose of AI in TaxHacker</h2>
      <p className="text-gray-700 leading-relaxed mb-3">AI is essential to the TaxHacker experience. It is used for:</p>
      <ul className="list-disc pl-6 space-y-2 mb-6 text-gray-700">
        <li>Optical Character Recognition (OCR) of scanned invoices and receipts</li>
        <li>Automatic categorization and tagging of financial transactions</li>
        <li>Summarization of expenses and vendor descriptions</li>
        <li>Smart field population and autofill within forms</li>
        <li>Custom prompt-driven workflows</li>
      </ul>
      <p className="text-gray-700 leading-relaxed mb-6">
        All AI-generated content is visible directly in the user interface and may be applied to your transactions,
        projects, and reports.
      </p>

      <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">2. AI Providers and Models</h2>
      <p className="text-gray-700 leading-relaxed mb-3">
        Our cloud-hosted version uses models provided by <strong>OpenAI</strong>, including:
      </p>
      <ul className="list-disc pl-6 space-y-2 mb-6 text-gray-700">
        <li>
          <strong>GPT-4o</strong> and <strong>GPT-4.1</strong>
        </li>
      </ul>
      <p className="text-gray-700 leading-relaxed mb-6">
        In the <strong>self-hosted version</strong>, users may choose to connect their own language models or AI
        backends. We do not monitor or vet these setups and assume no responsibility for their output.
      </p>

      <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">3. Data Sent for AI Processing</h2>
      <p className="text-gray-700 leading-relaxed mb-3">
        To deliver AI-powered features, we send selected user data to OpenAI&apos;s API, including:
      </p>
      <ul className="list-disc pl-6 space-y-2 mb-6 text-gray-700">
        <li>Uploaded documents (e.g., receipts, invoices)</li>
        <li>Associated transaction metadata and user-provided fields</li>
        <li>Historical context of past transactions (if required for analysis)</li>
      </ul>
      <p className="bg-amber-50 p-4 rounded-lg border border-amber-200 mb-4">
        <strong className="text-amber-600">⚠️ Note:</strong> This data is <strong>not anonymized or redacted</strong>{" "}
        before transmission. By using TaxHacker, you acknowledge and consent to this transfer.
      </p>
      <p className="text-gray-700 leading-relaxed mb-6">
        We store <strong>structured outputs</strong> from the AI (e.g., parsed fields, categorization) in your account
        for future use. We do <strong>not</strong> store raw AI prompts or responses beyond what's necessary to populate
        your data.
      </p>

      <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">4. Human Involvement</h2>
      <p className="text-gray-700 leading-relaxed mb-4">
        We do <strong>not</strong> manually review AI-generated content. There is currently no mechanism for human
        review, error flagging, or corrections.
      </p>
      <p className="text-gray-700 leading-relaxed mb-6">
        Users are solely responsible for verifying the accuracy of AI-processed outputs before using them for financial
        or reporting purposes.
      </p>

      <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">5. Opt-Out and Core Dependency</h2>
      <p className="text-gray-700 leading-relaxed mb-6">
        AI processing is a fundamental component of TaxHacker and cannot be disabled. If you do not consent to your data
        being processed via AI, you should not use the platform.
      </p>

      <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">6. Automated Decision-Making</h2>
      <p className="text-gray-700 leading-relaxed mb-4">
        Our AI systems do not make binding legal or financial decisions on your behalf. However, they may suggest
        categories, values, or summaries based on the data you provide.
      </p>
      <p className="text-gray-700 leading-relaxed mb-6">
        While these outputs may influence how your data is structured or interpreted, they are{" "}
        <strong>not used to make automated decisions with legal or significant effects</strong> as defined under GDPR
        Article 22.
      </p>

      <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">7. Risks and Limitations</h2>
      <p className="text-gray-700 leading-relaxed mb-4">
        AI-generated outputs are probabilistic and may contain errors, omissions, or misinterpretations. We make{" "}
        <strong>no guarantees of accuracy</strong>, completeness, or suitability for tax, legal, or financial purposes.
      </p>
      <p className="bg-red-50 p-4 rounded-lg border border-red-200 mb-6">
        <strong className="text-red-600">⚠️ Important:</strong> TaxHacker is <strong>not a substitute</strong> for a
        certified accountant, tax advisor, or legal counsel. Use at your own risk.
      </p>
    </div>
  )
}
