import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';

export function Privacy() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <header className="border-b border-bg-border px-6 py-4">
        <Link to="/"><Logo size="md" /></Link>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12 space-y-8 text-text-secondary text-sm leading-relaxed">
        <div>
          <h1 className="font-display font-bold text-3xl text-text-primary mb-2">Privacy Policy</h1>
          <p className="text-text-muted">Last updated: June 15, 2026</p>
        </div>

        <section className="space-y-3">
          <h2 className="font-display font-semibold text-lg text-text-primary">1. Information We Collect</h2>
          <p>When you create an account, we collect your email address and, if you sign in with Google, your name and profile photo. We store information you enter about your streaming services and shows.</p>
          <p>We collect payment information through Stripe for Pro subscriptions. We never store credit card numbers — Stripe handles all payment processing.</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-semibold text-lg text-text-primary">2. How We Use Your Information</h2>
          <p>We use your information solely to provide the StreamRotate service — tracking your shows, calculating rotation suggestions, and sending billing reminders you opt into. We do not sell your data to third parties.</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-semibold text-lg text-text-primary">3. Data Storage</h2>
          <p>Your data is stored securely using Supabase (PostgreSQL), hosted on AWS. Authentication is handled by Supabase Auth. We use industry-standard encryption in transit (TLS) and at rest.</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-semibold text-lg text-text-primary">4. Third-Party Services</h2>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Supabase</strong> — database and authentication</li>
            <li><strong>Stripe</strong> — payment processing</li>
            <li><strong>TMDB</strong> — TV show metadata (no personal data shared)</li>
            <li><strong>Google</strong> — optional OAuth sign-in</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-semibold text-lg text-text-primary">5. Data Deletion</h2>
          <p>You can delete your account at any time from the Settings page. This permanently removes all your data from our systems within 30 days.</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-semibold text-lg text-text-primary">6. Contact</h2>
          <p>Questions about this policy? Email us at <a href="mailto:kvirzi@gmail.com" className="text-accent-orange hover:underline">kvirzi@gmail.com</a>.</p>
        </section>
      </main>
    </div>
  );
}
