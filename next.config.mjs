/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: [
            'firebasestorage.googleapis.com',
            'images.unsplash.com',  // Keep this if you're using Unsplash images
            'lh3.googleusercontent.com',  // For Google user profile pictures
        ],
    },
};

export default nextConfig;