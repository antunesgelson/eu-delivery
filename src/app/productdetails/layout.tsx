'use client'

import { Button } from "@/components/ui/button"
import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useState } from "react"
import { FaMinusCircle } from "react-icons/fa"
import { FaCirclePlus } from "react-icons/fa6"


type Props = {
    children: React.ReactNode
}

export default function LayoutProductDetails({ children }: Props) {
    const [countProduct, setCountProduct] = useState<number>(1);
    const [showMenu, setShowMenu] = useState<boolean>(true);
    const [lastScrollY, setLastScrollY] = useState<number>(0);

    
    const controlMenu = () => {
        if (typeof window !== 'undefined') {
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
                // If the user has reached the bottom of the page, show the menu
                setShowMenu(true);
            } else if (window.scrollY > lastScrollY) {
                // If the user is scrolling down, hide the menu
                setShowMenu(false);
            } else {
                // If the user is scrolling up, show the menu
                setShowMenu(true);
            }
            setLastScrollY(window.scrollY); // Remember current page location to use in the next move
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.addEventListener('scroll', controlMenu);

            // cleanup function
            return () => {
                window.removeEventListener('scroll', controlMenu);
            };
        }
    }, [lastScrollY]);

    return (
        <div className="relative">
            <div className="mb-20">
                {children}
            </div>

            <AnimatePresence>
                {showMenu &&
                    <motion.div
                        className='fixed bottom-0 left-0 right-0 bg-white p-2 flex justify-between items-center border'
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className='flex justify-center items-center w-32 '>
                            <button className='' onClick={() => setCountProduct(prevState => countProduct >= 2 ? prevState - 1 : prevState)}>
                                <FaMinusCircle size={30} />
                            </button>
                            <div className=' text-4xl font-bold -mt-1 w-12 flex justify-center items-center '>{countProduct}</div>
                            <button className=' ' onClick={() => setCountProduct(prevState => prevState + 1)}>
                                <FaCirclePlus size={30} />
                            </button>
                        </div>
                        <Button className='ml-3 w-full flex justify-between p-2 text-lg h-12' variant={'success'}>
                            <span className='ml-3'>Adicionar</span> <div className='bg-white text-primary p-1 rounded-lg text-base font-bold'> R$ 18.52</div>
                        </Button>
                    </motion.div>
                }

            </AnimatePresence>
        </div>
    )
}

