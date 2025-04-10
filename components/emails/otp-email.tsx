import React from "react"
import { EmailLayout } from "./email-layout"

interface OTPEmailProps {
  otp: string
}

export const OTPEmail: React.FC<OTPEmailProps> = ({ otp }) => (
  <EmailLayout preview="Your TaxHacker verification code">
    <h2 style={{ textAlign: "center", color: "#4f46e5" }}>🔑 Your TaxHacker verification code</h2>
    <div
      style={{
        margin: "20px 0",
        padding: "20px",
        backgroundColor: "#f3f4f6",
        borderRadius: "6px",
        textAlign: "center",
      }}
    >
      <p style={{ fontSize: "16px", marginBottom: "10px" }}>Your verification code is:</p>
      <p
        style={{
          fontSize: "24px",
          fontWeight: "bold",
          color: "#4f46e5",
          letterSpacing: "2px",
          margin: "0",
        }}
      >
        {otp}
      </p>
    </div>
    <p style={{ fontSize: "14px", color: "#666", textAlign: "center" }}>This code will expire in 10 minutes.</p>
    <p style={{ fontSize: "14px", color: "#666", textAlign: "center" }}>
      If you didn&apos;t request this code, please ignore this email.
    </p>
  </EmailLayout>
)
