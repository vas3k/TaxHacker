"use server"

import { resend, sendNewsletterWelcomeEmail } from "@/lib/email"

export async function subscribeToNewsletterAction(email: string) {
  try {
    if (!email || !email.includes("@")) {
      return { success: false, error: "Invalid email address" }
    }

    const existingContacts = await resend.contacts.list({
      audienceId: process.env.RESEND_AUDIENCE_ID as string,
    })

    if (existingContacts.data) {
      const existingContact = existingContacts.data.data.find((contact: any) => contact.email === email)

      if (existingContact) {
        return { success: false, error: "You are already subscribed to the newsletter" }
      }
    }

    await resend.contacts.create({
      email,
      audienceId: process.env.RESEND_AUDIENCE_ID as string,
      unsubscribed: false,
    })

    await sendNewsletterWelcomeEmail(email)

    return { success: true }
  } catch (error) {
    console.error("Newsletter subscription error:", error)
    return { error: "Failed to subscribe. Please try again later." }
  }
}
