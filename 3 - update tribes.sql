Image jointe par l’utilisateur
Image jointe par l’utilisateur
(Sans contenu)
Du coup avec tes captures, le problème n’est pas l’absence de profil.

Le membre 9e626906-... existe bien :

dans public.tribe_members.user_id
et aussi dans public.profiles.id
Donc si l’app affiche quand même Profile unavailable, la cause la plus probable est : la requête profiles ne renvoie pas cette ligne au front, très probablement à cause des policies RLS sur public.profiles.

La logique actuelle dans supabase.js est :

lire les user_id depuis tribe_members
faire ensuite :
from('profiles').select(...).in('id', memberUserIds)
Si une policy profiles n’autorise pas à lire les profils des autres membres de la tribe, Supabase renvoie seulement :

ton propre profil
ou un sous-ensemble
et du coup côté app ce membre tombe en fallback.

Donc là ce qu’il faut vérifier dans Supabase, c’est pas les données, mais les policies sur public.profiles.

Il te faut une policy qui autorise un utilisateur connecté à lire :

son propre profil
et/ou les profils des membres de sa tribe
En gros, un truc du style “authenticated users can read profiles of users who share a tribe with them”.

Si tu veux, je peux te rédiger la policy SQL exacte pour profiles, adaptée à ton schéma tribe_members.


Image jointe par l’utilisateur
tu detectes bien qu'il y a un autre membre mais aucune inf...


Oui, exactement.

L’app détecte bien :

qu’il y a 2 lignes dans tribe_members
donc memberCount = 2
et elle a bien le user_id du deuxième membre
Mais pour ce deuxième user_id, elle ne récupère pas de donnée exploitable depuis profiles, donc elle affiche le fallback :

nom fake basé sur l’id : Member 9e6269
sous-texte : Profile unavailable
Donc ce n’est pas un bug de comptage ou de jointure “tribe member”.
C’est vraiment un bug de lecture du profil du membre après détection.

En clair :

tribe_members : OK
profiles pour l’autre membre : pas lisible / pas renvoyé
fallback UI : normal vu l’état des données renvoyées
Donc oui, l’app voit bien “un autre membre existe”, mais pas “ses infos”.


ah bah oui !!! bah faut autoriser à lire nom prenom username et favoris entre membres d'une meme tribe !!


Oui, c’est ça.

Et point important : RLS dans Supabase autorise des lignes, pas des colonnes. Donc si l’app continue de lire profiles directement, il faut autoriser la ligne du profil entre membres d’une même tribe. Même chose pour user_favorites.

Vu le code actuel, il te faut au minimum :

create policy "tribe members can read each other profiles"
on public.profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.tribe_members me
    join public.tribe_members other
      on other.tribe_id = me.tribe_id
    where me.user_id = auth.uid()
      and other.user_id = profiles.id
  )
);
Et pour les favoris :

create policy "tribe members can read each other favorites"
on public.user_favorites
for select
to authenticated
using (
  exists (
    select 1
    from public.tribe_members me
    join public.tribe_members other
      on other.tribe_id = me.tribe_id
    where me.user_id = auth.uid()
      and other.user_id = user_favorites.user_id
  )
);
Si tu as déjà des policies sur ces tables, ne les duplique pas bêtement : adapte-les ou ajoute celles-ci proprement.

Note aussi un détail : l’app lit aussi l’avatar dans supabase.js, donc si tu veux voir avatar + prénom + nom + username entre membres, cette policy profiles suffit pour le front actuel.

Si tu veux, je peux maintenant te préparer la version complète safe :

avec drop policy if exists
et une petite requête de test SQL pour vérifier que le second membre remonte bien.