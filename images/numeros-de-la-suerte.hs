{-# LANGUAGE BangPatterns #-}
import System.Environment
{-

  Se generan y van refinando los saltos según se añaden números de la suerte

    1: +2
    3: +2+4
    7: +2+4+2+4+2+6+4+2+4+2+4+6
    9: +2+4+2+4+2+6+4+6+2+4+6+2+4+2+4+8+4+2+4+2+4+6+2+6+4+2+6+4+2+4+2+10
    ...

  una vez alcanzado cierto límite prefijado (el ciclo crece muy rápidamente)
  ya no se expande el ciclo, sino que se va acortando, según se sigue refinando
  por la acción de nuevos números de la suerte generados.

  El proceso termina cuando ya no hay incrementos en el ciclo.

    9:   [2,6,4,6,2,4,6,2,4,2,4,8,4,2,4,2,4,6,2,6,4,2,6,4,2,4,2,10]
    13:  [6,4,6,2,4,6,6,2,4,8,4,2,4,2,4,6,2,6,6,6,4,2,4,2,10]
    15:  [4,6,2,4,6,6,2,12,4,2,4,2,4,6,2,6,6,6,4,2,4,12]
    ...
    99:  [6,4,12]
    105: [4,12]
    111: [12]
    115: []

  Para concatenar y reagrupar eficientemente los saltos se usa una estructura
  adhoc de un finger-tree que es recorrida con un zipper.

-}

-- el finger-tree
data F = N { fN_ :: !Int    -- elementos que contiene
           , fL  :: !F      -- izq
           , fR :: !F }     -- der
       | L { fV :: !Int }

-- agujeros del zipper (guarda los elementos totales acumulados a la izq)
data H = LH !Int !F         -- agujero a la izq
       | RH !Int !F         -- agujero a la der

-- zipper
data Z = Z !Int -- elementos totales acumulados a la izq
           !F   -- el nodo enfocado por el zipper
           [H]  -- el historial (la cremallera) del camino actual

-- une dos árboles
(.^.) :: F ->F ->F
l .^. r = N (fN l + fN r) l r

-- da el nº de elementos que contiene
fN :: F ->Int
fN (N n _ _) = n
fN (L _    ) = 1

-- devuelve el elemento i-ésimo (1, 2, 3, ...)
index :: F ->Int ->Int
(L n    ) `index` 1 = n
(N _ l r) `index` i = if i <= fN l then l `index` i else r `index` (i - fN l)

-- dado un árbol inicia un zipper
zipper m = Z 0 m []

-- dado un zipper devuelve el árbol apuntado
unzipper (Z _ m _) = m

-- movimientos por el árbol usando el zipper
goRight, goLeft, goUp :: Z ->Z
goRight (Z a (N _ l r) zs) = Z (a + fN l) r (RH a l: zs)
goLeft  (Z a (N _ l r) zs) = Z  a         l (LH a r: zs)
goUp    (Z _ r (RH a l: zs)) = Z a (l .^. r) zs
goUp    (Z _ l (LH a r: zs)) = Z a (l .^. r) zs
goUp  z@(Z _ _          [] ) = z

-- sabe llegar al nodo en cuestión y entonces aplica f
goto f i = g
  where g z@(Z a (N s l r) zs)
          | a < i && i <= (a + fN l) = g $ goLeft  z
          | a < i && i <= (a +    s) = g $ goRight z
          | null zs                =             z
          | otherwise              = g $ goUp    z
        g z = f i z

-- ajusta una lista de saltos uniendo los MOD(k)
adjust :: Int ->F ->F
adjust d m = (unzipper . doRemove lasti . zipper) m
  where lasti = fN m - fN m `mod` d
        doAdd n' i (Z a (L n)          zs ) = goto doRemove (i - d + 1) $ goUp $ Z a (L (n + n')) zs
        doRemove i (Z _ (L n) (RH a l: zs)) = goto (doAdd n) (i - 1) $ goUp (Z  a      l zs)
        doRemove i (Z _ (L n) (LH a r: zs)) = goto (doAdd n) (i - 1) $ goUp (Z (a - 1) r zs)
        doRemove i z = goto doRemove i z

-- repite un árbol n veces
repeatF :: Int ->F ->F
repeatF n f = case n `divMod` 2 of
                (0, 1) ->f
                (d, 0) ->t .^. t       where t = repeatF d f
                (d, 1) ->t .^. t .^. f where t = repeatF d f

-- expande un árbol sin superar un límite de elementos
expand :: Int ->Int ->F ->F
expand maxSize n f = adjust n $ repeatF (min (maxSize `div` s) r) f
  where s = fN f
        r = lcm s n `div` s

-- calcula todos los lucky numbers haciendo n expansiones
lucky :: Int ->Int ->[Int]
lucky maxSize expansions = r 1 (L 2) 1 expansions
  where r :: Int ->F ->Int ->Int ->[Int]
        r n f i 0 = a n f i
        r n f i z = n: r n' (expand maxSize n' f) (i + 1) (z - 1) where n' = n + f `index` i
        a n f i = if i > fN f then [n] else n: a n' (adjust n' f) (i + 1) where n' = n + f `index` i

main = do
  [x, m] <-map read <$> getArgs
  mapM_ print $ lucky m x

{-

[josejuan@centella centella]$ stack exec -- ghc -O3 -fforce-recomp ../numeros-de-la-suerte.hs && time -f "%E, %M" ../numeros-de-la-suerte 9 1000000000 | tail
[1 of 1] Compiling Main             ( ../numeros-de-la-suerte.hs, ../numeros-de-la-suerte.o )
Linking ../numeros-de-la-suerte ...
0:23.13, 550860
41891685
41891703
41891727
41891731
41891733
41891757
41891761
41891767
41891779
41891851

-}

