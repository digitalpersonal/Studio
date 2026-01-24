-- SQL Update: Adiciona a coluna opcional para a data de início do ciclo de corrida.
-- Este comando verifica se a coluna já existe antes de tentar adicioná-la,
-- garantindo que possa ser executado com segurança múltiplas vezes.

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='classes' AND column_name='cycle_start_date') THEN
        ALTER TABLE classes ADD COLUMN cycle_start_date DATE;
    END IF;
END $$;
