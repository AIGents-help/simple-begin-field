import React from 'react';
import { LegalPageLayout } from '../../components/trust/LegalPageLayout';

export const PrivacyPolicy: React.FC = () => {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated="March 26, 2026">
      <section>
        <h2>1. What Data is Collected</h2>
        <p>
          We collect information you provide directly to us, including your name, 
          email address, and any data or documents you upload to your packet. 
          This may include sensitive information such as wills, financial 
          account details, and personal instructions.
        </p>
      </section>

      <section>
        <h2>2. How Data is Used</h2>
        <p>
          We use your data solely to provide and improve our service. This 
          includes storing your information securely, enabling access for 
          you and your invited partners, and facilitating the organization 
          of your records. We do not sell your personal data.
        </p>
      </section>

      <section>
        <h2>3. How Data is Stored</h2>
        <p>
          Your data is stored securely in the cloud using industry-standard 
          encryption and security protocols. We take multiple measures to 
          ensure that your files are not publicly accessible and are only 
          available through your authenticated account.
        </p>
      </section>

      <section>
        <h2>4. Who Can Access Data</h2>
        <p>
          Access to your packet is strictly limited to you and any individuals 
          you explicitly invite (e.g., a spouse or partner). Private items 
          have additional restrictions and may require further verification 
          to unlock.
        </p>
      </section>

      <section>
        <h2>5. Third-Party Services</h2>
        <p>
          We use third-party services for essential functions such as 
          payment processing (Stripe) and cloud infrastructure (Supabase). 
          These providers have their own privacy policies and are chosen 
          for their high standards of security and reliability.
        </p>
      </section>

      <section>
        <h2>6. Data Retention</h2>
        <p>
          We retain your data for as long as your account is active. You 
          can delete your data or your entire account at any time through 
          your settings. Once deleted, your data is permanently removed 
          from our active systems.
        </p>
      </section>

      <section>
        <h2>7. User Rights</h2>
        <p>
          You have the right to access, update, or delete your personal 
          information at any time. You can also download a summary of 
          your data for your own records.
        </p>
      </section>

      <section>
        <h2>8. Security Measures Overview</h2>
        <p>
          Our security measures include data encryption at rest and in 
          transit, secure authentication protocols, and regular security 
          audits. We are committed to maintaining the highest level of 
          protection for your most sensitive information.
        </p>
      </section>

      <section>
        <h2>9. Contact Information</h2>
        <p>
          If you have any questions or concerns about your privacy, 
          please contact us at 
          <a href="mailto:privacy@survivorpacket.com">privacy@survivorpacket.com</a>.
        </p>
      </section>
    </LegalPageLayout>
  );
};
