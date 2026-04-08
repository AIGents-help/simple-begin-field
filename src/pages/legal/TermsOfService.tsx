import React from 'react';
import { LegalPageLayout } from '../../components/trust/LegalPageLayout';

export const TermsOfService: React.FC = () => {
  return (
    <LegalPageLayout title="Terms of Service" lastUpdated="March 26, 2026">
      <section>
        <h2>1. Introduction</h2>
        <p>
          Welcome to The Survivor Packet. By using our service, you agree to these terms. 
          Please read them carefully. Our goal is to provide a secure and organized way 
          for you to manage your most important information.
        </p>
      </section>

      <section>
        <h2>2. What The Survivor Packet Provides</h2>
        <p>
          The Survivor Packet is an organization tool designed to help you store and 
          organize documents, account information, and final instructions. We provide 
          the platform and infrastructure for you to manage this data.
        </p>
      </section>

      <section>
        <h2>3. User Responsibilities</h2>
        <p>
          You are responsible for the accuracy of the information you provide. 
          You must ensure that your login credentials remain secure. You are also 
          responsible for keeping your documents and instructions up to date.
        </p>
      </section>

      <section>
        <h2>4. Account Security</h2>
        <p>
          We use industry-standard security measures to protect your data. However, 
          the security of your account also depends on you. Use a strong, unique 
          password and do not share your login details with anyone you do not trust.
        </p>
      </section>

      <section>
        <h2>5. Data Accuracy Disclaimer</h2>
        <p>
          We do not verify the information you enter into the system. It is your 
          sole responsibility to ensure that all data, including legal and financial 
          records, is accurate and valid.
        </p>
      </section>

      <section>
        <h2>6. No Legal or Financial Advice</h2>
        <p>
          The Survivor Packet is NOT a law firm, a financial advisor, or a replacement 
          for professional advice. The information provided through our service is for 
          organizational purposes only and does not constitute legal or financial counsel.
        </p>
      </section>

      <section>
        <h2>7. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, The Survivor Packet shall not be 
          liable for any indirect, incidental, or consequential damages resulting 
          from your use of the service or any inaccuracies in the data provided.
        </p>
      </section>

      <section>
        <h2>8. Termination of Use</h2>
        <p>
          We reserve the right to suspend or terminate your account if you violate 
          these terms or engage in any activity that compromises the security or 
          integrity of our service.
        </p>
      </section>

      <section>
        <h2>9. Changes to Service</h2>
        <p>
          We may update our service and these terms from time to time. We will 
          notify you of any significant changes that affect your rights or 
          responsibilities.
        </p>
      </section>

      <section>
        <h2>10. Contact Information</h2>
        <p>
          If you have any questions about these terms, please contact us at 
          <a href="mailto:support@survivorpacket.com">support@survivorpacket.com</a>.
        </p>
      </section>
    </LegalPageLayout>
  );
};
