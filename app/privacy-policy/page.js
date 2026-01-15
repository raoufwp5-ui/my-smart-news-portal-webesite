export const metadata = {
    title: 'Privacy Policy | Global Brief',
    description: 'Privacy Policy and Data Collection practices at Global Brief.',
};

export default function PrivacyPage() {
    return (
        <div className="max-w-4xl mx-auto py-12 px-4 prose dark:prose-invert">
            <h1>Privacy Policy</h1>
            <p className="text-sm text-gray-500">Last Updated: {new Date().toLocaleDateString()}</p>

            <p>At Global Brief, accessible from https://global-brief-news.vercel.app, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Global Brief and how we use it.</p>

            <h2>Log Files</h2>
            <p>Global Brief follows a standard procedure of using log files. These files log visitors when they visit websites. The information collected by log files includes internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks.</p>

            <h2>Cookies and Web Beacons</h2>
            <p>Like any other website, Global Brief uses 'cookies'. These cookies are used to store information including visitors' preferences, and the pages on the website that the visitor accessed or visited. The information is used to optimize the users' experience by customizing our web page content based on visitors' browser type and/or other information.</p>

            <h2>Google DoubleClick DART Cookie</h2>
            <p>Google is one of a third-party vendor on our site. It also uses cookies, known as DART cookies, to serve ads to our site visitors based upon their visit to www.website.com and other sites on the internet.</p>

            <h2>Contact Us</h2>
            <p>If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us at <strong>rww3772@gmail.com</strong>.</p>
            <p>
                <strong>Postal Address:</strong><br />
                Cité El Yasmine 2, Bir El Djir<br />
                Oran, Algeria
            </p>
        </div>
    );
}
