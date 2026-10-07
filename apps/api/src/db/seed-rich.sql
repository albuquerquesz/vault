-- Local development dataset. Replaces only the dedicated demo user.
BEGIN;

DELETE FROM "user" WHERE id = 'user_seed_rich';

INSERT INTO "user" (id, name, email, email_verified, image, settings)
VALUES (
	'user_seed_rich',
	'Camila Demo',
	'camila@vault.local',
	true,
	'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop&crop=faces',
	'{"theme":"light","monthlyIncome":980000,"incomeDay":5,"dailySummaryEnabled":true}'::jsonb
);

INSERT INTO "account" (id, account_id, provider_id, user_id, scope)
VALUES ('account_seed_rich', 'vault-demo', 'credential', 'user_seed_rich', '');

INSERT INTO "session" (id, token, user_id, expires_at, ip_address, user_agent)
VALUES (
	'session_seed_rich',
	'seed-session-token-rich-vault',
	'user_seed_rich',
	now() + interval '1 year',
	'127.0.0.1',
	'Vault rich local seed'
);

INSERT INTO "goal" (user_id, name, target_amount, current_amount, currency)
VALUES
	('user_seed_rich', 'Reserva de emergência', 30000, 18750, 'BRL'),
	('user_seed_rich', 'Viagem para o Chile', 12000, 4200, 'BRL'),
	('user_seed_rich', 'Notebook novo', 9500, 7100, 'BRL'),
	('user_seed_rich', 'Entrada do apartamento', 80000, 22600, 'BRL');

DO $$
DECLARE
	v_month_offset integer;
	v_entry integer;
	v_month_start date;
	v_month text;
	v_user_id constant text := 'user_seed_rich';
	v_income numeric(12, 2);
	v_expense_amount numeric(12, 2);
	v_bill_id uuid;
	v_categories text[] := ARRAY[
		'Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Lazer',
		'Casa', 'Educação', 'Pets', 'Compras', 'Serviços'
	];
	v_merchants text[] := ARRAY[
		'Mercado do Bairro', 'Padaria Central', 'Uber', 'Farmácia Popular',
		'Cinema', 'Loja de Casa', 'Curso online', 'Pet Shop', 'Livraria',
		'Plano de celular'
	];
BEGIN
	-- Two full years of cash flow, including income for the annual balance chart.
	FOR v_month_offset IN REVERSE 23..0 LOOP
		v_month_start := (date_trunc('month', current_date)::date - make_interval(months => v_month_offset))::date;
		v_month := to_char(v_month_start, 'YYYY-MM');
		v_income := 7800 + (v_month_offset % 5) * 550;

		INSERT INTO "monthly_budget" (user_id, month, income)
		VALUES (v_user_id, v_month, v_income);

		INSERT INTO "monthly_spending_goal" (user_id, month, target_amount)
		VALUES (v_user_id, v_month, 6500 + (v_month_offset % 4) * 500);

		INSERT INTO "expense" (user_id, expense_date, amount, kind, category, note, source)
		VALUES (
			v_user_id,
			LEAST(v_month_start + 4, current_date),
			v_income,
			'income',
			'Salário',
			'Salário mensal',
			'cash'
		);

		IF v_month_offset % 3 = 0 THEN
			INSERT INTO "expense" (user_id, expense_date, amount, kind, category, note, source)
			VALUES (
				v_user_id,
				LEAST(v_month_start + 18, current_date),
				1800 + (v_month_offset % 4) * 250,
				'income',
				'Freelance',
				'Projeto independente',
				'cash'
			);
		END IF;

		-- Fixed monthly costs.
		INSERT INTO "expense" (user_id, expense_date, amount, kind, category, note, source)
		VALUES
			(v_user_id, LEAST(v_month_start + 4, current_date), 2450, 'expense', 'Moradia', 'Aluguel', 'cash'),
			(v_user_id, LEAST(v_month_start + 5, current_date), 590, 'expense', 'Moradia', 'Condomínio', 'cash'),
			(v_user_id, LEAST(v_month_start + 11, current_date), 119.90, 'expense', 'Serviços', 'Internet residencial', 'cash'),
			(v_user_id, LEAST(v_month_start + 19, current_date), 85, 'expense', 'Serviços', 'Plano de celular', 'cash'),
			(v_user_id, LEAST(v_month_start + 22, current_date), 170 + (v_month_offset % 5) * 22, 'expense', 'Casa', 'Conta de energia', 'cash');

		-- Daily purchases spread across the month for charts and transaction lists.
		FOR v_entry IN 1..28 LOOP
			v_expense_amount := 18 + ((v_month_offset * 137 + v_entry * 83) % 18000)::numeric / 100;
			INSERT INTO "expense" (user_id, expense_date, amount, kind, category, note, source)
			VALUES (
				v_user_id,
				LEAST(v_month_start + (1 + ((v_entry * 7 + v_month_offset * 3) % 27)), current_date),
				v_expense_amount,
				'expense',
				v_categories[1 + ((v_entry + v_month_offset) % array_length(v_categories, 1))],
				v_merchants[1 + ((v_entry + v_month_offset) % array_length(v_merchants, 1))],
				'cash'
			);
		END LOOP;

		-- Occasional annual costs create realistic negative months too.
		IF v_month_offset % 6 = 0 THEN
			INSERT INTO "expense" (user_id, expense_date, amount, kind, category, note, source)
			VALUES (v_user_id, LEAST(v_month_start + 14, current_date), 4300, 'expense', 'Impostos', 'IPTU e taxas anuais', 'cash');
		END IF;

		INSERT INTO "monthly_bill" (user_id, month, total_bill)
		VALUES (v_user_id, v_month, 479.70)
		RETURNING id INTO v_bill_id;

		INSERT INTO "monthly_bill_item" (monthly_bill_id, name, paid_amount, total_amount, sort_order)
		VALUES
			(v_bill_id, 'Mercado e refeições', 218.40, 230, 1),
			(v_bill_id, 'Streaming', 79.90, 79.90, 2),
			(v_bill_id, 'Armazenamento em nuvem', 39.90, 39.90, 3),
			(v_bill_id, 'Transporte por aplicativo', 141.50, 160, 4);
	END LOOP;
END $$;

COMMIT;

SELECT
	'Camila Demo' AS seeded_user,
	count(*) FILTER (WHERE kind = 'expense') AS expenses,
	count(*) FILTER (WHERE kind = 'income') AS income_entries,
	min(expense_date) AS first_date,
	max(expense_date) AS last_date
FROM "expense"
WHERE user_id = 'user_seed_rich';
