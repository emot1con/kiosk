"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Terminal, Copy, Check, Loader2, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import styles from "@/components/Auth.module.css";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredKey, setRegisteredKey] = useState("");
  const [copied, setCopied] = useState(false);
  
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password || !confirmPassword) {
      setError("Semua field wajib diisi");
      return;
    }

    if (password.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await register(email, password);
      if (res.success) {
        setRegisteredKey(res.apiKey);
      }
    } catch (err) {
      setError("Gagal registrasi. Hubungi administrator.");
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(registeredKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  // If registered successfully, display API Key first
  if (registeredKey) {
    return (
      <div className={styles.container}>
        <div className={`${styles.card} glass-card`} style={{ textAlign: "center" }}>
          <div className={styles.header}>
            <ShieldCheck style={{ color: "var(--status-delivered)" }} size={48} />
            <h2 className={styles.title}>Registrasi Berhasil!</h2>
            <p className={styles.subtitle}>Simpan API Key Anda di bawah ini dengan aman</p>
          </div>

          <div className={styles.keyContainer}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "500" }}>
              API KEY ANDA (X-Api-Key):
            </span>
            <div className={styles.keyValue}>{registeredKey}</div>
            
            <button 
              onClick={handleCopy} 
              className="btn btn-secondary btn-sm"
              style={{ width: "100%", justifyContent: "center" }}
            >
              {copied ? (
                <>
                  <Check size={16} style={{ color: "var(--status-delivered)" }} />
                  <span style={{ color: "var(--status-delivered)" }}>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>Salin ke Clipboard</span>
                </>
              )}
            </button>
          </div>

          <p style={{ fontSize: "0.8rem", color: "var(--status-dead)", margin: "0.5rem 0 1rem 0", lineHeight: "1.4" }}>
            ⚠️ PENTING: Kunci ini tidak akan ditampilkan lagi setelah Anda meninggalkan halaman ini demi alasan keamanan.
          </p>

          <button 
            onClick={handleGoToDashboard} 
            className="btn btn-primary"
            style={{ width: "100%" }}
          >
            <span>Masuk ke Dashboard</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={`${styles.card} glass-card`}>
        <div className={styles.header}>
          <Terminal className={styles.logo} size={40} />
          <h2 className={styles.title}>Kiosk Webhook</h2>
          <p className={styles.subtitle}>Daftar akun reliability layer baru Anda</p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input 
              className="form-input" 
              type="email" 
              id="email" 
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input 
              className="form-input" 
              type="password" 
              id="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Konfirmasi Password</label>
            <input 
              className="form-input" 
              type="password" 
              id="confirmPassword" 
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{ width: "100%", marginTop: "0.5rem" }}
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                <span>Register</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className={styles.footer}>
          Sudah punya akun? <Link href="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}
