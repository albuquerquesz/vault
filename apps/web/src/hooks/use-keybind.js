import { useEffect } from "react";
function isEditableTarget(target) {
    if (!(target instanceof HTMLElement))
        return false;
    if (target.isContentEditable)
        return true;
    const tagName = target.tagName.toLowerCase();
    return tagName === "input" || tagName === "textarea" || tagName === "select";
}
export function useKeybind({ key, onTrigger, enabled = true, preventDefault = true, ignoreEditableTargets = true, }) {
    useEffect(() => {
        if (!enabled)
            return;
        const handleKeyDown = (event) => {
            if (event.repeat)
                return;
            if (event.ctrlKey || event.metaKey || event.altKey)
                return;
            if (ignoreEditableTargets && isEditableTarget(event.target))
                return;
            if (event.key.toLowerCase() !== key.toLowerCase())
                return;
            if (preventDefault) {
                event.preventDefault();
            }
            onTrigger(event);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [enabled, ignoreEditableTargets, key, onTrigger, preventDefault]);
}
