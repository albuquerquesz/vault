const DEV_AUTH_BYPASS_KEY = "vault:dev-auth-bypass";

export function isDevAuthBypassEnabled() {
	if (!import.meta.env.DEV || typeof window === "undefined") {
		return false;
	}

	const requested = new URLSearchParams(window.location.search).get(
		"dev-auth-bypass",
	);
	if (requested === "1") {
		window.localStorage.setItem(DEV_AUTH_BYPASS_KEY, "1");
		return true;
	}
	if (requested === "0") {
		window.localStorage.removeItem(DEV_AUTH_BYPASS_KEY);
		return false;
	}

	return window.localStorage.getItem(DEV_AUTH_BYPASS_KEY) === "1";
}
