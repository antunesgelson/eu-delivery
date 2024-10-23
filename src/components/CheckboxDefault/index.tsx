import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { AnimatePresence, motion } from "framer-motion";
import { FaCircleQuestion } from "react-icons/fa6";
import { Tooltip } from "react-tooltip";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";

type Props = {
    label: string;
    questionContent?: string;
    name: string;
    form: any;
    error?: string;
};

export default function CheckboxDefault({ label, questionContent, name, form, error }: Props) {
    return (
        <div className="relative flex flex-col items-center">
            <div className="flex items-center gap-2 -mb-2">
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
            <Form {...form}>
                <FormField
                    control={form.control}
                    name={name}
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    className={`duration-300 mt-3 ${error ? 'border-red-500' : 'border-gray-700'}`}
                                />
                            </FormControl>
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
    );
}