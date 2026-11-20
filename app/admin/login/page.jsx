"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal masuk ke sistem.");
      }

      router.push("/admin");
      router.refresh();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <main className="login-main">
        <div className="login-card">
          <div className="card-header">
            <div className="logo-group">
              <img
                src="/images/undip-logo.png"
                alt="Logo UNDIP"
                width="28"
                height="32"
                className="logo-img"
              />
              <span className="logo-divider"></span>
              <img
                src="/images/dsti-logo.png"
                alt="Logo DSTI"
                width="48"
                height="24"
                className="logo-img"
              />
            </div>

            <div className="auth-badge">
              <span>AKSES KHUSUS DSTI</span>
            </div>

            <h1 className="auth-title">Admin Authentication</h1>
            <p className="auth-subtitle">
              Masuk untuk mengelola data katalog aplikasi internal DSTI UNDIP.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {errorMsg && <div className="auth-error">{errorMsg}</div>}

            <div className="form-field">
              <label className="field-label">Username Admin</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                className="field-input"
                required
                autoFocus
              />
            </div>

            <div className="form-field">
              <label className="field-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="field-input"
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-submit">
              {loading ? "Memverifikasi..." : "Masuk ke Panel Admin"}
            </button>

            <div className="back-link-wrapper">
              <Link href="/" className="back-link">
                &larr; Kembali ke Beranda
              </Link>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
