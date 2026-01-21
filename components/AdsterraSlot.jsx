'use client';

import { useEffect, useRef } from 'react';

export default function AdsterraSlot({ type, format, className = "" }) {
    const adRef = useRef(null);

    useEffect(() => {
        if (!adRef.current) return;

        // Clear previous content to prevent duplicates on re-renders
        adRef.current.innerHTML = '';

        const container = adRef.current;

        if (type === 'native') {
            // Native Ad Implementation
            // Key: ba48dde2e283e2b6bd78a61a85539f51
            const script = document.createElement('script');
            script.async = true;
            script.dataset.cfasync = "false";
            script.src = "//pl28531362.effectivegatecpm.com/ba48dde2e283e2b6bd78a61a85539f51/invoke.js";

            const div = document.createElement('div');
            div.id = "container-ba48dde2e283e2b6bd78a61a85539f51";

            container.appendChild(script);
            container.appendChild(div);

        } else if (type === 'banner') {
            // Banner Implementation
            let key = '';
            let width = 300;
            let height = 250;

            if (format === '728x90') {
                key = '4e6404be26a67d1ba056eb274b9a7c9d';
                width = 728;
                height = 90;
            } else if (format === '300x250') {
                key = '40889d3ccfa2c289963750cdb850e897';
                width = 300;
                height = 250;
            } else if (format === '160x600') {
                key = '5094bc57c28455bcbff48946fd5aa581';
                width = 160;
                height = 600;
            }

            if (!key) return;

            // Create the configuration script
            const confScript = document.createElement('script');
            confScript.type = 'text/javascript';
            confScript.innerHTML = `
                atOptions = {
                    'key' : '${key}',
                    'format' : 'iframe',
                    'height' : ${height},
                    'width' : ${width},
                    'params' : {}
                };
            `;

            // Create the invoker script
            const invokeScript = document.createElement('script');
            invokeScript.type = 'text/javascript';
            invokeScript.src = `//www.highperformanceformat.com/${key}/invoke.js`;

            container.appendChild(confScript);
            container.appendChild(invokeScript);
        }

    }, [type, format]);

    return (
        <div className={`flex justify-center items-center my-6 overflow-hidden ${className}`}>
            <div ref={adRef} className={type === 'native' ? 'w-full' : ''}></div>
        </div>
    );
}
