import { Label } from '@/components/ui/label';
import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { FaCircleQuestion } from 'react-icons/fa6';
import { Tooltip } from 'react-tooltip';

type ImageUploadFieldProps = {
    name: string;
    label: string;
    error?: string;
    questionContent?: string;
};

const ImageUploadField: React.FC<ImageUploadFieldProps> = ({ name, label, error, questionContent }) => {
    const { control } = useFormContext();
    return (
        <div>
            <Label className="text-xs text-muted flex items-center gap-2">
                {label}
                {questionContent && (
                    <>
                        <FaCircleQuestion
                            className="text-muted hover:text-white cursor-pointer"
                            data-tooltip-id={`${name}-tooltip`}
                            data-tooltip-content={questionContent}
                        />
                        <Tooltip id={`${name}-tooltip`} />
                    </>
                )}
            </Label>
            <Controller
                name={name}
                control={control}
                defaultValue={[]}
                render={({ field }) => (
                    <input
                        className='p-2 duration-300 dark:file:text-black file:rounded-md file:px-2 file:cursor-pointer file:hover:bg-white file:hover:underline underline-offset-2 rounded-md file:border-0 file:bg-white-off file:text-sm file:font-medium placeholder:text-muted focus-visible:outline-none focus-visible:ring-ring  dark:border-dark-700 dark:bg-dark-800 dark:text-white'
                        type="file"
                        multiple // Permite múltiplos arquivos
                        onChange={(e) => {
                            if (e.target.files) {
                                const files = Array.from(e.target.files)
                                field.onChange(files);
                            }
                        }}
                        ref={field.ref}
                    />
                )}
            />
            <AnimatePresence>
                {error && (
                    <motion.p
                        className="text-[0.7rem] text-red-500 ml-2 line-clamp-1 "
                        initial={{ opacity: 0, }}
                        animate={{
                            opacity: [1, 0.5, 1, 0.5, 1],
                            x: [0, -10, 10, -10, 0],
                        }}
                        transition={{
                            duration: 0.8,
                            ease: "easeInOut",
                            times: [0, 0.2, 0.5, 0.8, 1],
                            loop: Infinity,
                            repeatDelay: 33
                        }}
                        exit={{ opacity: 0, y: 10 }}>
                        {error}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ImageUploadField;
