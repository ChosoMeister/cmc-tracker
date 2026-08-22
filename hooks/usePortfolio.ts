
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Transaction, PriceData, PortfolioSummary, AssetSummary, getAssetDetail } from '../types';
import { API } from '../services/api';
import * as PriceService from '../services/priceService';

export interface SessionUser {
    username: string;
    isAdmin: boolean;
    displayName?: string;
}

interface UsePortfolioOptions {
    user: SessionUser | null;
    onPriceUpdateSuccess?: (message: string) => void;
    onPriceUpdateSkipped?: (message: string) => void;
    onPriceUpdateError?: (message: string) => void;
}

interface UsePortfolioReturn {
    transactions: Transaction[];
    prices: PriceData | null;
    loading: boolean;
    isPriceUpdating: boolean;
    portfolioSummary: PortfolioSummary;
    sources: { title: string; uri: string }[];
    refreshPrices: () => Promise<void>;
    saveTransaction: (t: Transaction) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;
}

const FALLBACK_SOURCES = [
    { title: 'قیمت ارز آلان‌چند', uri: 'https://alanchand.com/currencies-price' },
    { title: 'قیمت رمزارز آلان‌چند', uri: 'https://alanchand.com/crypto-price' },
];

/**
 * Hook for managing portfolio data, transactions, and prices
 */
