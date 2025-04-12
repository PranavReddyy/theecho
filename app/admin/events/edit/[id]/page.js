'use client';

import React from 'react';
import EventEditor from '../../../../../components/EventEditor';

export default function EditEventPage({ params }) {
    // Unwrap params with React.use()
    const unwrappedParams = React.use(params);
    const id = unwrappedParams.id;

    return <EventEditor eventId={id} />;
}