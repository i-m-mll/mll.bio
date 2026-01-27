"use client"

import { useState, FormEvent } from "react"

interface SubscribeFormProps {
  /** Your Buttondown username */
  buttondownUsername: string
  /** Optional custom placeholder text */
  placeholder?: string
  /** Optional custom button text */
  buttonText?: string
}

export function SubscribeForm({
  buttondownUsername,
  placeholder = "you@example.com",
  buttonText = "Subscribe"
}: SubscribeFormProps) {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setStatus("loading")

    try {
      const response = await fetch(
        `https://buttondown.com/api/emails/embed-subscribe/${buttondownUsername}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({ email }).toString(),
        }
      )

      if (response.ok) {
        setStatus("success")
        setMessage("Thanks! Check your email to confirm.")
        setEmail("")
      } else {
        setStatus("error")
        setMessage("Something went wrong. Please try again.")
      }
    } catch {
      setStatus("error")
      setMessage("Something went wrong. Please try again.")
    }
  }

  if (status === "success") {
    return (
      <div className="text-sm text-muted-foreground">
        {message}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-row flex-wrap gap-2 justify-center items-center">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={placeholder}
        required
        disabled={status === "loading"}
        className="flex-1 min-w-[160px] max-w-[220px] px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="px-4 py-2 text-sm font-medium bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors disabled:opacity-50 whitespace-nowrap"
      >
        {status === "loading" ? "..." : buttonText}
      </button>
      {status === "error" && (
        <span className="basis-full text-sm text-red-500 text-center">{message}</span>
      )}
    </form>
  )
}
