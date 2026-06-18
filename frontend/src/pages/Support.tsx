import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';

export function Support() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <header className="border-b border-bg-border px-6 py-4">
        <Link to="/"><Logo size="md" /></Link>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12 space-y-8 text-text-secondary text-sm leading-relaxed">
        <div>
          <h1 className="font-display font-bold text-3xl text-text-primary mb-2">Support</h1>
          <p className="text-text-muted">We're here to help.</p>
        </div>

        <section className="space-y-3">
          <h2 className="font-display font-semibold text-lg text-text-primary">Contact Us</h2>
          <p>Email us at <a href="mailto:kvirzi@gmail.com" className="text-accent-orange hover:underline">kvirzi@gmail.com</a> and we'll get back to you within 24 hours.</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-semibold text-lg text-text-primary">Common Questions</h2>
          <div className="space-y-4">
            <div>
              <p className="font-medium text-text-primary">How do I add a streaming service?</p>
              <p>Tap "My Services" in the menu, then tap "Add Service". You can pick from popular services or enter a custom one.</p>
            </div>
            <div>
              <p className="font-medium text-text-primary">How do I track my shows?</p>
              <p>Go to "My Shows" and tap "Add Show". Search for any TV show and it will auto-fill episode counts from TMDB.</p>
            </div>
            <div>
              <p className="font-medium text-text-primary">How do I cancel my Pro subscription?</p>
              <p>On iOS, go to Settings → Apple ID → Subscriptions and cancel StreamRotate Pro there.</p>
            </div>
            <div>
              <p className="font-medium text-text-primary">How do I delete my account?</p>
              <p>In the app, go to Settings → scroll to the bottom → tap "Delete My Account".</p>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-semibold text-lg text-text-primary">Links</h2>
          <p><Link to="/privacy" className="text-accent-orange hover:underline">Privacy Policy</Link></p>
        </section>
      </main>
    </div>
  );
}
