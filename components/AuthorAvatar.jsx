'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function AuthorAvatar({ src, name, className }) {
    const [imgSrc, setImgSrc] = useState(src);

    return (
        <img
            src={imgSrc}
            alt={name}
            className={className}
            onError={() => {
                setImgSrc(`https://ui-avatars.com/api/?name=${name.replace(' ', '+')}&background=random`);
            }}
        />
    );
}
