import { generateArticleSchema, generateBreadcrumbSchema } from '../lib/schema.js';

const mockArticle = {
    title: 'Test Article',
    pubDate: '2023-01-01T00:00:00.000Z',
    savedAt: '2023-01-02T00:00:00.000Z',
    image: '/test-image.jpg',
    metaDescription: 'Test description',
    keywords: ['test', 'schema'],
    content: 'This is a test article content that is long enough to be truncated.'
};

const slug = 'test-article-slug';

console.log('--- Article Schema ---');
console.log(JSON.stringify(generateArticleSchema(mockArticle, slug), null, 2));

console.log('\n--- Breadcrumb Schema ---');
console.log(JSON.stringify(generateBreadcrumbSchema(slug, mockArticle.title), null, 2));