export const usePortfolio = ({
    user,
    onPriceUpdateSuccess,
    onPriceUpdateSkipped,
    onPriceUpdateError,
}: UsePortfolioOptions): UsePortfolioReturn => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [prices, setPrices] = useState<PriceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPriceUpdating, setIsPriceUpdating] = useState(false);
    const [sources, setSources] = useState<{ title: string; uri: string }[]>([]);

    // Load initial data
    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const loadData = async () => {
            setLoading(true);
            try {
                const [txs, p] = await Promise.all([
                    API.getTransactions(user.username),
                    PriceService.fetchPrices(),
                ]);
                setTransactions(txs);
                setPrices(p);
            } catch (error) {
                console.error('Failed to load data', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user]);

    // Refresh prices
    const refreshPrices = useCallback(async () => {
        setIsPriceUpdating(true);
        try {
            const result = await PriceService.fetchLivePrices();
            setPrices(result.data);
            setSources(result.sources.length ? result.sources : FALLBACK_SOURCES);

            if (result.skipped) {
                const nextTime = result.nextAllowedAt
                    ? new Date(result.nextAllowedAt).toLocaleTimeString('fa-IR')
                    : '';
                onPriceUpdateSkipped?.(
                    result.message || (nextTime ? `بروزرسانی بعد از ${nextTime}` : 'بروزرسانی کمتر از یک ساعت مجاز نیست')
                );
            } else {
                onPriceUpdateSuccess?.('قیمت‌ها با موفقیت بروزرسانی شد');
            }
        } catch (error) {
            console.error('Price update failed:', error);
            onPriceUpdateError?.('خطا در بروزرسانی قیمت‌ها');
        } finally {
            setIsPriceUpdating(false);
        }
    }, [onPriceUpdateSuccess, onPriceUpdateSkipped, onPriceUpdateError]);

    // Save transaction
    const saveTransaction = useCallback(async (t: Transaction) => {
        if (!user) return;
        const txToSave = t.id ? t : { ...t, id: Math.random().toString(36).substr(2, 9) };
        await API.saveTransaction(user.username, txToSave);
        const updated = await API.getTransactions(user.username);
        setTransactions(updated);
    }, [user]);

    // Delete transaction
    const deleteTransaction = useCallback(async (id: string) => {
        if (!user) return;
        await API.deleteTransaction(user.username, id);
        const updated = await API.getTransactions(user.username);
        setTransactions(updated);
    }, [user]);

    // Calculate portfolio summary
    const portfolioSummary: PortfolioSummary = useMemo(() => {
        if (!prices || transactions.length === 0) {
            return {
                totalValueToman: 0,
                totalCostBasisToman: 0,
                totalPnlToman: 0,
                totalPnlPercent: 0,
                totalRealizedPnlToman: 0,
                totalUnrealizedPnlToman: 0,
                assets: [],
            };
        }

        const currentPriceMap: Record<string, number> = {
            GOLD18: prices.gold18ToToman,
        };

        Object.entries(prices.fiatPricesToman || {}).forEach(([symbol, tomanPrice]) => {
            currentPriceMap[symbol] = tomanPrice;
        });

        Object.entries(prices.cryptoPricesToman || {}).forEach(([symbol, tomanPrice]) => {
            currentPriceMap[symbol] = tomanPrice;
        });

        Object.entries(prices.goldPricesToman || {}).forEach(([symbol, tomanPrice]) => {
            currentPriceMap[symbol] = tomanPrice;
        });

        const assetsMap: Record<string, AssetSummary> = {};

        // Sort transactions chronologically for accurate realized PnL calculations
        const sortedTransactions = [...transactions].sort(
            (a, b) => new Date(a.buyDateTime).getTime() - new Date(b.buyDateTime).getTime()
        );

        sortedTransactions.forEach(tx => {
            const { assetSymbol, quantity, buyPricePerUnit, buyCurrency, feesToman, type = 'BUY' } = tx;
            if (!assetsMap[assetSymbol]) {
                const details = getAssetDetail(assetSymbol);
                assetsMap[assetSymbol] = {
                    symbol: assetSymbol,
                    name: details.name,
                    type: details.type,
                    totalQuantity: 0,
                    currentPriceToman: currentPriceMap[assetSymbol] || 0,
                    currentValueToman: 0,
                    costBasisToman: 0,
                    pnlToman: 0,
                    pnlPercent: 0,
                    realizedPnlToman: 0,
                    unrealizedPnlToman: 0,
                    allocationPercent: 0,
                };
            }
            const asset = assetsMap[assetSymbol];
            const priceInToman = buyCurrency === 'TOMAN'
                ? buyPricePerUnit
                : buyPricePerUnit * (prices.usdToToman || 70000);

            if (type === 'BUY') {
                asset.totalQuantity += quantity;
                const txCostToman = (quantity * priceInToman) + feesToman;
                asset.costBasisToman += txCostToman;
            } else if (type === 'SELL') {
                const avgBuyPrice = asset.totalQuantity > 0 ? (asset.costBasisToman / asset.totalQuantity) : priceInToman;
                const sellProceeds = (quantity * priceInToman) - feesToman;
                const costOfSold = quantity * avgBuyPrice;
                const realizedGain = sellProceeds - costOfSold;

                asset.realizedPnlToman += realizedGain;
                asset.totalQuantity = Math.max(0, asset.totalQuantity - quantity);
                asset.costBasisToman = Math.max(0, asset.costBasisToman - costOfSold);
            }
        });

        let runningTotalValue = 0;
        let runningTotalCost = 0;
        let runningTotalRealized = 0;
        let runningTotalUnrealized = 0;

        const assets = Object.values(assetsMap).map(asset => {
            asset.currentValueToman = asset.totalQuantity * asset.currentPriceToman;
            asset.unrealizedPnlToman = asset.currentValueToman - asset.costBasisToman;
            asset.pnlToman = asset.unrealizedPnlToman + asset.realizedPnlToman;
            asset.pnlPercent = asset.costBasisToman > 0
                ? (asset.unrealizedPnlToman / asset.costBasisToman) * 100
                : 0;

            runningTotalValue += asset.currentValueToman;
            runningTotalCost += asset.costBasisToman;
            runningTotalRealized += asset.realizedPnlToman;
            runningTotalUnrealized += asset.unrealizedPnlToman;
            return asset;
        });

        assets.forEach(a => {
            a.allocationPercent = runningTotalValue > 0
                ? (a.currentValueToman / runningTotalValue) * 100
                : 0;
        });

        return {
            totalValueToman: runningTotalValue,
            totalCostBasisToman: runningTotalCost,
            totalPnlToman: runningTotalUnrealized + runningTotalRealized,
            totalPnlPercent: runningTotalCost > 0
                ? ((runningTotalUnrealized) / runningTotalCost) * 100
                : 0,
            totalRealizedPnlToman: runningTotalRealized,
            totalUnrealizedPnlToman: runningTotalUnrealized,
            assets: assets.sort((a, b) => b.currentValueToman - a.currentValueToman),
        };
    }, [transactions, prices]);

    return {
        transactions,
        prices,
        loading,
        isPriceUpdating,
        portfolioSummary,
        sources,
        refreshPrices,
        saveTransaction,
        deleteTransaction,
    };
};

export default usePortfolio;
