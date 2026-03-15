import { Helmet } from 'react-helmet-async';

const SEO = ({ title, description, url, image, keywords }) => {
    const siteName = "LocalAwaaz";
    // If a specific title is provided, use it. Otherwise, use the default brand title.
    const fullTitle = title ? `${siteName} | ${title}` : `${siteName} | Apni Baat, Apni Awaaz`;

    const defaultDesc = "LocalAwaaz is an independent civic platform where citizens can report local issues, track their resolutions, and earn recognition badges.";
    const defaultImage = "https://www.localawaaz.in/og-image.jpg";
    const defaultKeywords = "localawaaz, apni baat apni awaaz, report local issues, civic tech platform";

    return (
        <Helmet>
            {/* Standard Meta Tags */}
            <title>{fullTitle}</title>
            <meta name="description" content={description || defaultDesc} />
            <meta name="keywords" content={keywords || defaultKeywords} />

            {/* Open Graph / Facebook / LinkedIn / WhatsApp */}
            <meta property="og:type" content="website" />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description || defaultDesc} />
            <meta property="og:url" content={`https://www.localawaaz.in${url || ''}`} />
            <meta property="og:image" content={image || defaultImage} />

            {/* Twitter Card */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:site" content="@localawaaz247" />
            <meta property="twitter:title" content={fullTitle} />
            <meta property="twitter:description" content={description || defaultDesc} />
            <meta property="twitter:image" content={image || defaultImage} />
        </Helmet>
    );
};

export default SEO;