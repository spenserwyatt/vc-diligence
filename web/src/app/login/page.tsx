"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push("/");
    } else {
      setError(true);
      setPassword("");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 w-full max-w-sm"
      >
        <h1 className="text-xl font-bold text-navy mb-1">VC Diligence</h1>
        <p className="text-sm text-muted mb-6">Enter the password to continue.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(false);
          }}
          placeholder="Password"
          autoFocus
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue/40 mb-3"
        />
        {error && (
          <p className="text-xs text-vc-red mb-3">Wrong password.</p>
        )}
        <button
          type="submit"
          className="w-full py-2 bg-navy text-white rounded-lg font-medium text-sm hover:bg-blue transition-colors"
        >
          Sign In
        </button>
      </form>
    </div>
  );
}
