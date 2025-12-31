import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface ImageWithLoaderProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    containerClassName?: string;
}

const ImageWithLoader: React.FC<ImageWithLoaderProps> = ({
    src,
    alt,
    className = '',
    containerClassName = '',
    ...props
}) => {
    const [isLoading, setIsLoading] = useState(true);

    return (
        <div className={`relative overflow-hidden ${containerClassName}`}>
            {isLoading && (
                <div className="absolute inset-0 bg-gray-800 animate-pulse flex items-center justify-center z-10">
                    <Loader2 className="w-8 h-8 text-culinary-gold animate-spin opacity-50" />
                </div>
            )}
            <img
                src={src}
                alt={alt}
                className={`${className} transition-opacity duration-700 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                onLoad={() => setIsLoading(false)}
                {...props}
            />
        </div>
    );
};

export default ImageWithLoader;
