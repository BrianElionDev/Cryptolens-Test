// Create new file for Categories tab
interface CategoriesTabProps {
  processedData: {
    categoryDistribution: { name: string; value: number }[];
    coinCategories: {
      coin: string;
      categories: string[];
      channel: string;
      model?: string;
      rpoints: number;
    }[];
  };
  selectedChannels: string[];
  selectedModels: string[];
}

export const CategoriesTab = ({
  processedData = {
    categoryDistribution: [],
    coinCategories: [],
  },
  selectedChannels = [],
  selectedModels = [],
}: CategoriesTabProps) => {
  // Add null checks for processed data
  const categoryDistribution = processedData?.categoryDistribution || [];
  const coinCategories = processedData?.coinCategories || [];

  const filteredCategories = categoryDistribution
    .filter((cat) => {
      if (
        !coinCategories ||
        !Array.isArray(coinCategories) ||
        coinCategories.length === 0
      ) {
        return false;
      }

      return coinCategories.some((coin) => {
        if (!coin || !coin.categories || !Array.isArray(coin.categories)) {
          return false;
        }

        const channelMatch =
          selectedChannels.length === 0 ||
          selectedChannels.includes(coin.channel);
        const modelMatch =
          selectedModels.length === 0 ||
          !coin.model ||
          selectedModels.includes(coin.model) ||
          (selectedModels.includes("all") && coin.model);

        return channelMatch && modelMatch && coin.categories.includes(cat.name);
      });
    })
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-xl bg-gradient-to-r from-blue-900/20 via-purple-900/20 to-pink-900/20 border border-blue-500/20 backdrop-blur-sm">
        <div className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-cyan-200 mb-6">
            Coin Categories Overview
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="py-4 px-6 text-left text-sm font-medium text-gray-400 bg-gray-900/40">
                  Category
                </th>
                <th className="py-4 px-6 text-left text-sm font-medium text-gray-400 bg-gray-900/40">
                  Coins
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((category, index) => (
                <tr
                  key={`${category.name}-${index}`}
                  className="border-b border-gray-800 hover:bg-gray-900/40 transition-colors"
                >
                  <td className="py-4 px-6 text-sm text-gray-300">
                    {category.name}
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-300">
                    {category.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
