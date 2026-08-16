const brlCurrencyFmt = new Intl.NumberFormat("pt-BR", {
	style: "currency",
	currency: "BRL",
});

export function formatMonthlySpendingGoal(value: number) {
	return brlCurrencyFmt.format(value);
}

export function maskMonthlySpendingGoalInput(raw: string) {
	const digits = raw.replace(/\D/g, "");
	if (!digits) return "";

	return brlCurrencyFmt.format(Number.parseInt(digits, 10) / 100);
}

export function parseMonthlySpendingGoalInput(value: string) {
	const digits = value.replace(/\D/g, "");
	if (!digits) return Number.NaN;

	return Number.parseInt(digits, 10) / 100;
}

export function formatSpendingGoalMonth(month: string) {
	const [year, monthNumber] = month.split("-").map(Number);
	const label = new Date(year, monthNumber - 1, 1).toLocaleDateString("pt-BR", {
		month: "long",
		year: "numeric",
	});

	return label.charAt(0).toUpperCase() + label.slice(1);
}

export function getSpendingGoalMonthOptions(count = 6) {
	const now = new Date();
	const options: Array<{ value: string; label: string }> = [];

	for (let index = 0; index < count; index += 1) {
		const monthDate = new Date(now.getFullYear(), now.getMonth() - index, 1);
		const value = `${monthDate.getFullYear()}-${String(
			monthDate.getMonth() + 1,
		).padStart(2, "0")}`;

		options.push({
			value,
			label: formatSpendingGoalMonth(value),
		});
	}

	return options;
}
