export const extractStorageFileName = (url) => {
    if (!url) return null;

    // Try to extract using regex first
    const regexMatch = url.match(/(?:articles|submissions)%2F(.+?)(?:\?|$)/);
    if (regexMatch && regexMatch[1]) {
        return regexMatch[1];
    }

    // Fallback to splitting URL
    try {
        const urlParts = url.split('/');
        return urlParts[urlParts.length - 1].split('?')[0];
    } catch (e) {
        console.error("Could not extract file name from URL:", url);
        return null;
    }
}