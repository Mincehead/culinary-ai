import React, { useEffect, useState } from 'react';
import { Star, Plus, Youtube, Instagram, Video, ExternalLink, Quote } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { AddReviewModal } from './AddReviewModal';

interface Review {
    id: string;
    user_name: string;
    rating: number;
    comment: string;
    video_url?: string;
    image_url?: string;
    platform?: 'youtube' | 'tiktok' | 'instagram';
    created_at: string;
}

export const ReviewsSection: React.FC = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // Initial fetch
    const fetchReviews = async () => {
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            if (data) setReviews(data);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const getPlatformIcon = (platform?: string) => {
        switch (platform) {
            case 'youtube': return <Youtube className="w-4 h-4 text-red-500" />;
            case 'instagram': return <Instagram className="w-4 h-4 text-pink-500" />;
            case 'tiktok': return <Video className="w-4 h-4 text-cyan-400" />; // Generic video icon for tiktok
            default: return null;
        }
    };

    return (
        <section className="mb-12 relative">
            <div className="flex items-center justify-between mb-6 px-2">
                <h2 className="text-2xl font-serif text-culinary-cream flex items-center gap-2 drop-shadow-md">
                    <Quote className="w-5 h-5 text-culinary-gold -scale-x-100" /> Community Table
                </h2>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="text-xs uppercase tracking-widest font-sans font-bold text-culinary-gold hover:text-white transition-colors flex items-center gap-1 border border-culinary-gold/30 px-3 py-1.5 rounded-full hover:bg-culinary-gold/10"
                >
                    <Plus className="w-3 h-3" /> Add Review
                </button>
            </div>

            {/* Horizontal Scroll Container */}
            <div className="flex overflow-x-auto pb-8 gap-6 snap-x px-2 scrollbar-hide -mx-2">
                {loading ? (
                    // Skeletons
                    [1, 2, 3].map(i => (
                        <div key={i} className="min-w-[300px] h-48 bg-white/5 border border-white/10 rounded-sm animate-pulse"></div>
                    ))
                ) : reviews.length === 0 ? (
                    <div className="min-w-full text-center py-10 text-gray-500 italic font-serif bg-black/20 rounded-lg border border-gray-800">
                        Be the first to share your culinary masterpiece.
                    </div>
                ) : (
                    reviews.map((review) => (
                        <div
                            key={review.id}
                            className={`min-w-[300px] max-w-[300px] md:min-w-[350px] bg-black/40 backdrop-blur-md border border-gray-700 p-6 rounded-sm snap-center hover:border-culinary-gold/50 transition-all group flex flex-col justify-between relative overflow-hidden ${review.image_url ? 'text-shadow-md' : ''}`}
                        >
                            {review.image_url && (
                                <>
                                    <div className="absolute inset-0 z-0">
                                        <img src={review.image_url} alt="Meal" className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30"></div>
                                    </div>
                                </>
                            )}

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="font-serif text-culinary-cream text-lg leading-none mb-1">{review.user_name}</h4>
                                        <div className="flex text-culinary-gold gap-0.5">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-gray-700 fill-gray-700'}`} />
                                            ))}
                                        </div>
                                    </div>
                                    {/* Quotation Decoration */}
                                    <Quote className="w-8 h-8 text-gray-800 fill-gray-800" />
                                </div>

                                <p className="text-gray-300 font-sans text-sm leading-relaxed line-clamp-3 italic">
                                    "{review.comment}"
                                </p>
                            </div>

                            {/* Footer: Date & Link */}
                            <div className="relative z-10 mt-6 pt-4 border-t border-gray-800/50 flex items-center justify-between">
                                <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                                    {new Date(review.created_at).toLocaleDateString()}
                                </span>

                                {review.video_url && (
                                    <a
                                        href={review.video_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-culinary-gold hover:text-white transition-colors"
                                    >
                                        {getPlatformIcon(review.platform)}
                                        <span className="flex items-center gap-1">Watch <ExternalLink className="w-3 h-3" /></span>
                                    </a>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <AddReviewModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onReviewAdded={fetchReviews}
            />
        </section>
    );
};
