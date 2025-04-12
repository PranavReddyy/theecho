// Add caching directives
import React from 'react';
import ArticleClientPage from '../../../components/ArticleClientPage';
import { headers } from 'next/headers';

// Set 24-hour cache period
export const revalidate = 86400; // 24 hours in seconds

export default function ArticlePage({ params }) {
    // Read headers to enable caching
    headers();

    // Unwrap the params Promise
    const unwrappedParams = React.use(params);

    // Pass unwrapped params to the client component
    return <ArticleClientPage
        category={unwrappedParams.category}
        slug={unwrappedParams.slug}
    />;
}