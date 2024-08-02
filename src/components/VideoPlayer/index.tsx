// VideoPlayer.tsx
import React, { useState } from 'react';

interface VideoPlayerProps {
    src: string; // URL do vídeo ou caminho local
    type?: string; // Tipo do vídeo, por exemplo, "video/mp4"
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, type = 'video/mp4' }) => {

    const [isMuted, setIsMuted] = useState(true);

    const toggleMute = () => {
        setIsMuted(!isMuted);
    };



    return (
        <div onClick={toggleMute} className="video-wrapper  video-background"> {/* Container do vídeo */}
            <video className="video" loop autoPlay muted={isMuted}>
                <source src={src} type={type} />
            </video>

            <div className="content ">

                <section className="  h-screen max-h-[80vh]  lg:px-28 px-4   ">

                    <div className="grid grid-cols-3  ">
                        <div className="home">
                            <div className="grid  place-content-start pt-36 2xl:pt-80   ">
                                <h2 className="text-8xl font-black uppercase font-bebas text-white"> Descubra </h2>
                                <h1 className="text-7xl whitespace-nowrap  uppercase font-montserrat tracking-tighter font-extralight">Tábuas de Frios </h1>
                                <h2 className="text-8xl font-black uppercase font-bebas text-white ">Únicas</h2>
                                <p className="text-4xl mt-10 font-montserrat">
                                    de maneira rápida, fácil e sem complicações.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 lg:w-6/12 w-full pt-20 gap-3 ">
                                <button className="bg-secondary text-white rounded-3xl py-5 text-3xl min-w-[300px]  hover:bg-[#a37d75] duration-300 hover:translate-x-3">
                                    Sou Hospedagem
                                </button>

                                <button className="bg-secondary text-white rounded-3xl py-5 text-3xl min-w-[300px] hover:bg-[#a37d75] duration-300 hover:translate-x-3" >
                                    Sou Hóspede
                                </button>
                            </div>
                        </div>
                    </div>

                    <button onClick={toggleMute} className="toggle-sound">
                        {isMuted ? 'Ativar Som' : 'Desativar Som'}
                    </button>
                </section>
                {/* Aqui você pode adicionar conteúdo que ficará sobre o vídeo */}
            </div>
        </div>
    );
};

export default VideoPlayer;
