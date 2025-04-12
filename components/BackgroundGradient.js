'use client';

export default function BackgroundGradient() {
    return (
        <>
            {/* Top-only gradient that fades to white */}
            <div
                className="fixed inset-0 z-[-1] pointer-events-none"
                style={{
                    background: `linear-gradient(to bottom, 
            #ded8ca 0%, 
            #ded8ca 5%, 
            rgb(255, 255, 255) 25%, 
            rgb(255, 255, 255) 100%)`,
                    backgroundSize: '100% 100%'
                }}
                aria-hidden="true"
            />
        </>
    );
}