'use client'
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";
import { motion } from "framer-motion";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";

export default function GetCode() {
    return (
        <motion.div
            className="mt-14"
            initial={{ opacity: 0, x: 100, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}>

            <div className='p-4 leading-3 text-center '>
                <h1 className="uppercase text-2xl font-bold ">código de acesso </h1>
                <span className='text-[12px]'>Digite o código que enviamos para o seu número.</span>

                <div className=" flex justify-center my-3">
                    <InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS_AND_CHARS}>
                        <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                        </InputOTPGroup>
                    </InputOTP>
                </div>


                <span className='text-[11px] text-muted'>Você poderá solicitar um novo código em 0 segundos</span>
            </div>

        </motion.div>
    )
}