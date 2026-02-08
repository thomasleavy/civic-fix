import { useQuery } from '@tanstack/react-query';
import { newsService } from '../services/api';
import { format } from 'date-fns';

interface LocalNewsProps {
  county: string;
}

const LocalNews = ({ county }: LocalNewsProps) => {
  const { data: newsData, isLoading } = useQuery({
    queryKey: ['news', county],
    queryFn: () => newsService.getByCounty(county, 3),
    enabled: !!county,
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes (news doesn't change that frequently)
    refetchOnWindowFocus: false,
  });

  if (!county || isLoading) {
    return null;
  }

  if (!newsData || newsData.error || !newsData.articles || newsData.articles.length === 0) {
    return null; // Don't show anything if news data is unavailable
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">📰</span>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Local News - {county}</h2>
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Stay informed about what's happening in your area
      </p>
      <div className="space-y-4">
        {newsData.articles.map((article: any, index: number) => (
          <a
            key={index}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 hover:shadow-md transition-all group bg-gray-50 dark:bg-gray-700/50"
          >
            <div className="flex items-start space-x-4">
              {article.imageUrl && (
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2 mb-2">
                  {article.title}
                </h3>
                {article.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
                    {article.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{article.source}</span>
                  {article.publishedAt && (
                    <span>{format(new Date(article.publishedAt), 'MMM d, yyyy')}</span>
                  )}
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
      {newsData.totalResults > 3 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
          Showing 3 of {newsData.totalResults} articles
        </p>
      )}
    </div>
  );
};

export default LocalNews;
