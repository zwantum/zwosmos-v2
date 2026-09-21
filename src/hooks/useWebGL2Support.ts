import { useEffect, useState } from "react";

function detectWebGL2(): boolean {
    if (typeof window === "undefined") return true;
    try {
        const canvas = document.createElement("canvas");
        const gl2 = canvas.getContext("webgl2");
        if (gl2) {
            return true;
        }
        return false;
    } catch {
        return false;
    }
}

// WebGL enabled check. For example Safari browser has WebGL1.0 enabled by default and we can't work with that
export function useWebGL2Enabled() {
    const [isWebGL2Enabled, setIsWebGL2Enabled] = useState<boolean | null>(() => detectWebGL2());

    useEffect(() => {
        setIsWebGL2Enabled(detectWebGL2());
    }, []);

    return isWebGL2Enabled;
}