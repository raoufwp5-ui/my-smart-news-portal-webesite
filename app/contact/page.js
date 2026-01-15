export const metadata = {
    title: 'Contact Us | Global Brief',
    description: 'Get in touch with the Global Brief editorial team.',
};

export default function ContactPage() {
    return (
        <div className="max-w-4xl mx-auto py-12 px-4">
            <h1 className="text-4xl font-black mb-8">Contact Global Brief</h1>

            <div className="grid md:grid-cols-2 gap-12">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Get in Touch</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Whether you have a news tip, a correction, or a business inquiry, we want to hear from you. Our team monitors our inbox 24/7.
                    </p>

                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="min-w-[24px]">📧</div>
                            <div>
                                <h3 className="font-bold">Email</h3>
                                <a href="mailto:rww3772@gmail.com" className="text-blue-600 hover:underline">rww3772@gmail.com</a>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="min-w-[24px]">📍</div>
                            <div>
                                <h3 className="font-bold">Headquarters</h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Global Brief Headquarters<br />
                                    Cité El Yasmine 2, Bir El Djir<br />
                                    Dhif Lakhdar Residence, Floor 11, Apt 63<br />
                                    Oran, Algeria
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <h2 className="text-xl font-bold mb-4">Corrections Policy</h2>
                    <p className="text-sm text-gray-500 mb-4">
                        We are committed to accuracy. If you spot an error in our reporting, please contact us immediately with the subject line "Correction Request".
                    </p>
                    <a href="mailto:rww3772@gmail.com?subject=Correction Request" className="block w-full text-center py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors">
                        Submit a Correction
                    </a>
                </div>
            </div>
        </div>
    );
}
