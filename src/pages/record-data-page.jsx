import React, { useState, useRef, useCallback, useEffect } from 'react';
import useOptionStore from '../store/option-store';
import { availableOptions, RISK_FREE_INTEREST } from '../utils/constant';
import { updateGoogleSheet } from '../services/google-sheet-service';
import { calculateParityDeviation } from '../utils/optionPricingUtils';

const RECORD_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes

const RecordDataPage = () => {
  const { fetchOptionChain } = useOptionStore();
  const [isRecording, setIsRecording] = useState(false);
  console.log('🚀 ~ RecordDataPage ~ isRecording:', isRecording);
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef(null);

  // Sequentially fetch and update for each option, one at a time, every 5 minutes
  useEffect(() => {
    let cancelled = false;
    async function processNextOption(index) {
      if (!isRecording || index >= availableOptions.length) {
        setIsRecording(false);
        setCurrentIndex(0);
        return;
      }
      const option = availableOptions[index];
      await fetchOptionChain(option.value, {
        label: '29-05-2025',
        value: '1748512800',
      });
      const  { underlying, selectedExpiry, volatilityData, atmPriceDetails }  = useOptionStore.getState();
      const { parityDeviation, deviationPercentage } = calculateParityDeviation(
        atmPriceDetails.call.ltp,
        atmPriceDetails.put.ltp,
        underlying?.ltp,
        atmPriceDetails.strikePrice,
        selectedExpiry.value,
        RISK_FREE_INTEREST
      );
      console.log("🚀 ~ processNextOption ~ parityDeviation:", parityDeviation)
      console.log("🚀 ~ processNextOption ~ deviationPercentage:", deviationPercentage)
      const data = [
        volatilityData.impliedVolatility,
        volatilityData.historicalVolatility,
        ""+volatilityData.volatilitySkew.skewRatio,
        ""+atmPriceDetails.call.oi,
        ""+atmPriceDetails.call.oichp,
        ""+atmPriceDetails.call.volatilityAnalysis.impliedVolatility,
        ""+atmPriceDetails.call.volatilityAnalysis.skewDifference,
        ""+atmPriceDetails.call.volatilityAnalysis.skewPercentage,
        ""+atmPriceDetails.call.volatilityAnalysis.skewRatio,
        atmPriceDetails.call.ltp,
        atmPriceDetails.call.theoreticalPrice,
        atmPriceDetails.strikePrice,
        atmPriceDetails.call.underlyingPrice,
        ""+parityDeviation,
        ""+deviationPercentage,
        atmPriceDetails.strikePrice,
        atmPriceDetails.put.theoreticalPrice,
        atmPriceDetails.put.ltp,
        ""+atmPriceDetails.put.volatilityAnalysis.skewRatio,
        ""+atmPriceDetails.put.volatilityAnalysis.skewPercentage,
        ""+atmPriceDetails.put.volatilityAnalysis.skewDifference,
        ""+atmPriceDetails.put.volatilityAnalysis.impliedVolatility,
        ""+atmPriceDetails.put.oichp,
        ""+atmPriceDetails.put.oi,
      ];
      console.log('🚀 ~ processNextOption ~ data:', data);
      await updateGoogleSheet(option, data);
      if (!cancelled && isRecording) {
        timerRef.current = setTimeout(() => {
          setCurrentIndex(prev => prev + 1);
        }, 30 * 1000);
      }
    }
    console.log("🚀 ~ useEffect ~ isRecording:", isRecording)
    if (isRecording && currentIndex < availableOptions.length) {
      console.log("🚀 ~ useEffect ~ isRecording:", isRecording)
      processNextOption(currentIndex);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      cancelled = true;
    };
  }, [currentIndex, fetchOptionChain, isRecording]);

  const handlePlay = useCallback(() => {
    if (!isRecording) {
      console.log('🚀 ~ handlePlay ~ isRecording:', isRecording);
      setIsRecording(true);
      setCurrentIndex(0);
    }
  }, [isRecording]);

  const handlePause = useCallback(() => {
    setIsRecording(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h2>Record Data</h2>
      <button
        onClick={handlePlay}
        disabled={isRecording}
        style={{ marginRight: 8 }}
      >
        Play
      </button>
      <button onClick={handlePause} disabled={!isRecording}>
        Pause
      </button>
      <div style={{ marginTop: 16 }}>
        {isRecording ? (
          <span>
            Recording... ({currentIndex}/{availableOptions.length})
          </span>
        ) : (
          <span>Paused</span>
        )}
      </div>
    </div>
  );
};

export default RecordDataPage;
