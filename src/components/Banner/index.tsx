'use client'

import Thumb from '@/assets/products/banner.jpg';
import Image from 'next/image';
import 'swiper/css';
import 'swiper/css/autoplay';
import 'swiper/css/pagination';
import { Autoplay, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';


export default function Banner() {
    const BannerSlide = [Thumb, Thumb, Thumb]

    return (
        <div className='w-full py-3 lg:w-6/12 mx-auto bg-white'>
            <Swiper className='w-full h-[112px]'
                modules={[Autoplay, Pagination]}
                spaceBetween={16}
                slidesPerView={1}
                speed={1500}
                autoplay={{
                    delay: 5000,
                    disableOnInteraction: false,
                }}
                pagination={true}>

                {BannerSlide.map((img, index) => {
                    return (
                        <SwiperSlide key={index}>
                            <div className="w-full flex justify-center items-center px-4">
                                <Image
                                    src={img.src}
                                    className="h-[96px] w-full rounded-md object-cover"
                                    width={500}
                                    height={112}
                                    alt="Promoção Assados Zanini"

                                />
                            </div>
                        </SwiperSlide>

                    )
                })}
            </Swiper>
        </div>
    );
};
