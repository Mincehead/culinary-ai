import React from 'react';
import { ArrowLeft, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PrivacyPolicy: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto px-6 py-12 text-gray-300 font-sans">
            <Link
                to="/"
                className="flex items-center text-gray-400 hover:text-culinary-gold transition-colors mb-8 uppercase tracking-widest text-sm"
            >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
            </Link>

            <header className="mb-12 border-b border-gray-800 pb-8">
                <div className="flex items-center gap-3 mb-4 text-culinary-gold">
                    <Shield className="w-8 h-8" />
                    <h1 className="text-3xl md:text-4xl font-serif text-culinary-cream">Privacy Policy</h1>
                </div>
                <p className="text-sm text-gray-500 uppercase tracking-wider">Last Updated: January 7, 2026</p>
            </header>

            <div className="space-y-12 leading-relaxed">
                <section>
                    <h2 className="text-xl font-serif text-culinary-gold mb-4">1. Introduction</h2>
                    <p>
                        Welcome to Lumiere Culinary. We respect your privacy and are committed to protecting your personal data.
                        This Privacy Policy explains how we collect, use, and safeguard your information when you use our website and services.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-serif text-culinary-gold mb-4">2. Information We Collect</h2>
                    <p className="mb-4">When you use our service, we may collect the following types of information:</p>
                    <ul className="list-disc pl-5 space-y-2 marker:text-culinary-gold">
                        <li><strong className="text-gray-200">Account Information:</strong> If you sign up via Google OAuth, we receive your name, email address, and profile picture URL.</li>
                        <li><strong className="text-gray-200">Usage Data:</strong> Details of how you use our application, including interactions with our AI features and gaming tools.</li>
                        <li><strong className="text-gray-200">Technical Data:</strong> IP address, browser type, and device information.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-serif text-culinary-gold mb-4">3. How We Use Your Information</h2>
                    <p className="mb-4">We use the collected data to:</p>
                    <ul className="list-disc pl-5 space-y-2 marker:text-culinary-gold">
                        <li>Provide and maintain our service.</li>
                        <li>Authenticate your identity via Google.</li>
                        <li>Personalize your experience (e.g., saving your recipes or preferences).</li>
                        <li>Improve our application’s functionality and security.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-serif text-culinary-gold mb-4">4. Data Storage and Security</h2>
                    <p>
                        We use Supabase for our backend database and authentication services. Your data is stored on secure servers,
                        and we implement industry-standard encryption to protect your personal information.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-serif text-culinary-gold mb-4">5. Google API Disclosure</h2>
                    <p>
                        Lumiere Culinary's use and transfer to any other app of information received from Google APIs will adhere to
                        the Google API Service User Data Policy, including the Limited Use requirements. We do not sell your Google user data to third parties.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-serif text-culinary-gold mb-4">6. Third-Party Services</h2>
                    <p>
                        We may use third-party services (such as AI processing or database hosting) that have their own privacy policies.
                        We encourage you to review them. We do not share your private data with these services unless necessary for the app to function.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-serif text-culinary-gold mb-4">7. Your Rights</h2>
                    <p>
                        Depending on your location, you may have the right to access, correct, or delete your personal data.
                        To exercise these rights, please contact us at the developer email listed on our site.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-serif text-culinary-gold mb-4">8. Changes to This Policy</h2>
                    <p>
                        We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-serif text-culinary-gold mb-4">9. Contact Us</h2>
                    <p>
                        If you have questions about this Privacy Policy, please contact us at: <a href="mailto:lumiereculinary@gmail.com" className="text-culinary-gold hover:underline">lumiereculinary@gmail.com</a>
                    </p>
                </section>
            </div>
        </div>
    );
};
