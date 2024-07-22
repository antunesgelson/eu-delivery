import { Separator } from "@/components/ui/separator";
import { FaWhatsapp } from "react-icons/fa";
import { FaPhone } from "react-icons/fa6";

import InstagramIconWithGradient from '@/components/InstagramIconWithGradient';
import { FaSquareFacebook } from "react-icons/fa6";

const payments = [
    { name: "Pix", Icon: "pix_icon.svg" },
    { name: "Cartão de Crédito", icon: "credit_card_icon.svg" },
    { name: "Dinheiro", icon: "cash_icon.svg" },
    { name: "MasterCard", icon: "mastercard_icon.svg" },
    { name: "Visa", icon: "visa_icon.svg" },
    { name: "Boleto", icon: "boleto_icon.svg" },
    { name: "PayPal", icon: "paypal_icon.svg" },
    { name: "Bitcoin", icon: "bitcoin_icon.svg" },
    { name: "Ethereum", icon: "ethereum_icon.svg" },
    { name: "Transferência Bancária", icon: "bank_transfer_icon.svg" },
    { name: "Google Pay", icon: "google_pay_icon.svg" },
    { name: "Apple Pay", icon: "apple_pay_icon.svg" },
    { name: "Samsung Pay", icon: "samsung_pay_icon.svg" },
    { name: "American Express", icon: "american_express_icon.svg" },
    { name: "Diners Club", icon: "diners_club_icon.svg" },
    { name: "Elo", icon: "elo_icon.svg" }
];

const SIZE_ICON = 45
export default function Footer() {
    return (
        <footer >
            <div className="bg-white mt-10 p-4">
                <div className="text-center">
                    <h4 className="font-bold text-2xl">Pagamento</h4>
                    <span className="text-sm">Confira as formas de pagamento que aceitamos:</span>
                </div>
                <div className="grid grid-cols-2 mt-4  ">
                    {payments.map((payment) => (
                        <div key={payment.name} className="flex justify-start items-center gap-2">
                            <img src={`/assets/payments/${payment.icon}`} alt={payment.name} className="w-10 h-10 " />
                            <span className="text-sm">{payment.name}</span>
                        </div>
                    ))}
                </div>

                <Separator className="w-full my-5" />

                <div className="text-center flex flex-col">
                    <h4 className="font-bold text-2xl">Contato</h4>
                    <span className="text-sm">Está com alguma dúvida ou precisa de ajuda?</span>

                    <div className="mx-auto">
                        <button className="grid grid-cols-8 bg-[#00c669] rounded-lg text-white p-2 mt-2 lg:min-h-14 ">
                            <div className="flex justify-center items-center w-full h-full">
                                <FaWhatsapp size={40} />
                            </div>
                            <div className="col-span-6">
                                <span className="uppercase "> clique aqui para chamar a gente no <strong>whatsapp</strong></span>
                            </div>
                        </button>

                        <button className="grid grid-cols-8 bg-muted rounded-lg text-white p-2 mt-2 lg:min-h-14 w-full">
                            <div className="flex justify-center items-center w-full h-full">
                                <FaPhone size={30} />
                            </div>
                            <div className="col-span-6">
                                <span className="uppercase "> ou se preferir, nos ligue: <strong>(48)99175-8185</strong></span>
                            </div>
                        </button>
                    </div>
                </div>

                <Separator className="w-full my-5" />

                <div className="text-center">
                    <h4 className="font-bold text-2xl">Nossas Redes Sociais</h4>
                    <span className="text-sm">Fique por dentro de nossas novidades e promoções.</span>

                    <div className="flex justify-center items-center gap-2 mt-2">
                        <InstagramIconWithGradient size={SIZE_ICON} />
                        <FaSquareFacebook className="text-blue-700" size={SIZE_ICON} />
                    </div>
                </div>

            </div>

            <div className=" flex justify-center  items-center h-14">
                <span className="text-muted text-sm ">@2024 Empório Urubici - Urubici</span>
            </div>
        </footer>
    )
}