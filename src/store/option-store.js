import { create } from 'zustand';
import {
  fetchHistoricalCloses,
  formatOptionChainData,
  getOptionChainData,
} from '../services/fyers-option-chain-service';
import { availableSymbols, PERIOD_DAYS } from '../utils/constant';
import {
  calculateSupportResistance,
  estimateImpliedVolatility,
  identifyTradingOpportunities,
} from '../utils/options-analysis';
import {
  analyzeOptionVolatility,
  calculateHistoricalVolatility,
} from '../utils/volatility-analysis';
import { calibrateHestonModel } from '../utils/optionPricingModels/heston';
import { calculateVolatilityMetrics } from '../utils/advancedOptionsAnalysis';
import { calculateOptionCallPutPrice } from '../services/pricingService';

// Define the store using Zustand's create function
const useOptionStore = create((set, get) => ({
  // Core state properties
  optionChainData: {
    formattedData: null,
    data: null,
  },
  options: [],
  underlying: null,
  expiryDates: [],
  volatilityData: {
    impliedVolatility: 0.3,
    historicalVolatility: 0.25,
    volatilitySkew: null,
  },
  supportResistance: {
    support: [],
    resistance: [],
  },
  enhancedOptions: [],
  tradingOpportunities: {
    callOpportunities: [],
    putOpportunities: [],
  },
  selectedOptionType: null,
  selectedRow: null,
  selectedSymbol: availableSymbols[1].value, // Default to the first symbol in the list
  selectedExpiry: null,
  strikeCount: 5,
  isLoading: false,
  error: null,
  marketConditions: { // Required in case of heston and NN model
    volatilityIndex: 18.5, // FIXME: Approximate VIX value for India
    putCallRatio: 0.95, // FIXME: Will be calculated from option chain
    marketTrend: 'bullish',  // FIXME: determine bullish or bearing from chain data
    liquidity: 'high', // FIXME: determine liquidity from chain data
  },
  hestonParams: calibrateHestonModel([]), // This will return default parameters

  // Set selected symbol
  setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),

  // Set selected expiry date
  setSelectedExpiry: (expiry) => set({ selectedExpiry: expiry }),

  // Set strike count
  setStrikeCount: (count) => set({ strikeCount: count }),

  // New setter methods
  setOptions: (options) => set({ options }),

  setUnderlying: (underlying) => set({ underlying }),

  setExpiryDates: (dates) => set({ expiryDates: dates }),

  setVolatilityData: (volatilityData) => set({ volatilityData }),

  setSupportResistance: (supportResistance) => set({ supportResistance }),

  setEnhancedOptions: (enhancedOptions) => set({ enhancedOptions }),

  setTradingOpportunities: (opportunities) =>
    set({ tradingOpportunities: opportunities }),

  setSelectedOptionType: (optionType) =>
    set({ selectedOptionType: optionType }),

  setSelectedRow: (row) => set({ selectedRow: row }),

  // Update option chain data
  setOptionChainData: (data, formattedData) =>
    set({
      optionChainData: {
        data: data,
        formattedData: formattedData,
      },
    }),

  // Update loading state
  setLoading: (isLoading) => set({ isLoading }),

  // Update error state
  setError: (error) => set({ error }),

  // Fetch option chain data for a symbol
  fetchOptionChain: async (symbol) => {
    try {
      set({ isLoading: false, error: null });

      const rawData = await getOptionChainData(symbol, 10);
      const formattedData = formatOptionChainData(rawData);
      const closes = await fetchHistoricalCloses(symbol, PERIOD_DAYS);
      console.log('🚀 ~ fetchOptionChain: ~ formattedData:', formattedData);

      if (formattedData && rawData) {
        // Sort options by strike price in ascending order
        const sortedOptions = [...formattedData.options].sort(
          (a, b) => a.strikePrice - b.strikePrice
        );
        set({
          underlying: formattedData.underlying,
          options: sortedOptions,
          expiryDates: formattedData.expiryDates,
        });

        if (formattedData.expiryDates.length > 0 && !get().selectedExpiry) {
          set({ selectedExpiry: formattedData.expiryDates[0].value }); // TODO: Expiry date label and value can be mismatched.
        }

        // Calculate support and resistance levels
        if (formattedData.underlying && formattedData.underlying.ltp) {
          const spotPrice = formattedData.underlying.ltp;

          const volatilityMetrics = calculateVolatilityMetrics(sortedOptions);

          const expiry =
            get().selectedExpiry || formattedData.expiryDates[0].value;
          console.log('🚀 ~ fetchOptionChain: ~ expiry:', expiry);
          // Estimate implied volatility from market data
          const estimatedIV = estimateImpliedVolatility(
            sortedOptions,
            spotPrice,
            expiry
          );
          const closesDataForHV = await closes;
          // console.log("🚀 ~ fetchOptionChain: ~ closesDataForHV:", closesDataForHV)

          const estimatedHV = calculateHistoricalVolatility(closesDataForHV);
          // console.log("🚀 ~ fetchOptionChain: ~ estimatedHV:", estimatedHV)

       
          // Calculate volatility skew
          const skewAnalysis = {
            skewRatio: estimatedIV / estimatedHV,
            skewDifference: estimatedIV - estimatedHV,
            skewPercentage: ((estimatedIV - estimatedHV) / estimatedHV) * 100,
          };

          // Calculate support/resistance levels
          const levels = calculateSupportResistance(
            spotPrice,
            sortedOptions,
            estimatedIV
          );

          set({
            volatilityData: {
              ...get().volatilityData,
              impliedVolatility: estimatedIV,
              historicalVolatility: estimatedHV,
              volatilitySkew: skewAnalysis,
            },
            supportResistance: levels,
            // FIXME: marketConditions should be updated from API in case of useOnlyBS is false
            marketConditions: {
              ...get().marketConditions,
              putCallRatio: volatilityMetrics.putCallOIRatio,
            },
          });

          const optionsWithTheoreticalPrices = sortedOptions.map((option) =>
            calculateOptionCallPutPrice(
              option,
              formattedData.underlying,
              {
                ...get().marketConditions,
                putCallRatio: volatilityMetrics.putCallOIRatio,
              },
              expiry
            )
          );

          // Add volatility analysis to each option
          const optionsWithVolatilityAnalysis =
            optionsWithTheoreticalPrices.map((option) => {
              const enhancedOption = { ...option };

              if (option.call) {
                const volatilityAnalysis = analyzeOptionVolatility(
                  {
                    ...option.call,
                    impliedVolatility: option.call.impliedVolatility,
                    theoreticalPrice: option.call.hybridPrice,
                    greeks: option.call.greeks,
                  },
                  formattedData.underlying,
                  estimatedHV
                );

                enhancedOption.call = {
                  ...option.call,
                  theoreticalPrice: option.call.hybridPrice,
                  priceDifference:
                    ((option.call.ltp -
                      option.call.hybridPrice )/ option.call.hybridPrice) *
                    100,
                  volatilityAnalysis,
                };
              }

              if (option.put) {
                const volatilityAnalysis = analyzeOptionVolatility(
                  {
                    ...option.put,
                    impliedVolatility: option.put.impliedVolatility,
                    theoreticalPrice: option.put.hybridPrice,
                    greeks: option.put.greeks,
                  },
                  formattedData.underlying,
                  estimatedHV
                );

                enhancedOption.put = {
                  ...option.put,
                  theoreticalPrice: option.put.hybridPrice,
                  priceDifference:
                    ((option.put.ltp - option.put.hybridPrice) /
                      option.put.hybridPrice) *
                    100,
                  volatilityAnalysis,
                };
              }

              return enhancedOption;
            });

          // Ensure final enhanced options are sorted by strike price
          const sortedEnhancedOptions = [...optionsWithVolatilityAnalysis].sort(
            (a, b) => a.strikePrice - b.strikePrice
          );
          console.log(
            '🚀 ~ fetchOptionChain: ~ sortedEnhancedOptions:',
            sortedEnhancedOptions
          );
          // Identify trading opportunities
          const opportunities = identifyTradingOpportunities(
            sortedEnhancedOptions
          );

          set({
            enhancedOptions: sortedEnhancedOptions,
            tradingOpportunities: opportunities,
          });
        }

        // Reset selection
        set({
          selectedRow: null,
          setSelectedOptionType: null,
        });
      }

      // Update store with fetched data
      set((state) => ({
        ...state,
        optionChainData: {
          formattedData: formattedData,
          data: rawData,
        },
        selectedSymbol: symbol,
        isLoading: false,
      }));

      // return mockData;
    } catch (error) {
      set({
        error: error.message || 'Failed to fetch option chain data',
        isLoading: false,
      });
      // throw error;
    }
  },

  // Clear all data
  clearData: () =>
    set({
      optionChainData: {},
      selectedSymbol: availableSymbols[0].value,
      isLoading: false,
      error: null,
    }),
}));

export default useOptionStore;
