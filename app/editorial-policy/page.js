export const metadata = {
    title: 'Editorial Policy | Global Brief',
    description: 'Our standards for journalism, ethics, and corrections.',
};

export default function EditorialPolicyPage() {
    return (
        <div className="max-w-4xl mx-auto py-12 px-4 prose dark:prose-invert">
            <h1>Editorial Policy & Standards</h1>

            <p className="lead">At Global Brief, trust is our currency. We adhere to strict editorial guidelines to ensure our reporting is accurate, fair, and transparent.</p>

            <h2>1. Accuracy and Fact-Checking</h2>
            <p>Our primary duty is to the truth. We verify all information with primary sources whenever possible. Our AI-assisted workflows are monitored by human editors to prevent hallucination or bias.</p>

            <h2>2. Corrections</h2>
            <p>We are human and may make mistakes. When we do, we correct them promptly and transparently. Corrections are noted at the bottom of the article. To report an error, email us at rww3772@gmail.com.</p>

            <h2>3. Independence</h2>
            <p>Global Brief is an independent organization. We do not accept payment in exchange for news coverage. Sponsored content, if any, is clearly labeled.</p>

            <h2>4. AI Ethics</h2>
            <p>We use Artificial Intelligence to assist in data gathering, summarization, and formatting. However, all final editorial decisions and publishing rights reside with our human editorial team led by Alex Mercer.</p>

            <h2>5. Hate Speech and Harassment</h2>
            <p>We have a zero-tolerance policy for hate speech, harassment, or content that incites violence. Such content has no place on our platform.</p>

            <hr />
            <p><strong>Editorial Contact:</strong><br />
                Alex Mercer, Editor-in-Chief<br />
                Email: rww3772@gmail.com<br />
                Address: Cité El Yasmine 2, Bir El Djir, Oran, Algeria
            </p>
        </div>
    );
}
