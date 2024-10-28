
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FaChevronRight } from "react-icons/fa";
import { FaCircleQuestion, FaLocationDot, FaMotorcycle, FaPiggyBank } from "react-icons/fa6";

export default function PromoSection() {
    return (
        <div className="w-11/12 lg:w-6/12 mx-auto my-2 space-y-2  ">
            <Link href={"/cashback"} className=" border-dashed border-[2px]  border-muted rounded-lg bg-white p-2 flex justify-between items-center">
                <div>
                    <FaPiggyBank size={27} />
                </div>
                <div className=" w-full ml-3">
                    <h3 className="font-semibold text-sm">Programa de Cashback:</h3>
                    <p className="text-[12px] text-muted-foreground">Receba <strong>10%</strong> de volta em suas compras!</p>
                </div>
                <div>
                    <FaCircleQuestion className="text-red-600" />
                </div>
            </Link>

            <Button variant={'success'} className="w-full justify-between">
                <FaMotorcycle size={23} />
                <div className="w-full flex justify-start ml-3">
                    <strong className="mr-1">Entrega </strong> |  a partir de 0 min
                </div>
                <FaChevronRight />
            </Button>

            <Button variant={'destructive'} className="w-full justify-between">
                <FaLocationDot size={15} />
                <div className="w-full flex justify-start ml-3">
                    Escolha o endereço
                </div>
                <FaChevronRight />
            </Button>
        </div>

    )
}