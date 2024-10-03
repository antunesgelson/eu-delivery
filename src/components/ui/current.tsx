import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';
import CurrencyInput from 'react-currency-input-field';
import { Controller, useFormContext } from 'react-hook-form';
import { FaCircleQuestion } from 'react-icons/fa6';
import { Tooltip } from 'react-tooltip';
import { Label } from './label';

type CurrencyInputProps = {
    name: string;
    label: string;
    error?: string;
    questionContent?: string;
    className?: string;
};

const CurrencyField: React.FC<CurrencyInputProps> = ({ name, label, error, questionContent, className }) => {
    const { control } = useFormContext();

    return (
        <div className="relative">
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
                    <CurrencyInput
                        id={name}
                        className={cn(
                            `flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-sm transition-colors dark:file:text-muted file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted focus-visible:outline-none focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted ${error ? 'border-red-500' : 'border-input'}
                            dark:border-dark-700 dark:bg-dark-800 dark:text-white
                            `,
                            className
                        )}
                        intlConfig={{ locale: 'pt-BR', currency: 'BRL' }}
                        prefix="R$ "
                        decimalSeparator=","
                        groupSeparator="."
                        allowNegativeValue={false}
                        placeholder="R$ 0,00"
                        value={field.value}
                        onValueChange={(value) => {
                            field.onChange(value);
                        }}
                        decimalsLimit={2}
                        transformRawValue={(rawValue) => {
                            // Remove todos os caracteres não numéricos
                            const numericValue = rawValue.replace(/\D/g, '');
                            if (numericValue.length === 0) return '';
                            // Converte para número e divide por 100 para considerar centavos
                            const numberValue = parseFloat(numericValue) / 100;
                            // Formata o valor com duas casas decimais
                            return numberValue.toFixed(2).replace('.', ',');
                        }}
                    />
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

export default CurrencyField;
