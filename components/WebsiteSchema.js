export default function WebsiteSchema() {
    const schemaData = {
        "@context": "https://schema.org",
        "@graph": [
            // Organization Schema
            {
                "@type": "Organization",
                "@id": "https://global-brief.vercel.app/#organization",
                "name": "Global Brief",
                "url": "https://global-brief.vercel.app",
                "logo": {
                    "@type": "ImageObject",
                    "url": "https://global-brief.vercel.app/logo-square.png",
                    "width": 512,
                    "height": 512
                },
                "sameAs": [
                    "https://twitter.com/globalbrief",
                    "https://facebook.com/globalbrief"
                ]
            },
            // Website Schema
            {
                "@type": "WebSite",
                "@id": "https://global-brief.vercel.app/#website",
                "url": "https://global-brief.vercel.app",
                "name": "Global Brief",
                "description": "In-depth reporting and analysis on the latest global trends using primary sources",
                "publisher": {
                    "@id": "https://global-brief.vercel.app/#organization"
                },
                "potentialAction": {
                    "@type": "SearchAction",
                    "target": {
                        "@type": "EntryPoint",
                        "urlTemplate": "https://global-brief.vercel.app/search?q={search_term_string}"
                    },
                    "query-input": "required name=search_term_string"
                }
            }
        ]
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
    );
}
