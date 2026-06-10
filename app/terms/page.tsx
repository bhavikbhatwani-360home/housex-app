import type { Metadata } from "next";
import LegalShell from "../legal/LegalShell";

export const metadata: Metadata = { title: "Terms of Service — HouseX" };

export default function Terms() {
  return (
    <LegalShell title="Terms of Service" updated="June 2026">
      <section>
        <h2>1. What HouseX is</h2>
        <p>HouseX (housex.ai) is a technology platform that helps home buyers discover RERA-registered residential projects in India and connect directly with real-estate developers. HouseX is not a real-estate agent or broker, does not own or sell property, and is not a party to any transaction between a buyer and a developer.</p>
      </section>
      <section>
        <h2>2. For buyers</h2>
        <p>HouseX is free for buyers. Property information (prices, availability, amenities, possession dates) is provided by developers and may change without notice. Always verify all details — including RERA registration, pricing, and legal documents — directly with the developer before making any payment or commitment. Replies from our AI assistant (&ldquo;HouseX AI&rdquo;) are for guidance only and can contain mistakes; they are not legal, financial, or investment advice.</p>
      </section>
      <section>
        <h2>3. For developers</h2>
        <p>Developers are solely responsible for the accuracy of their listings, their RERA registrations, and their conduct toward buyers. Developers must only contact buyers who have shared their details through HouseX, and only regarding their enquiry. Misuse of buyer data, fake listings, or unregistered projects will result in removal from the platform.</p>
      </section>
      <section>
        <h2>4. Acceptable use</h2>
        <p>You agree not to misuse the platform — including spamming the AI assistant, posting false information, attempting to access other users&apos; data, or interfering with the service. We may suspend accounts that violate these terms.</p>
      </section>
      <section>
        <h2>5. Liability</h2>
        <p>The service is provided &quot;as is&quot;. To the maximum extent permitted by law, HouseX is not liable for any loss arising from property transactions, developer conduct, listing inaccuracies, or service interruptions. Nothing on HouseX constitutes an offer capable of acceptance — bookings and purchases are concluded directly with developers under their own terms.</p>
      </section>
      <section>
        <h2>6. Changes & contact</h2>
        <p>We may update these terms as the product evolves; continued use means you accept the updated terms. Questions: <a className="text-hx-red" href="mailto:hello@housex.ai">hello@housex.ai</a>.</p>
      </section>
    </LegalShell>
  );
}
