import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';

export function Terms() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <header className="border-b border-bg-border px-6 py-4">
        <Link to="/"><Logo size="md" /></Link>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12 space-y-8 text-text-secondary text-sm leading-relaxed">
        <div>
          <h1 className="font-display font-bold text-3xl text-text-primary mb-2">Terms of Use</h1>
          <p className="text-text-muted">Last updated: June 2026</p>
        </div>

        <section className="space-y-3">
          <h2 className="font-display font-semibold text-lg text-text-primary">1. Acceptance of Terms</h2>
          <p>By downloading or using StreamRotate, you agree to these Terms of Use. If you do not agree, do not use the app.</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-semibold text-lg text-text-primary">2. Pro Subscription</h2>
          <p>StreamRotate offers auto-renewable subscriptions:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Pro Monthly</strong> — $2.99 per month</li>
            <li><strong>Pro Annual</strong> — $19.99 per year</li>
          </ul>
          <p>Payment is charged to your Apple ID account at confirmation of purchase. Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period. You can manage and cancel subscriptions in your App Store account settings.</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-semibold text-lg text-text-primary">3. Use of the Service</h2>
          <p>StreamRotate is a personal streaming service tracker. You agree not to misuse the service, attempt to access it in unauthorized ways, or use it for any unlawful purpose.</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-semibold text-lg text-text-primary">4. Account</h2>
          <p>You are responsible for maintaining the security of your account. You may delete your account at any time from the Settings screen within the app.</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-semibold text-lg text-text-primary">5. Disclaimer</h2>
          <p>StreamRotate is provided "as is" without warranties of any kind. We are not responsible for any loss of data or interruption of service.</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-semibold text-lg text-text-primary">6. Contact</h2>
          <p>Questions? Email <a href="mailto:kvirzi@gmail.com" className="text-accent-orange hover:underline">kvirzi@gmail.com</a></p>
        </section>

        <section className="space-y-2">
          <p><Link to="/privacy" className="text-accent-orange hover:underline">Privacy Policy</Link></p>
          <p><Link to="/support" className="text-accent-orange hover:underline">Support</Link></p>
        </section>
      </main>
    </div>
  );
}
