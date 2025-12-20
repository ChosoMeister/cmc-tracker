
import React, { memo, useRef, useState, useCallback } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Edit3, Trash2 } from 'lucide-react';

interface SwipeableRowProps {
    children: React.ReactNode;
    onEdit?: () => void;
    onDelete?: () => void;
    threshold?: number;
    className?: string;
}

const SwipeableRowComponent: React.FC<SwipeableRowProps> = ({
    children,
    onEdit,
    onDelete,
    threshold = 80,
    className = ''
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const constraintsRef = useRef<HTMLDivElement>(null);

    const x = useMotionValue(0);

    // Transform x position to opacity for action buttons
    const leftOpacity = useTransform(x, [0, threshold], [0, 1]);
    const rightOpacity = useTransform(x, [-threshold, 0], [1, 0]);

    // Scale for action buttons
    const leftScale = useTransform(x, [0, threshold / 2, threshold], [0.5, 0.8, 1]);
    const rightScale = useTransform(x, [-threshold, -threshold / 2, 0], [1, 0.8, 0.5]);

    const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        setIsDragging(false);

        if (info.offset.x > threshold && onEdit) {
            onEdit();
        } else if (info.offset.x < -threshold && onDelete) {
            onDelete();
        }
    }, [threshold, onEdit, onDelete]);

    const handleDragStart = useCallback(() => {
        setIsDragging(true);
    }, []);

    return (
        <div
            ref={constraintsRef}
            className={`relative overflow-hidden ${className}`}
        >
            {/* Left Action (Edit) - appears when swiping right */}
            {onEdit && (
                <motion.div
                    className="absolute inset-y-0 left-0 flex items-center justify-start pl-6 w-24"
                    style={{ opacity: leftOpacity }}
                >
                    <motion.div
                        className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg"
                        style={{ scale: leftScale }}
                    >
                        <Edit3 size={20} />
                    </motion.div>
                </motion.div>
            )}

            {/* Right Action (Delete) - appears when swiping left */}
            {onDelete && (
                <motion.div
                    className="absolute inset-y-0 right-0 flex items-center justify-end pr-6 w-24"
                    style={{ opacity: rightOpacity }}
                >
                    <motion.div
                        className="w-12 h-12 rounded-xl bg-rose-500 flex items-center justify-center text-white shadow-lg"
                        style={{ scale: rightScale }}
                    >
                        <Trash2 size={20} />
                    </motion.div>
                </motion.div>
            )}

            {/* Main Content */}
            <motion.div
                drag="x"
                dragConstraints={{ left: onDelete ? -120 : 0, right: onEdit ? 120 : 0 }}
                dragElastic={0.1}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                style={{ x }}
                className={`relative z-10 bg-[var(--card-bg)] ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                whileTap={{ cursor: 'grabbing' }}
            >
                {children}
            </motion.div>
        </div>
    );
};

export const SwipeableRow = memo(SwipeableRowComponent);
