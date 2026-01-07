import React from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Helmet } from 'react-helmet-async';

export const TermsOfService: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto px-6 py-12 text-gray-300 font-sans">
            <Helmet>
                <title>Terms of Service | Lumière Culinary</title>
                <meta name="description" content="Terms of Service for Lumière Culinary." />
                <link rel="canonical" href="https://lumiereculinary.com/terms" />
            </Helmet>
            <Link
                to="/"
                className="flex items-center text-gray-400 hover:text-culinary-gold transition-colors mb-8 uppercase tracking-widest text-sm"
            >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
            </Link>

            <header className="mb-12 border-b border-gray-800 pb-8">
                <div className="flex items-center gap-3 mb-4 text-culinary-gold">
                    <FileText className="w-8 h-8" />
                    <h1 className="text-3xl md:text-4xl font-serif text-culinary-cream">Terms of Service</h1>
                </div>
                <p className="text-sm text-gray-500 uppercase tracking-wider">Last Updated: January 7, 2026</p>
            </header>

            <div className="space-y-12 leading-relaxed">
                <section>
                    <h2 className="text-xl font-serif text-culinary-gold mb-4">1. Acceptance of Terms</h2>
                    <p>
                        By accessing or using Lumiere Culinary (the "Service"), you agree to be bound by these Terms of Service.
                        If you do not agree to these terms, please do not use the Service.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-serif text-culinary-gold mb-4">2. Account Registration & Security</h2>
                    <ul className="list-disc pl-5 space-y-2 marker:text-culinary-gold">
                        <li><strong className="text-gray-200">Google Authentication:</strong> Our Service uses Google OAuth for account creation and login. You are responsible for maintaining the security of your Google account.</li>
                        <li><strong className="text-gray-200">Accuracy:</strong> You agree to provide accurate information when prompted.</li>
                        <li><strong className="text-gray-200">Eligibility:</strong> You must be at least 13 years of age to use this Service.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-serif text-culinary-gold mb-4">3. User Conduct & Acceptable Use</h2>
                    <p className="mb-4">You agree not to use the Service for any unlawful purpose or to:</p>
                    <ul className="list-disc pl-5 space-y-2 marker:text-culinary-gold">
                        <li>Attempt to hack, destabilize, or bypass any security features of the site.</li>
                        <li>Use automated bots to scrape data from the Service without permission.</li>
                        <li>Post or share content that is offensive, defamatory, or infringes on the intellectual property of others.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-serif text-culinary-gold mb-4">4. Intellectual Property</h2>
                    <ul className="list-disc pl-5 space-y-2 marker:text-culinary-gold">
                        <li><strong className="text-gray-200">Our Content:</strong> All logos, designs, text, and code (including the AI-integrated tools) are the property of Lumiere Culinary.</li>
                        <li><strong className="text-gray-200">Your Content:</strong> Any character builds, DPS optimizations, or recipes you create remain your property. However, by using the Service, you grant us a license to store and display this data for the purpose of providing the Service to you.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-serif text-culinary-gold mb-4">5. AI Disclaimer (Important)</h2>
                    <p className="mb-4">Lumiere Culinary uses artificial intelligence to assist with culinary and gaming data.</p>
                    <ul className="list-disc pl-5 space-y-2 marker:text-culinary-gold">
                        <li><strong className="text-gray-200">No Guarantee:</strong> AI-generated outputs (such as DPS calculations or recipe suggestions) are provided "as-is." We do not guarantee the accuracy, reliability, or "correctness" of AI suggestions.</li>
                        <li><strong className="text-gray-200">User Responsibility:</strong> You are responsible for verifying any information provided by the AI before acting on it.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-serif text-culinary-gold mb-4">6. Limitation of Liability</h2>
                    <p>
                        To the maximum extent permitted by law (including Australian Consumer Law), Lumiere Culinary shall not be liable for
                        any indirect, incidental, or consequential damages resulting from your use of the Service, including data loss or technical inaccuracies.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-serif text-culinary-gold mb-4">7. Termination</h2>
                    <p>
                        We reserve the right to suspend or terminate your access to the Service at our discretion, without notice,
                        for conduct that we believe violates these Terms or is harmful to other users or our business interests.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-serif text-culinary-gold mb-4">8. Governing Law</h2>
                    <p>
                        These Terms are governed by and construed in accordance with the laws of New South Wales, Australia.
                        Any disputes will be resolved in the courts located in NSW.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-serif text-culinary-gold mb-4">9. Changes to Terms</h2>
                    <p>
                        We may modify these terms at any time. We will notify users of significant changes by posting the new terms on this page.
                        Your continued use of the site after changes are posted constitutes acceptance of the new terms.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-serif text-culinary-gold mb-4">10. Contact</h2>
                    <p>
                        For any questions regarding these terms, please contact us at: <a href="mailto:lumiereculinary@gmail.com" className="text-culinary-gold hover:underline">lumiereculinary@gmail.com</a>
                    </p>
                </section>
            </div>
        </div>
    );
};
