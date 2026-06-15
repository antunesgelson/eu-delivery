'use client'
import useCart from "@/hook/useCart";
import { useEffect, useState } from "react";

import InstagramIconWithGradient from '@/components/InstagramIconWithGradient';
import { Separator } from "@/components/ui/separator";

import { FaWhatsapp } from "react-icons/fa";
import { FaPhone, FaSquareFacebook } from "react-icons/fa6";
import { HiCreditCard } from "react-icons/hi2";
import { LiaCcMastercard } from "react-icons/lia";
import { MdOutlinePix } from "react-icons/md";
import { RiMoneyDollarCircleFill, RiVisaFill } from "react-icons/ri";
import { SiMercadopago } from "react-icons/si";

const PAYMENTS = [
    { name: "Pix", Icon: MdOutlinePix },
    { name: "Cartão de Crédito", Icon: HiCreditCard },
    { name: "Dinheiro", Icon: RiMoneyDollarCircleFill },
    { name: "MasterCard", Icon: LiaCcMastercard },
    { name: "Visa", Icon: RiVisaFill },
    { name: "MercadoPago", Icon: SiMercadopago },
];

const SIZE_ICON = 35
export default function Footer() {
    const { configData } = useCart()
    const [redesSociais, setRedesSociais] = useState({ facebook: '', instagram: '' });
    const [tel, setTel] = useState('');
    const [cleanedTel, setCleanedTel] = useState('');
    const whatsappLink = `https://wa.me/+55${cleanedTel}`;
    const callLink = `tel:+55${cleanedTel}`;

    useEffect(() => {
        if (configData) {
            const telField = configData.find((item: any) => item.chave.toUpperCase() === 'TELEFONE')?.valor ?? '';
            const cleanedTel = telField?.replace(/\D/g, '');
            setTel(telField);
            setCleanedTel(cleanedTel);

            const redesSociaisData = configData.find((item: any) => item.chave.toUpperCase() === 'REDESSOCIAIS')?.valor;

            if (redesSociaisData) {
                const { facebook, instagram } = JSON.parse(redesSociaisData);
                setRedesSociais({ facebook, instagram });

            }
        }
    }, [configData]);
    return (
        <footer className="bg-white mt-10 p-4 " >
            <div className=" lg:w-6/12 mx-auto">
                <div className="text-center">
                    <h4 className="font-bold text-xl">Pagamento</h4>
                    <span className="text-xs text-muted-foreground">Confira as formas de pagamento que aceitamos:</span>
                </div>
                <div className="grid grid-cols-2 mt-4  ">
                    {PAYMENTS.map((payment) => {
                        const Icon = payment.Icon;
                        return (
                            <div key={payment.name} className="flex justify-start items-center gap-2">
                                <Icon className="w-8 h-8" />
                                <span className="text-sm">{payment.name}</span>
                            </div>
                        )
                    })}
                </div>

                <Separator className="w-full my-5" />

                <div className="text-center flex flex-col">
                    <h4 className="font-bold text-xl">Contato</h4>
                    <span className="text-xs text-muted-foreground">Está com alguma dúvida ou precisa de ajuda?</span>

                    <div className="mx-auto text-sm">

                        <a href={whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="grid grid-cols-8 bg-[#00c669] rounded-lg text-white p-2 mt-2 lg:min-h-14 ">
                            <div className="flex justify-center items-center w-full h-full">
                                <FaWhatsapp size={40} />
                            </div>
                            <div className="col-span-6">
                                <span className="uppercase "> clique aqui para chamar a gente no <strong>whatsapp</strong></span>
                            </div>
                        </a>

                        <a href={callLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="grid grid-cols-8 bg-muted rounded-lg text-white p-2 mt-2 lg:min-h-14 w-full">
                            <div className="flex justify-center items-center w-full h-full">
                                <FaPhone size={30} />
                            </div>
                            <div className="col-span-6">
                                <span className="uppercase "> ou se preferir, nos ligue: <strong>{tel}</strong></span>
                            </div>
                        </a>
                    </div>
                </div>

                <Separator className="w-full my-5" />

                <div className="text-center w-full leading-3">
                    <h4 className="font-bold text-xl">Nossas Redes Sociais</h4>
                    <span className="text-xs text-muted-foreground">Fique por dentro de nossas novidades e promoções.</span>

                    <div className="flex justify-center items-center gap-2 mt-2">
                        {redesSociais.instagram &&
                            <a href={`https://www.instagram.com/${redesSociais.instagram}/`} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                                <InstagramIconWithGradient size={SIZE_ICON} />
                            </a>
                        }
                        {redesSociais.facebook &&
                            <a href={`https://www.facebook.com/${redesSociais.facebook}/`} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                                <FaSquareFacebook className="text-blue-700" size={SIZE_ICON} />
                            </a>
                        }
                    </div>
                </div>
            </div>

            <div className=" flex justify-center  items-center h-14 mb-14 lg:mb-0  ">
                <span className="text-muted text-sm ">@2024 Empório Urubici - Urubici</span>
            </div>
        </footer>
    )
}
