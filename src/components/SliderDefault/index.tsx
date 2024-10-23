import { Label } from '@/components/ui/label';
import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { FaCircleQuestion } from 'react-icons/fa6';
import { Tooltip } from 'react-tooltip';
import { Slider } from "../ui/slider";

type CurrencyInputProps = {
    name: string;
    label: string;
    error?: string;
    questionContent?: string;
    className?: string;
};

const SliderDefault: React.FC<CurrencyInputProps> = ({ name, label, error, questionContent, className }) => {
    const { control } = useFormContext();

    return (
        <div className={`relative w-full ${className}`}>
            {label &&
                <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted py-1">
                        {label}
                    </Label>
                    <FaCircleQuestion
                        className="text-muted hover:text-white cursor-pointer"
                        data-tooltip-id={`${label}-tooltip`}
                        data-tooltip-content={questionContent}
                        size={14}
                    />
                    <Tooltip id={`${label}-tooltip`} />
                </div>
            }

            <Controller
                name={name}
                control={control}
                render={({ field }) => (
                    <div className="w-full">
                        <div className="flex justify-between items-center w-full">
                            <Label className="text-[10px] text-muted py-1">
                                Defina a porcentagem
                            </Label>
                            <span className="text-xs">{field.value}%</span>
                        </div>
                        <Slider
                            className='w-full'
                            value={[field.value]}
                            max={100}
                            step={1}
                            onValueChange={(value) => field.onChange(value[0])}
                        />
                    </div>
                )}
            />
            <AnimatePresence>
                {error && (
                    <motion.p
                        className="text-[0.7rem] text-red-500 ml-2 line-clamp-1 "
                        initial={{ opacity: 0 }}
                        animate={{
                            opacity: [1, 0.5, 1, 0.5, 1],
                            x: [0, -10, 10, -10, 0],
                        }}
                        transition={{
                            duration: 0.8,
                            ease: "easeInOut",
                            times: [0, 0.2, 0.5, 0.8, 1],
                            loop: Infinity,
                            repeatDelay: 33,
                        }}
                        exit={{ opacity: 0, y: 10 }}>
                        {error}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SliderDefault;