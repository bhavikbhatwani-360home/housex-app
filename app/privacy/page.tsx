import type { Metadata } from "next";
import LegalShell from "../legal/LegalShell";

export const metadata: Metadata = { title: "Privacy Policy — HouseX" };

export default function Privacy() {
  return (
    <LegalShell title="Privacy Policy" updated="June 2026">
      <section>
        <h2>1. What we collect</h2>
        <p><strong>Buyers:</strong> your chat messages with HouseX AI (to find homes for you), and — only when you book a site visit or respond to an offer — your name and phone number. <strong>Developers:</strong> account details (name, company, email, phone) and the listings you publish.</p>
      </section>
      <section>
        <h2>2. How we use it</h2>
        <p>Chat messages are processed by our AI provider to generate HouseX AI&apos;s replies and to match you with suitable properties. Your name and phone number are shared <strong>only with the specific developer</strong> whose property you chose to visit or negotiate on — never sold, never given to brokers, never used for unrelated marketing.</p>
      </section>
      <section>
        <h2>3. DPDP Act compliance</h2>
        <p>We process personal data in line with India&apos;s Digital Personal Data Protection Act, 2023. You provide data with consent, for the stated purpose of finding and transacting on a home. You may request access to, correction of, or deletion of your personal data at any time by writing to <a className="text-hx-red" href="mailto:privacy@housex.ai">privacy@housex.ai</a>.</p>
      </section>
      <section>
        <h2>4. Storage & security</h2>
        <p>Data is stored in managed cloud databases with encryption in transit, access-controlled consoles, and role-based permissions. We retain conversations and leads for as long as needed to provide the service, after which they may be deleted or anonymised.</p>
      </section>
      <section>
        <h2>5. Third parties</h2>
        <p>We use trusted processors to run the service: cloud hosting, database hosting, an AI model provider (for HouseX AI&apos;s replies), and an email provider (for notifications). They process data solely on our instructions.</p>
      </section>
      <section>
        <h2>6. Contact</h2>
        <p>Questions or data requests: <a className="text-hx-red" href="mailto:privacy@housex.ai">privacy@housex.ai</a>.</p>
      </section>
    </LegalShell>
  );
}
