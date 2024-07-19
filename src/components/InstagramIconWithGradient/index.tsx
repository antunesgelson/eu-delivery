import { FaInstagram } from 'react-icons/fa';

type Props = {
    size: number
}
const InstagramIconWithGradient = ({ size }: Props) => (
    <svg className='rounded-xl' width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#f58529', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#dd2a7b', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#8134af', stopOpacity: 1 }} />
            </linearGradient>
            <mask id="mask1">
                <rect width="100%" height="100%" fill="white" />
                <g fill="black">
                    <FaInstagram size={size} />
                </g>
            </mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad1)" mask="url(#mask1)" />
    </svg>
);

export default InstagramIconWithGradient;
