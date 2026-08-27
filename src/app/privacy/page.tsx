export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-text">
      <h1 className="mb-2 text-3xl">Privacy Policy</h1>
      <p className="mb-8 text-sm text-text-muted">Last updated August 2026</p>

      <div className="space-y-6 text-[0.95rem] leading-relaxed">
        <p>
          I Do List is a shared wedding-planning tool. This page explains what
          information the app collects and how it&apos;s used.
        </p>

        <section>
          <h2 className="mb-2 text-xl">What we collect</h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Account information (name, email address) via our authentication provider, Clerk — including via Google Sign-In if you choose that option.</li>
            <li>Wedding planning data you enter yourself: guest lists, budget and vendor details, to-do items, and notes.</li>
            <li>Calendar events, if you connect a calendar feed (iCal URL) — we read event titles, times, and locations from that feed to show reminders.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-xl">What we don&apos;t collect</h2>
          <p>
            We do not access your email inbox, Gmail, or any Google data
            beyond your basic profile (name and email) if you sign in with
            Google. We do not sell or share your data with advertisers.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl">How it&apos;s used</h2>
          <p>
            Your data is used solely to run the app&apos;s features for
            you: showing your guest list and budget, syncing your calendar,
            and sending the email reminders you configure (via Resend). Each
            wedding&apos;s data is isolated — only people you explicitly
            invite or approve can see it.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl">Third-party services</h2>
          <p>
            We use Clerk (authentication), Neon (database hosting), Resend
            (email delivery), and Vercel (hosting) to run the app. These
            providers process data on our behalf under their own privacy and
            security practices.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl">Your data</h2>
          <p>
            You can delete guests, budget items, and to-dos directly in the
            app at any time. To delete your account or wedding entirely,
            contact us at the email below.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl">Contact</h2>
          <p>Questions about this policy: noa.cohen.noa@gmail.com</p>
        </section>
      </div>
    </div>
  );
}
