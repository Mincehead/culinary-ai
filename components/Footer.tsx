import React from 'react';
import { ChefHat, Mail, MapPin, Phone, Instagram, Twitter, Facebook } from 'lucide-react';

interface FooterProps {
    onNavigate?: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
    return (
        <footer className="relative z-10 bg-black/90 border-t border-gray-800 pt-20 pb-10 mt-20 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                {/* Brand Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-culinary-gold">
                        <ChefHat className="w-8 h-8" />
                        <span className="text-2xl font-serif font-bold tracking-tight">LUMIÈRE</span>
                    </div>
                    <p className="text-gray-400 font-sans text-sm leading-relaxed max-w-xs">
                        We built Lumière to be the ultimate recipe book—containing every recipe in the world, powered by AI. From Hunter Valley to your kitchen, we're redefining what's possible in home cooking.
                    </p>
                    <div className="flex gap-4">
                        <a href="#" className="text-gray-500 hover:text-culinary-gold transition-colors"><Instagram className="w-5 h-5" /></a>
                        <a href="#" className="text-gray-500 hover:text-culinary-gold transition-colors"><Twitter className="w-5 h-5" /></a>
                        <a href="#" className="text-gray-500 hover:text-culinary-gold transition-colors"><Facebook className="w-5 h-5" /></a>
                    </div>
                </div>

                {/* Explore */}
                <div>
                    <h3 className="text-culinary-cream font-serif text-lg mb-6">Explore</h3>
                    <ul className="space-y-4 text-sm font-sans text-gray-400">
                        <li><a href="#" className="hover:text-culinary-gold transition-colors">Seasonal Menu</a></li>
                        <li><a href="#" className="hover:text-culinary-gold transition-colors">Personal Chef</a></li>
                        <li><a href="#" className="hover:text-culinary-gold transition-colors">Culinary Styles</a></li>
                    </ul>
                </div>

                {/* Company */}
                <div>
                    <h3 className="text-culinary-cream font-serif text-lg mb-6">Company</h3>
                    <ul className="space-y-4 text-sm font-sans text-gray-400">
                        <li><a href="#" className="hover:text-culinary-gold transition-colors">About Us</a></li>
                        <li><a href="#" className="hover:text-culinary-gold transition-colors">Press & Media</a></li>
                        <li><a href="#" className="hover:text-culinary-gold transition-colors">Contact Us</a></li>
                        <li><button onClick={() => onNavigate?.('privacy')} className="hover:text-culinary-gold transition-colors text-left w-full">Privacy Policy</button></li>
                    </ul>
                </div>

                {/* Contact */}
                <div>
                    <h3 className="text-culinary-cream font-serif text-lg mb-6">Contact</h3>
                    <ul className="space-y-4 text-sm font-sans text-gray-400">
                        <li className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-culinary-gold shrink-0" />
                            <span>Hunter Valley,<br />NSW, Australia</span>
                        </li>

                        <li className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-culinary-gold shrink-0" />
                            <span>lumiereculinary@gmail.com</span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500 font-sans tracking-widest uppercase">
                <div>&copy; 2025 Lumière Culinary. All rights reserved.</div>
                <div className="flex gap-8">
                    <button onClick={() => onNavigate?.('privacy')} className="hover:text-white transition-colors">Privacy Policy</button>
                    <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                </div>
            </div>
        </footer>
    );
};
