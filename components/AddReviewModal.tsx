import React, { useState } from 'react';
import { Star, X, Video, Link as LinkIcon, Check } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface AddReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onReviewAdded: () => void;
}

export const AddReviewModal: React.FC<AddReviewModalProps> = ({ isOpen, onClose, onReviewAdded }) => {
    const [name, setName] = useState('');
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simple platform detection
        let platform = null;
        if (videoUrl.includes('youtube') || videoUrl.includes('youtu.be')) platform = 'youtube';
        else if (videoUrl.includes('tiktok')) platform = 'tiktok';
        else if (videoUrl.includes('instagram')) platform = 'instagram';

        try {
            const { error } = await supabase.from('reviews').insert({
                user_name: name,
                rating,
                comment,
                video_url: videoUrl || null,
                platform
            });

            if (error) throw error;

            onReviewAdded();
            handleClose();
        } catch (err) {
            console.error('Error adding review:', err);
            alert('Failed to post review. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setName('');
        setRating(5);
        setComment('');
        setVideoUrl('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-culinary-dark border border-gray-700 w-full max-w-md rounded-lg shadow-2xl relative overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-black/40">
                    <h2 className="text-xl font-serif text-culinary-cream">Share Your Experience</h2>
                    <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">

                    {/* Rating */}
                    <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                className={`transition-all duration-200 hover:scale-110 ${rating >= star ? 'text-culinary-gold fill-culinary-gold' : 'text-gray-600'}`}
                            >
                                <Star className="w-8 h-8" />
                            </button>
                        ))}
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2 font-sans font-bold">Your Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-black/50 border border-gray-600 rounded-sm p-3 text-gray-200 focus:border-culinary-gold focus:outline-none transition-colors"
                            placeholder="Chef John Doe"
                        />
                    </div>

                    {/* Comment */}
                    <div>
                        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2 font-sans font-bold">Review</label>
                        <textarea
                            required
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full bg-black/50 border border-gray-600 rounded-sm p-3 text-gray-200 focus:border-culinary-gold focus:outline-none transition-colors h-24 resize-none"
                            placeholder="The carbonara was absolutely divine..."
                        />
                    </div>

                    {/* Video Link */}
                    <div>
                        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2 font-sans font-bold flex items-center gap-2">
                            <Video className="w-3 h-3 text-culinary-gold" /> Video Link <span className="text-gray-600 normal-case font-normal">(Optional)</span>
                        </label>
                        <div className="relative">
                            <input
                                type="url"
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                                className="w-full bg-black/50 border border-gray-600 rounded-sm p-3 pl-10 text-gray-200 focus:border-culinary-gold focus:outline-none transition-colors"
                                placeholder="https://tiktok.com/@..."
                            />
                            <LinkIcon className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1 ml-1">YouTube, TikTok, or Instagram links supported</p>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-culinary-gold text-culinary-dark font-serif font-bold uppercase tracking-widest py-3 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? 'Posting...' : 'Post Review'}
                    </button>
                </form>
            </div>
        </div>
    );
};
