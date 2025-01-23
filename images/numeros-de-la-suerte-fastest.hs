import System.Environment
import GHC.Word
import GHC.Int

type AInt = Int64
type BInt = Word32

data F = N { fN_ :: !AInt, fL :: !F, fR :: !F } | L { fV :: !BInt } deriving Show
data H = LH !AInt !F | RH !AInt !F deriving Show
data Z = Z !AInt !F [H] deriving Show

(.^.) :: F ->F ->F
l .^. r = N (fN l + fN r) l r
{-# INLINE (.^.) #-}

fN :: F ->AInt
fN (N n _ _) = n
fN (L _    ) = 1
{-# INLINE fN #-}

isL :: F ->Bool
isL (L _) = True
isL _ = False
{-# INLINE isL #-}

index :: F ->AInt ->BInt
(L n    ) `index` 1 = n
(N _ l r) `index` i = if i <= fN l then l `index` i else r `index` (i - fN l)
{-# INLINE index #-}

toList :: F ->[BInt]
toList (L n) = [n]
toList (N _ l r) = toList l ++ toList r

fromList :: [BInt] ->F
fromList [] = error "bad list"
fromList [a] = L a
fromList xs = let (ls, rs) = splitAt (length xs `div` 2) xs
              in  fromList ls .^. fromList rs

unzipper (Z _ m _) = m
zipper m = Z 0 m []

goRight, goLeft, goUp :: Z ->Z
goRight (Z a (N _ l r) zs) = Z (a + fN l) r (RH a l: zs)
{-# INLINE goRight #-}
goLeft  (Z a (N _ l r) zs) = Z  a         l (LH a r: zs)
{-# INLINE goLeft #-}
goUp    (Z _ r (RH a l: zs)) = Z a (l .^. r) zs
goUp    (Z _ l (LH a r: zs)) = Z a (l .^. r) zs
goUp  z@(Z _ _          [] ) = z
{-# INLINE goUp #-}

goto f i z@(Z a (N s l r) zs)
  | a < i && i <= (a + fN l) = f i $ goLeft  z
  | a < i && i <= (a +    s) = f i $ goRight z
  | null zs                =               z
  | otherwise              = f i $ goUp    z
{-# INLINE goto #-}

adjust :: AInt ->F ->F
adjust d m = (unzipper . doRemove lasti . zipper) m
  where lasti = fN m - fN m `mod` d
        doRemove i (Z _ (L n) (RH a l: zs)) = doAdd n (i - 1) $ goUp (Z  a      l zs)
        doRemove i (Z _ (L n) (LH a r: zs)) = doAdd n (i - 1) $ goUp (Z (a - 1) r zs)
        doRemove i z                        = goto doRemove i z
        doAdd n' i (Z a (L n)          zs ) = doRemove (i - d + 1) $ goUp $ Z a (L (n + n')) zs
        doAdd n' i z                        = goto (doAdd n') i z

repeatF :: AInt ->F ->F
repeatF n f = case n `divMod` 2 of
                (0, 1) ->f
                (d, 0) ->t .^. t       where t = repeatF d f
                (d, 1) ->t .^. t .^. f where t = repeatF d f

expand :: AInt ->AInt ->F ->F
expand maxSize n f = adjust n $ repeatF (min (maxSize `div` s) r) f
  where s = fN f
        r = lcm s n `div` s

lucky :: AInt ->AInt ->[AInt]
lucky maxSize expansions = r 1 (fromList [2]) 1 expansions
  where r n f i 0 = a n f i
        r n f i z = n: r n' (expand maxSize n' f) (i + 1) (z - 1) where n' = n + fromIntegral (f `index` i)
        a n f i = if i > fN f then [n] else n: a n' (adjust n' f) (i + 1) where n' = n + fromIntegral (f `index` i)

main = do
  [a, b, m] <-map read <$> getArgs
  case a of
    2 ->let xs = lucky m b
        in  print (length xs - 1, last xs)
    3 ->mapM_ print $ lucky m b

{-

[josejuan@centella centella]$ stack exec -- ghc -O3 -fforce-recomp -auto-all -funbox-strict-fields ../numeros-de-la-suerte.5.hs
[1 of 1] Compiling Main             ( ../numeros-de-la-suerte.5.hs, ../numeros-de-la-suerte.5.o )
Linking ../numeros-de-la-suerte.5 ...
[josejuan@centella centella]$ time -f "%e seg, %M Kb" ../numeros-de-la-suerte.5 2 9 130000000
(2330996,41891851)
18.44 seg, 487404 Kb
[josejuan@centella centella]$ time -f "%e seg, %M Kb" ../numeros-de-la-suerte.5 3 9 130000000 | tail -n 10
19.53 seg, 486448 Kb
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
