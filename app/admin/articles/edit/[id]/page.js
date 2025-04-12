'use client';

import React from 'react';
import ArticleEditor from '../../../../../components/ArticleEditor';

export default function EditArticlePage({ params }) {
    // Unwrap params with React.use()
    const unwrappedParams = React.use(params);
    const id = unwrappedParams.id;

    return <ArticleEditor articleId={id} />;
}