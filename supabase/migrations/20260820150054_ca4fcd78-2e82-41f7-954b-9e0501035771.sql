DO $$
DECLARE v_id uuid := gen_random_uuid();
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'comercial@siplan.com.br') THEN
    SELECT id INTO v_id FROM auth.users WHERE email = 'comercial@siplan.com.br';
    UPDATE auth.users
       SET encrypted_password = crypt('Siplan@2026', gen_salt('bf')),
           email_confirmed_at = COALESCE(email_confirmed_at, now()),
           updated_at = now()
     WHERE id = v_id;
  ELSE
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) VALUES (
      v_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'comercial@siplan.com.br', crypt('Siplan@2026', gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      '{"username":"comercial"}'::jsonb, now(), now()
    );

    INSERT INTO auth.identities (
      id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_id, v_id::text, 'email',
      json_build_object('sub', v_id::text, 'email', 'comercial@siplan.com.br', 'email_verified', true)::jsonb,
      now(), now(), now()
    );
  END IF;

  INSERT INTO public.admins (id, email, nome)
  VALUES (v_id, 'comercial@siplan.com.br', 'Comercial')
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, nome = EXCLUDED.nome;
END $$;