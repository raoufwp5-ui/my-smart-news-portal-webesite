/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';

export default function HeroNews({ article }) {
    if (!article) return null;

    const { title, tldr, image, date, source } = article;

    return (
        <section className="mb-12 relative rounded-3xl overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-10" />

            <div className="h-[500px] w-full bg-gray-200 dark:bg-gray-800 relative">
                {image ? (
                    <img
                        src={image}
                        alt={title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 bg-gray-800">
                        <span className="text-6xl">🌍</span>
                    </div>
                )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 z-20 p-6 md:p-10 lg:p-12">
                <span className="inline-block px-3 py-1 mb-4 text-xs font-bold tracking-wider text-white uppercase bg-blue-600 rounded-full">
                    Featured Story
                </span>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight max-w-4xl drop-shadow-lg">
                    {title}
                </h1>
                <div className="text-gray-200 text-sm md:text-base max-w-2xl mb-6 line-clamp-2">
                    {tldr && tldr[0] ? tldr[0] : "Read the full coverage on this developing story."}
                </div>

                <a
                    href={source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 text-sm font-semibold text-white transition-all bg-white/20 backdrop-blur-sm border border-white/30 rounded-full hover:bg-white hover:text-black"
                >
                    Read Full Story
                </a>
            </div>
        </section>
    );
}
