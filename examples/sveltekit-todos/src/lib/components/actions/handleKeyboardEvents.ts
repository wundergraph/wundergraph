export function handleEnterOrEscKey(node: HTMLElement) {
    function handleKeyUp(event: KeyboardEvent) {        
        if(event.key === 'Escape') {
            node.dispatchEvent(new CustomEvent("escapeKey"));
        }
        else if(event.key === "Enter") {
            node.dispatchEvent(new CustomEvent("enterKey"));
        }
    }
    node.addEventListener("keyup", handleKeyUp, true)
    return {
        destroy() {
            node.removeEventListener("keyup", handleKeyUp, true)
        }
    }
}

export function clickOutside(node: HTMLElement) {
    function handleClick(event: MouseEvent) {             
        if (node && event && event.target && !node.contains(event.target as any)) {
			node.dispatchEvent(new CustomEvent("outclick"));
		}
    }
    document.addEventListener("click", handleClick, true);
    return {
        destroy() {
            document.removeEventListener("click", handleClick, true);
        }
    }
}