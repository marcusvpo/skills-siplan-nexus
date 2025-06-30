
-- Primeiro, vamos verificar o estado atual da tabela video_aulas
SELECT 
    id,
    titulo,
    url_video,
    id_video_bunny,
    CASE 
        WHEN id_video_bunny IS NULL OR id_video_bunny = '' THEN 'VAZIO'
        ELSE 'PREENCHIDO'
    END as status_bunny_id
FROM video_aulas
ORDER BY titulo;

-- Também vamos verificar se existe algum padrão na url_video que possa nos ajudar a extrair o bunny_video_id
SELECT 
    id,
    titulo,
    url_video,
    id_video_bunny,
    -- Tentar extrair GUID da URL se estiver no formato da Bunny.net
    CASE 
        WHEN url_video LIKE '%bunnycdn.com%' OR url_video LIKE '%b-cdn.net%' THEN 
            SUBSTRING(url_video FROM '([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})')
        ELSE NULL
    END as possible_guid_from_url
FROM video_aulas
WHERE id_video_bunny IS NULL OR id_video_bunny = ''
ORDER BY titulo;
