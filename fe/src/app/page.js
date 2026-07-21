"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Link from "next/link";
import { 
  Terminal, 
  RefreshCw, 
  Shield, 
  MailWarning, 
  Eye, 
  ArrowRight, 
  ExternalLink,
  Zap,
  Database,
  Server
} from "lucide-react";
import styles from "./landing.module.css";

export default function LandingPage() {
  const router = useRouter();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const visited = localStorage.getItem("kiosk_visited");
    if (visited) {
      router.push("/dashboard");
    } else {
      setShowContent(true);
    }
  }, [router]);

  const handleOpenDashboard = (e) => {
    e.preventDefault();
    localStorage.setItem("kiosk_visited", "true");
    router.push("/dashboard");
  };

  if (!showContent) {
    return null; // Or a loading spinner
  }

  return (
    <div className={styles.page}>
      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.navBrand}>
            <Terminal size={20} />
            <span>KIOSK</span>
          </div>
          <div className={styles.navLinks}>
            <a 
              href="https://github.com/emot1con/kiosk" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.navLink}
            >
              <ExternalLink size={16} />
              <span>GitHub</span>
            </a>
            <a href="/dashboard" onClick={handleOpenDashboard} className={styles.navCta}>
              Open Dashboard
              <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroBadge}>
          <Zap size={12} />
          <span>Open Source · Self-Hosted · MIT License</span>
        </div>
        <h1 className={styles.heroTitle}>
          Never Miss a<br />
          <span className={styles.heroGradient}>Webhook Again.</span>
        </h1>
        <p className={styles.heroSubtitle}>
          Open-source webhook reliability layer that receives, stores, forwards, and retries 
          your webhook deliveries. Self-hosted with full control and zero vendor lock-in.
        </p>
        <div className={styles.heroCtas}>
          <a href="/dashboard" onClick={handleOpenDashboard} className={styles.ctaPrimary}>
            <span>Open Dashboard</span>
            <ArrowRight size={16} />
          </a>
          <a 
            href="https://github.com/emot1con/kiosk" 
            target="_blank" 
            rel="noopener noreferrer" 
            className={styles.ctaSecondary}
          >
            <ExternalLink size={16} />
            <span>View on GitHub</span>
          </a>
        </div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon} data-color="blue">
              <RefreshCw size={20} />
            </div>
            <h3>Automatic Retries</h3>
            <p>Exponential backoff retry strategy ensures delivery even when your server is temporarily down.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon} data-color="red">
              <MailWarning size={20} />
            </div>
            <h3>Dead Letter Queue</h3>
            <p>Failed deliveries after max retries are preserved for manual inspection and re-delivery.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon} data-color="green">
              <Shield size={20} />
            </div>
            <h3>HMAC Signature Security</h3>
            <p>Every forwarded payload is signed with HMAC-SHA256 so your server can verify authenticity.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon} data-color="purple">
              <Eye size={20} />
            </div>
            <h3>Full Delivery Visibility</h3>
            <p>Inspect every attempt — status codes, response bodies, latency, and timing for each delivery.</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className={styles.howItWorks}>
        <h2 className={styles.sectionTitle}>How It Works</h2>
        <p className={styles.sectionSubtitle}>
          Kiosk sits between your webhook provider and your application server as a reliability proxy.
        </p>
        <div className={styles.flowDiagram}>
          <div className={styles.flowStep}>
            <div className={styles.flowIcon}>
              <Zap size={24} />
            </div>
            <div className={styles.flowLabel}>Provider</div>
            <div className={styles.flowDesc}>Stripe, GitHub, Shopify...</div>
          </div>
          <div className={styles.flowArrow}>→</div>
          <div className={styles.flowStep} data-highlight="true">
            <div className={styles.flowIcon}>
              <Database size={24} />
            </div>
            <div className={styles.flowLabel}>Kiosk</div>
            <div className={styles.flowDesc}>Store → Queue → Retry</div>
          </div>
          <div className={styles.flowArrow}>→</div>
          <div className={styles.flowStep}>
            <div className={styles.flowIcon}>
              <Server size={24} />
            </div>
            <div className={styles.flowLabel}>Your Server</div>
            <div className={styles.flowDesc}>Reliable delivery guaranteed</div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className={styles.techStack}>
        <div className={styles.techBadges}>
          <span className={styles.techBadge}>NestJS</span>
          <span className={styles.techBadge}>PostgreSQL</span>
          <span className={styles.techBadge}>RabbitMQ</span>
          <span className={styles.techBadge}>Next.js</span>
          <span className={styles.techBadge}>TypeScript</span>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <Terminal size={16} />
            <span>Kiosk</span>
          </div>
          <p className={styles.footerText}>
            Open source webhook reliability layer · MIT License
          </p>
          <a 
            href="https://github.com/emot1con/kiosk" 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.footerLink}
          >
            <ExternalLink size={14} />
            <span>github.com/emot1con/kiosk</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
