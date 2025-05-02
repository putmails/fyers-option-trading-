import { create } from 'zustand';
import {
  formatOptionChainData,
  getOptionChainData,
} from '../services/fyers-option-chain-service';
import { availableSymbols } from '../utils/constant';
import { calculateSupportResistance, calculateTheoreticalPrices, estimateImpliedVolatility, identifyTradingOpportunities } from '../utils/options-analysis';
import { analyzeOptionVolatility } from '../utils/volatility-analysis';

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
  selectedSymbol: availableSymbols[0].value, // Default to the first symbol in the list
  selectedExpiry: null,
  strikeCount: 10,
  isLoading: false,
  error: null,

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
      set({ isLoading: true, error: null });

      const data = await getOptionChainData(symbol, 10);
      const formattedData = formatOptionChainData(data);

      if (formattedData && data) {

        // Sort options by strike price in ascending order
        const sortedOptions = [...formattedData.options].sort(
          (a, b) => a.strikePrice - b.strikePrice
        );
        set({ underlying: formattedData.underlying, options: sortedOptions, expiryDates: formattedData.expiryDates });


        if (formattedData.expiryDates.length > 0 && !get().selectedExpiry) {
          set({ selectedExpiry: formattedData.expiryDates[0].value });
        }


        // Pass data to parent component
        // if (onDataUpdate) {
        //   onDataUpdate(data);
        // }

        // Calculate support and resistance levels
        if (formattedData.underlying && formattedData.underlying.ltp) {
          const spotPrice = formattedData.underlying.ltp;

          // Estimate implied volatility from market data
          const estimatedIV = estimateImpliedVolatility(
            sortedOptions,
            spotPrice
          );
          const estimatedHV = estimatedIV * 0.85;

           // Estimate historical volatility (in a real app, this would come from market data)
          // For now, we'll simulate it as slightly lower than IV
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
              volatilitySkew: skewAnalysis
            },  
            supportResistance: levels
          })


          // Get current expiry date in DD-MM-YYYY format
          const expiryDate =
            formattedData.expiryDates.length > 0
              ? formattedData.expiryDates[0].label
              : '';

          // Calculate theoretical prices
          const optionsWithTheoreticalPrices = calculateTheoreticalPrices(
            sortedOptions,
            spotPrice,
            expiryDate,
            estimatedIV
          );

          // Add volatility analysis to each option
          const optionsWithVolatilityAnalysis =
            optionsWithTheoreticalPrices.map((option) => {
              const enhancedOption = { ...option };

              if (option.call) {
                const volatilityAnalysis = analyzeOptionVolatility(
                  {
                    ...option.call,
                    impliedVolatility: estimatedIV,
                    theoreticalPrice: option.call.theoreticalPrice,
                    greeks: option.call.greeks,
                  },
                  formattedData.underlying
                );

                enhancedOption.call = {
                  ...option.call,
                  volatilityAnalysis,
                };
              }

              if (option.put) {
                const volatilityAnalysis = analyzeOptionVolatility(
                  {
                    ...option.put,
                    impliedVolatility: estimatedIV,
                    theoreticalPrice: option.put.theoreticalPrice,
                    greeks: option.put.greeks,
                  },
                  formattedData.underlying
                );

                enhancedOption.put = {
                  ...option.put,
                  volatilityAnalysis,
                };
              }

              return enhancedOption;
            });

          // Ensure final enhanced options are sorted by strike price
          const sortedEnhancedOptions = [...optionsWithVolatilityAnalysis].sort(
            (a, b) => a.strikePrice - b.strikePrice
          );
          // Identify trading opportunities
          const opportunities = identifyTradingOpportunities(
            sortedEnhancedOptions
          );

          set({
            enhancedOptions: sortedEnhancedOptions,
            tradingOpportunities: opportunities
          })

          
        }

        // Reset selection
        set({
          selectedRow: null,
          setSelectedOptionType: null,
        })
      }

      // Update store with fetched data
      set((state) => ({
        ...state,
        optionChainData: {
          formattedData: formattedData,
          data: data,
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
