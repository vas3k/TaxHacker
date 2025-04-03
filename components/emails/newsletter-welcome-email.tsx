import React from "react"
import { EmailLayout } from "./email-layout"

export const NewsletterWelcomeEmail: React.FC = () => (
  <EmailLayout preview="Welcome to TaxHacker Newsletter!">
    <h2 style={{ color: "#4f46e5" }}>👋 Welcome to TaxHacker!</h2>

    <p style={{ fontSize: "16px", lineHeight: "1.5", color: "#333" }}>
      Thank you for subscribing to our updates. We'll keep you updated about:
    </p>
    <ul
      style={{
        paddingLeft: "20px",
        fontSize: "16px",
        lineHeight: "1.5",
        color: "#333",
      }}
    >
      <li>New features and improvements</li>
      <li>Our plans and timelines</li>
      <li>Updates about our SaaS version</li>
    </ul>
    <div style={{ marginTop: "30px", borderTop: "1px solid #eee", paddingTop: "20px" }}>
      <p style={{ fontSize: "16px", color: "#333" }}>
        Best regards,
        <br />
        The TaxHacker Team
      </p>
    </div>
  </EmailLayout>
)
