// Add caching directives
import CategoryClientPage from '../../components/CategoryClientPage';
import React from 'react';
import { headers } from 'next/headers';

// Set 24-hour cache period
export const revalidate = 86400; // 24 hours in seconds

export default function CategoryPage({ params }) {
    // Read headers to enable caching
    headers();

    // Properly unwrap params
    const unwrappedParams = React.use(params);

    // Pass the unwrapped params to client component
    return <CategoryClientPage category={unwrappedParams.category} />;
}