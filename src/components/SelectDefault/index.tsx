'use client'
import { AnimatePresence, motion } from "framer-motion";

import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { SelectContent, SelectGroup, SelectItem, Select as SelectRoot, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FaCircleQuestion } from "react-icons/fa6";
import { Tooltip } from "react-tooltip";

export type Options = {
    id: number | string
    nome: string;
}


type Props = {
    placeholder?: string;
    label?: string;
    options: Options[];
    open?: boolean;
    onOpen?: (open: boolean) => void;
    error?: string
    name: string
    form: any;
    title?: string;
    questionContent?: string;
}


const Select = ({ placeholder, label, options, form, error, name, title, questionContent }: Props) => {

    return (
        <div className="relative">
            {label &&
                <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted py-1">
                        {label}
                    </Label>

                    {questionContent &&
                        <>
                            <FaCircleQuestion
                                className="text-muted hover:text-white cursor-pointer"
                                data-tooltip-id={`${label}-tooltip`}
                                data-tooltip-content={questionContent}
                                size={14}
                            />
                            <Tooltip id={`${label}-tooltip`} />
                        </>
                    }
                </div>
            }
            <Form {...form}>
                <Label>{title}</Label>
                <FormField
                    control={form.control}
                    name={name}
                    render={({ field }) => (
                        <FormItem>
                            <SelectRoot onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger className={`w-full  capitalize duration-300  ${error ? 'border-red-500' : 'border-gray-700'}`}>
                                        <SelectValue placeholder={placeholder} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectGroup >
                                        {/* <SelectLabel >{label}</SelectLabel> */}
                                        {options.map((option) => (
                                            <SelectItem
                                                key={option.id}
                                                className="capitalize"
                                                value={String(option.id).toLowerCase()}>
                                                {option.nome}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </SelectRoot>
                        </FormItem>
                    )}
                />
            </Form>

            {/* error message */}
            <AnimatePresence>
                {error && (
                    <motion.p
                        className="text-[0.7rem] text-red-500 ml-2 line-clamp-1"
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
    )
}
export default Select;



