"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DstiFooter from "../components/DstiFooter";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Gagal masuk. Periksa kembali kredensial Anda.");
        setIsLoading(false);
        return;
      }

      // Berhasil login -> arahkan ke dashboard admin
      router.push(data.redirect || "/admin");
      router.refresh();
    } catch (err) {
      console.error("[Login]", err);
      setErrorMsg("Terjadi gangguan koneksi. Silakan coba beberapa saat lagi.");
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <main className={styles.loginMain}>
        <div className={styles.loginCard}>
          <div className={styles.cardHeader}>
            <div className={styles.logosRow}>
              <img
                src="/images/undip-logo.png"
                alt="Lambang Universitas Diponegoro"
                className={styles.undipLogo}
              />
              <span className={styles.divider} aria-hidden="true" />
              <img
                src="/images/dsti-logo.png"
                alt="Logo DSTI UNDIP"
                className={styles.dstiLogo}
              />
            </div>

            <span className={styles.badge}>Akses Khusus DSTI</span>
            <h1 className={styles.title}>Admin Authentication</h1>
            <p className={styles.subtitle}>
              Masuk untuk mengelola data katalog aplikasi internal DSTI UNDIP.
            </p>
          </div>

          {errorMsg ? (
            <div className={styles.errorAlert} role="alert">
              <span aria-hidden="true">&#9888;</span>
              <span>{errorMsg}</span>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="username" className={styles.label}>
                Username Admin
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                autoFocus
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={styles.input}
                placeholder="Masukkan username"
                disabled={isLoading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                placeholder="Masukkan password"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isLoading}
            >
              {isLoading ? "Memverifikasi..." : "Masuk ke Panel Admin"}
            </button>
          </form>

          <div className={styles.backLinkWrapper}>
            <Link href="/" className={styles.backLink}>
              <span aria-hidden="true">&larr;</span> Kembali ke Beranda
            </Link>
          </div>
        </div>
      </main>

      <DstiFooter />
    </div>
  );
}
