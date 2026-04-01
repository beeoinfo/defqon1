verrouiller aussi l’exécution du owner ?


Je voulais dire “verrouiller les permissions de la fonction”, pas “bloquer son owner”.

Cette ligne :

revoke all on function public.get_auth_email_for_username(text) from public;
sert à retirer l’accès par défaut accordé au rôle spécial public en Postgres. Ensuite tu réouvres explicitement seulement à :

grant execute on function public.get_auth_email_for_username(text) to anon, authenticated;
Donc au final :

public : plus d’accès implicite
anon : accès autorisé
authenticated : accès autorisé
L’owner de la fonction, lui, garde ses droits normaux. On ne le “verrouille” pas.

Tu peux utiliser cette version :

create or replace function public.get_auth_email_for_username(username_input text)
returns text
language sql
security definer
set search_path = public
as $$
  select lower(trim(auth_email))
  from public.profiles
  where username = lower(trim(username_input))
  limit 1;
$$;

revoke all on function public.get_auth_email_for_username(text) from public;
grant execute on function public.get_auth_email_for_username(text) to anon, authenticated;
C’est la version que je te recommande.


username_input ? c'est un champ ?


Non, username_input n’est pas un champ de table.

C’est juste le nom du paramètre de la fonction SQL.

Dans :

create or replace function public.get_auth_email_for_username(username_input text)
ça veut dire :

la fonction s’appelle get_auth_email_for_username
elle reçoit 1 paramètre
ce paramètre s’appelle username_input
son type est text
Ensuite tu l’utilises dans la requête :

where username = lower(trim(username_input))
Ici :

username = la colonne de la table profiles
username_input = la valeur envoyée à la fonction
Exemple :
si le front appelle :

supabase.rpc('get_auth_email_for_username', {
  username_input: 'daddydi',
});