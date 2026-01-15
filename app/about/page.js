export const metadata = {
    title: 'About Us | Global Brief',
    description: 'Learn about Global Brief, our mission, and our commitment to unbiased global reporting.',
};

export default function AboutPage() {
    return (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-8">About Global Brief</h1>

            <div className="prose prose-lg dark:prose-invert">
                <p className="lead text-xl text-gray-600 dark:text-gray-300 mb-8">
                    Global Brief is a premier digital news organization dedicated to delivering accurate, unbiased, and comprehensive reporting on the stories that shape our world. From breaking political developments to the frontiers of technology and business, we provide the context you need to understand the global landscape.
                </p>

                <h2>Our Mission</h2>
                <p>
                    In an era of information overload, our mission is clarity. We strive to cut through the noise with data-driven journalism and expert analysis. We believe that an informed public is the cornerstone of a thriving global society.
                </p>

                <h2>Our Team</h2>
                <p>
                    Global Brief is led by a dedicated team of editors, analysts, and technologists. Under the leadership of our Editorial Lead, <strong>Alex Mercer</strong> (Editor-in-Chief), we adhere to the highest standards of journalistic integrity.
                </p>

                <h2>Contact Us</h2>
                <p>
                    We welcome feedback, tips, and inquiries from our readers.
                </p>
                <ul className="list-none pl-0">
                    <li><strong>Email:</strong> rww3772@gmail.com</li>
                    <li><strong>Address:</strong> Cité El Yasmine 2, Bir El Djir, Oran, Dhif Lakhdar Residence, Floor 11, Apt 63, Algeria</li>
                </ul>
            </div>
        </div>
    );
}
