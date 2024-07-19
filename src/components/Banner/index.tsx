'use client'

import Thumb from '@/assets/products/banner.jpg';
import Image from 'next/image';
import 'swiper/css';
import 'swiper/css/autoplay';
import { Autoplay } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';


export default function Banner() {
    const BannerSlide = [Thumb, Thumb, Thumb]

    return (
        <div className='w-full my-5  '>
            <Swiper
                modules={[Autoplay]}
                spaceBetween={33}
                slidesPerView={1}
                speed={1500}
                autoplay={{
                    delay: 5000,
                    disableOnInteraction: false,
                }}>

                {BannerSlide.map((img, index) => {
                    return (
                        <SwiperSlide key={index}>
                            <div className="w-full flex justify-center items-center ">
                                <Image 
                                src={img.src} 
                                className="w-11/12 mx-auto rounded-xl max-h-[180px]" 
                                width={500}
                                height={500}
                                alt="" 
                                
                                />
                            </div>
                        </SwiperSlide>

                    )
                })}
            </Swiper>
        </div>
    );
};

