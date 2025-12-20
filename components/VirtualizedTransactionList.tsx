import React, { memo, useCallback, CSSProperties, ReactElement } from 'react';
import { List } from 'react-window';
import { Transaction, getAssetDetail } from '../types';
import { formatNumber } from '../utils/formatting';
import { SwipeableRow } from './SwipeableRow';

interface VirtualizedTransactionListProps {
    transactions: Transaction[];
    onEdit: (transaction: Transaction) => void;
    onDelete: (id: string) => void;
    height?: number;
    itemHeight?: number;
}

interface TransactionRowProps {
    transactions: Transaction[];
    onEdit: (transaction: Transaction) => void;
    onDelete: (id: string) => void;
}

interface RowProps {
    ariaAttributes: {
        "aria-posinset": number;
        "aria-setsize": number;
        role: "listitem";
    };
    index: number;
    style: CSSProperties;
}

// Row component for react-window v2
const TransactionRowComponent = (props: RowProps & TransactionRowProps): ReactElement => {
    const { index, style, transactions, onEdit, onDelete } = props;
    const tx = transactions[index];
    const asset = getAssetDetail(tx.assetSymbol);
    const mutedText = 'text-[color:var(--text-muted)]';
    const cardSurface = 'bg-[var(--card-bg)] border border-[color:var(--border-color)] text-[color:var(--text-primary)]';

    const handleEdit = useCallback(() => onEdit(tx), [tx, onEdit]);
    const handleDelete = useCallback(() => onDelete(tx.id), [tx.id, onDelete]);

    // Apply padding to the style for spacing between items
    const rowStyle: CSSProperties = {
        ...style,
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingBottom: '12px',
    };

    return (
        <div style={rowStyle} {...props.ariaAttributes}>
            <SwipeableRow onEdit={handleEdit} onDelete={handleDelete}>
                <div
                    onClick={handleEdit}
                    className={`${cardSurface} p-5 rounded-3xl flex justify-between items-center cursor-pointer hover:shadow-lg transition-shadow`}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-[10px]">
                            {tx.assetSymbol.slice(0, 4)}
                        </div>
                        <div>
                            <div className="font-black text-sm text-[color:var(--text-primary)]">
                                {asset.name}
                            </div>
                            <div className={`text-[10px] font-bold mt-1 ${mutedText}`} dir="ltr">
                                {new Date(tx.buyDateTime).toLocaleDateString('fa-IR')}
                            </div>
                        </div>
                    </div>
                    <div className="text-left font-black text-sm text-[color:var(--text-primary)]" dir="ltr">
                        {formatNumber(tx.quantity)}
                    </div>
                </div>
            </SwipeableRow>
        </div>
    );
};

const VirtualizedTransactionListComponent: React.FC<VirtualizedTransactionListProps> = ({
    transactions,
    onEdit,
    onDelete,
    height = 500,
    itemHeight = 92,
}) => {
    const rowProps: TransactionRowProps = {
        transactions,
        onEdit,
        onDelete,
    };

    const actualHeight = Math.min(height, transactions.length * itemHeight);

    if (transactions.length === 0) {
        return null;
    }

    return (
        <List
            rowComponent={TransactionRowComponent}
            rowCount={transactions.length}
            rowHeight={itemHeight}
            rowProps={rowProps}
            defaultHeight={actualHeight}
            className="no-scrollbar"
            overscanCount={3}
        />
    );
};

export const VirtualizedTransactionList = memo(VirtualizedTransactionListComponent);
