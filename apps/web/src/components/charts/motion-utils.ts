import type { Transition } from "motion/react";
import { DEFAULT_CHART_ENTER_TRANSITION } from "./animation";

export function transitionWithDelay(
	transition: Transition | undefined,
	delay: number,
): Transition {
	return {
		...(transition ?? DEFAULT_CHART_ENTER_TRANSITION),
		delay,
	};
}

export function springOptionsFromTransition(
	transition: Transition | undefined,
): { stiffness?: number; damping?: number } {
	if (transition?.type === "spring") {
		return {
			stiffness: transition.stiffness,
			damping: transition.damping,
		};
	}
	return {};
}