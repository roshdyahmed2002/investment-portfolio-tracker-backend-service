insert into public.categories (name)
select v.name
from (values
    ('Stock'),
    ('Mutual Fund'),
    ('Metal')
) as v(name)
where not exists (
    select 1
    from public.categories c
    where c.user_id is null
      and c.name = v.name
);