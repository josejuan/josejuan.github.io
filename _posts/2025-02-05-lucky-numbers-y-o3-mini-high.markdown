---
layout: post
title: Lucky Numbers y o3-mini-high
author: josejuan
categories: algorithms IA
---

El algoritmo descrito en <a href="/algorithms/2025/01/23/a000959-lucky-numbers.html">A000959 Lucky Numbers</a> es con diferencia el más eficiente en términos de operaciones que conozco (y del que estoy feliz por ser el autor y lo hayan querido referenciar en <a href="https://oeis.org/A000959">OEIS: A000959</a> **:)**).

Sin embargo, tiene una constante multiplicativa muy alta y el consumo de memoria es muy alto (Haskell **xD**), es por ello que pedí a **o3-mini-high** que, si tomando el algoritmo en *Haskell*, se le ocurría una forma rápida de implementarla en **C**. Al principio tratamos de implementar estructuras *Okasaki* en *C* puro, pero no funcionaba bien y, el sencillo *Zipper* en *Haskell* se le atragantaba **xD**.

Pero dándole más libertad, se le ocurrió la siguiente y genial implementación de la que quiero destacar las chispas de inteligencia **genuinas de o3-mini-high**:

1. aunque el cálculo de una posición (un número) puede evaluarse, se dió cuenta que si lo importante es la velocidad, merecía tenerlo en un array.
1. el árbol de *Fenwick* no es tan óptimo como el *Finger-Zipper-Tree* pero la constante multiplicativa es tan brutalmente baja, que era ideal para aplicar a este problema.
1. el uso de un array binario para mantener vivos es otra genialidad, porque pasa a *O(1)* un coste *O(log n)*.

El hecho de que un *LLM* sea capaz de *"entender"* perfectamente el código en *Haskell*, poder hacer una implementación funcional en *C*, y además, saber identificar estructuras óptimas y adaptarlas al problema concreto para cumplir el objetivo de máxima velocidad me parece, literalmente alucinante.

En fin, posteriormente con alguna modificación (como eliminar el primer array por tema de optimización de memoria o pasar el array de bits a un bit array), tenemos aquí un brutal algoritmo creado básicamente por una *IA* que enumera los números de la suerte hasta una cota dada:

```c
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>

#define GET_BIT(arr, i) (((arr)[(i) >> 3] >> ((i) & 7)) & 1)
#define SET_BIT(arr, i) ((arr)[(i) >> 3] |= (1 << ((i) & 7)))
#define CLEAR_BIT(arr, i) ((arr)[(i) >> 3] &= ~(1 << ((i) & 7)))
#define cand(z) (2 * (z) - 1)

static void fenw_update(int64_t *F, int64_t n, int64_t i, int64_t delta) {
    for (; i <= n; i += i & -i)
        F[i] += delta;
}

static int64_t fenw_find_kth(int64_t *F, int64_t n, int64_t k) {
    int64_t idx = 0, bit;
    for (bit = 1; bit <= n; bit <<= 1);
    for (bit >>= 1; bit; bit >>= 1) {
        if (idx + bit <= n && F[idx + bit] < k) {
            k -= F[idx + bit];
            idx += bit;
        }
    }
    return idx + 1;
}

int main(int argc, char *argv[]){
    if (argc != 2) {
        fprintf(stderr, "Usage: %s max\n", argv[0]);
        return 1;
    }
    int64_t X = atoll(argv[1]);
    if (X < 1)
        return 1;
    int64_t m = (X + 1) / 2;
    uint8_t *alive = calloc((m + 7) / 8, sizeof(uint8_t));
    int64_t *F = malloc((m + 1) * sizeof(int64_t));
    if (!alive || !F) {
        perror("malloc");
        return 1;
    }
    for (int64_t i = 1; i <= m; i++) {
        SET_BIT(alive, i);
        F[i] = 1;
    }
    for (int64_t i = 1; i <= m; i++) {
        int64_t j = i + (i & -i);
        if (j <= m)
            F[j] += F[i];
    }
    int64_t total = m;
    int64_t k = 2;
    while (k <= total) {
        int64_t pos = fenw_find_kth(F, m, k);
        int64_t lucky = cand(pos);
        if (lucky > total)
            break;
        int64_t step = lucky;
        int64_t posToRemove = step;
        while (posToRemove <= total) {
            int64_t r = fenw_find_kth(F, m, posToRemove);
            fenw_update(F, m, r, -1);
            CLEAR_BIT(alive, r);
            total--;
            posToRemove += step - 1;
        }
        k++;
    }
    int64_t cnt = 0;
    for (int64_t i = 1; i <= m; i++) {
        if (GET_BIT(alive, i) && cand(i) <= X) {
            cnt++;
            printf("%lld %lld\n", cnt, cand(i));
        }
    }
    free(alive);
    free(F);
    return 0;
}
```

Por ejemplo:

```bash
$ gcc -Ofast -march=native -flto -funroll-loops -fipa-pta -fomit-frame-pointer -ffast-math o3.64.c -o o3.64
$ time -f "%e, %M" ./o3.64.2.2 10000000000 > lucky.10g.o3
1507.61, 39674240
$ tail lucky.10g.o3
418348035 9999999807
418348036 9999999853
418348037 9999999883
418348038 9999999895
418348039 9999999903
418348040 9999999921
418348041 9999999937
418348042 9999999957
418348043 9999999985
418348044 9999999997
```

Es decir, ha calculado los primeros ~420 millones de números de la suerte, hasta 10e10, en 25 minutos. ¡Nada mal! **xD**

Para ver que el coste viene siendo *O(n log n)*, lanzamos hasta 10e9, 0.5e9, 0.1e9, ... y tenemos:

```bash
$ time -f "%e, %M" ./o3.64.2.2 1000000000 > /dev/null
124.46, 3968772
$ time -f "%e, %M" ./o3.64.2.2 500000000 > /dev/null
58.56, 1984928
$ time -f "%e, %M" ./o3.64.2.2 100000000 > /dev/null
9.92, 398200
```

## Actualización 2025-03-01

Como siempre la cabeza insatisfecha, incapaz de encontrar alguna propiedad interesante que explotar, se conforma con arañar ciclos y ciclos... sugerí <a href="https://oeis.org/A000959">publicar en OEIS</a> una versión mucho más eficiente que hace uso de una jerarquía de árboles de Fenwick y bitmaps a nivel de palabra (64 bits), reduciendo a casi 1 bit por número y mejorando la afinidad de caché. Por supuesto todo ello con la ayuda de _J. Bille, I. Larsen, I. L. Gørtz, et al. “Succinct Partial Sums and Fenwick Trees.” ESA 2017_ y creo que fue `o3`.

Por comparar, ahora los tiempos anteriores son:

```bash
$ time -f "%e, %M" ./oo3.c.exec 1000000000 > /dev/null
71.02, 97928
$ time -f "%e, %M" ./oo3.c.exec 500000000 > /dev/null
29.62, 52124
$ time -f "%e, %M" ./oo3.c.exec 100000000 > /dev/null
3.69, 15472
```

## Actualización 2025-08-10

Incansable, intentamos de nuevo con GPT-5, a ver si es capaz de transformar de forma práctica la versión de Haskell, pero no es capaz. Aun así, esta nueva versión sí ha podido aportar una versión paralela con GPU (y luego a CPU cuando no compensa el paralelismo) que reduce magistralmente el coste de números bajos (que descartan muchos múltiplos) y manteniendo la ventaja en números grandes con Fenwick.

Como referencia, los 3.69 secs de 1e8 se quedan en 1.33 y para 1e10 toma 152 segundos.

Para no aburrir, no la he sugerido a OEIS porque total es un speedup directo y además muy tuneado para mi pobre tarjeta (RTX3060 12G):

```C
/*
  Lucky numbers hybrid enumerator (GPU + CPU), memory-bound optimized.

  Idea:
  - Represent odds as a bitset (1=alive). GPU runs the early passes (small L).
  - On GPU keep a 1-byte "count per 64-bit word" array (cntWord). For each pass L:
      * Build per-word prefix counts in shared memory using cntWord (no bit loads).
      * For a word i, exact deletions is: floor((A+s_i+c_i)/L) - floor((A+s_i)/L).
        If zero, skip loading/storing that bit-word entirely → cuts global traffic.
      * Otherwise, read the word once, build a mask of deletions, write back, and
        update cntWord and cntBlock.
  - Switch to CPU when L >= 64*GPU_WPB (expected ≤1 deletion per block on average).
  - CPU continues with a two-level hierarchy + Fenwick over superblocks to select
    k-th survivors efficiently and perform deletions; finally prints "<ordinal> <value>".


  $ nvcc -O3 -std=c++17 -arch=sm_86 -Xptxas -dlcm=ca \
      -Xcompiler "-O3 -march=native -fno-exceptions -fno-rtti -pipe" \
      lucky_hybrid_plus.cu -o lucky_hybrid_plus

*/

#include <cstdio>
#include <cstdlib>
#include <cstdint>
#include <vector>
#include <charconv>
#include <algorithm>
#include <cassert>
#include <cstring>

#ifndef GPU_WPB
#define GPU_WPB 1024          // 64-bit words per GPU block (8 KiB per block)
#endif
#ifndef GPU_THREADS
#define GPU_THREADS 256       // threads per CUDA block (Ampere-friendly)
#endif
#ifndef GPU_LSTAR
#define GPU_LSTAR (64*GPU_WPB) // switch L* (≈one deletion per block on average)
#endif

static inline void fast_out(){ std::setvbuf(stdout,nullptr,_IOFBF,1<<20); }

//---------------- CPU: two-level hierarchy + Fenwick on superblocks ----------------
struct Fenwick {
    int n; std::vector<uint32_t> t;
    Fenwick():n(0){} explicit Fenwick(int n_):n(n_),t(n_+1,0){}
    void build(const std::vector<uint32_t>& a){
        n=(int)a.size(); t.assign(n+1,0);
        for(int i=0;i<n;++i) for(int x=i+1;x<=n;x+=x&-x) t[x]+=a[i];
    }
    void add(int i,int d){ for(int x=i+1;x<=n;x+=x&-x) t[x]+=d; }
    uint32_t sum_all() const { uint32_t s=0; for(int x=n;x>0;x-=x&-x) s+=t[x]; return s; }
    int find_by_order(uint32_t k, uint32_t& pref_before) const {
        int idx=0; uint32_t s=0; uint32_t bit=1u<<(31-__builtin_clz((unsigned)n));
        for(;bit;bit>>=1){ int nxt=idx+(int)bit; if(nxt<=n && s+t[nxt]<=k){ idx=nxt; s+=t[nxt]; } }
        pref_before=s; return idx;
    }
};

// 8-bit POP/SELECT tables for fast in-word selection (host)
static bool TAB_INIT=false; static uint8_t POP8[256], SEL8[256][8];
static inline void build_tables(){
    if(TAB_INIT) return; TAB_INIT=true;
    for(int b=0;b<256;++b){
        uint8_t m=b, c=__builtin_popcount(b); POP8[b]=c;
        int pos=0; for(int i=0;i<8;++i) if(m&(1u<<i)) SEL8[b][pos++]=i;
        for(;pos<8;++pos) SEL8[b][pos]=0;
    }
}
static inline int select_in_word_u64(uint64_t w, unsigned k){
    unsigned r=k;
    for(int byte=0; byte<8; ++byte){
        uint8_t ch=(uint8_t)((w>>(byte*8))&0xFF), c=POP8[ch];
        if(r<c) return byte*8 + SEL8[ch][r];
        r-=c;
    }
    return -1;
}

static void sieve_cpu_and_print(uint64_t N, std::vector<uint64_t>& words, uint64_t rank_lucky_start)
{
    build_tables();
    const int W=(int)words.size();

    // Superblock layout: SB -> groups -> words (improves locality for search)
    constexpr int WORDS_PER_SB=256, GROUPS_PER_SB=16, WORDS_PER_GROUP=16;
    const int S=(W + WORDS_PER_SB - 1)/WORDS_PER_SB;

    std::vector<uint8_t>  cntW(W);
    for(int i=0;i<W;++i) cntW[i]=(uint8_t)__builtin_popcountll(words[i]);
    std::vector<uint16_t> cntG((size_t)S*GROUPS_PER_SB,0);
    std::vector<uint32_t> cntSB(S,0);
    for(int s=0;s<S;++s){
        int base=s*WORDS_PER_SB; uint32_t sb=0;
        for(int g=0; g<GROUPS_PER_SB; ++g){
            int gbase=base+g*WORDS_PER_GROUP; uint16_t cg=0;
            for(int w=0; w<WORDS_PER_GROUP; ++w){
                int wi=gbase+w; if(wi>=W) break; cg+=cntW[wi];
            }
            cntG[s*GROUPS_PER_SB+g]=cg; sb+=cg;
        }
        cntSB[s]=sb;
    }
    Fenwick fw; fw.build(cntSB);
    uint64_t total=fw.sum_all();

    // Select the k-th survivor (0-based) with SB→group→word descent
    auto select_global = [&](uint64_t k, int& sb,int& g,int& wi,int& bp){
        uint32_t prefSB; sb=fw.find_by_order((uint32_t)k, prefSB);
        uint64_t rem=k - prefSB;
        int baseG=sb*GROUPS_PER_SB; uint32_t acc=0; g=0;
        while(true){ uint16_t cg=cntG[baseG+g]; if(acc+cg>rem) break; acc+=cg; ++g; }
        int baseW=sb*WORDS_PER_SB + g*WORDS_PER_GROUP; int woff=0;
        while(true){ int wi0=baseW+woff; uint8_t cw=cntW[wi0]; if(acc+cw>rem){ wi=wi0; break; } acc+=cw; ++woff; }
        uint64_t wbits=words[wi]; unsigned r=(unsigned)(rem-acc);
        bp=select_in_word_u64(wbits,r);
    };

    auto clear_and_update = [&](int sb,int g,int wi,int bp){
        words[wi] &= ~(1ull<<bp);
        --cntW[wi];
        --cntG[sb*GROUPS_PER_SB + g];
        fw.add(sb,-1);
        --total;
    };

    uint64_t rank_lucky=rank_lucky_start;
    while(rank_lucky <= total){
        int sb,g,wi,bp;
        select_global(rank_lucky - 1, sb,g,wi,bp);
        uint64_t idx=((uint64_t)wi<<6) + (uint64_t)bp;
        uint64_t L = 2*idx + 1;
        if(L > total) break;

        // Delete every L-th survivor using exact positions via select_global
        uint64_t len0=total;
        uint64_t mdel=len0 / L;
        for(uint64_t t=1; t<=mdel; ++t){
            uint64_t k = t*L - t;
            select_global(k, sb,g,wi,bp);
            clear_and_update(sb,g,wi,bp);
        }
        ++rank_lucky;
    }

    // Output "<ordinal> <value>" with large buffered writes
    std::vector<char> out(8*1024*1024); size_t p=0; uint64_t ord=0;
    for(size_t wi=0; wi<words.size(); ++wi){
        uint64_t m=words[wi];
        while(m){
            int b=__builtin_ctzll(m); m &= m-1;
            uint64_t idx=((uint64_t)wi<<6) + (uint64_t)b;
            ++ord;
            auto r1=std::to_chars(out.data()+p, out.data()+out.size(), ord); p += (size_t)(r1.ptr-(out.data()+p));
            out[p++]=' ';
            auto r2=std::to_chars(out.data()+p, out.data()+out.size(), 2*idx+1); p += (size_t)(r2.ptr-(out.data()+p));
            out[p++]='\n';
            if(p > out.size()-64){ std::fwrite(out.data(),1,p,stdout); p=0; }
        }
    }
    if(p) std::fwrite(out.data(),1,p,stdout);
}

//---------------- GPU kernels: count-per-word and selective updates ----------------
#include <cuda_runtime.h>
#define CUDA_OK(x) do{ cudaError_t e=(x); if(e!=cudaSuccess){ \
  std::fprintf(stderr,"CUDA %s:%d: %s\n",__FILE__,__LINE__,cudaGetErrorString(e)); std::exit(1);} }while(0)

constexpr int WORDS_PER_BLOCK = GPU_WPB;

__device__ __forceinline__ int select_in_word_dev(uint64_t w, unsigned k){
    unsigned r=k;
    #pragma unroll 8
    for(int byte=0; byte<8; ++byte){
        uint8_t ch=(uint8_t)((w>>(byte*8)) & 0xFF);
        int c=__popc((unsigned)ch);
        if(r < (unsigned)c){
            unsigned bv=ch; while(r){ bv&=bv-1u; --r; }
            int pos=__ffs(bv)-1;
            return byte*8 + pos;
        }
        r -= c;
    }
    return -1;
}

// Sum per-word counts into per-block totals (done once)
__global__ __launch_bounds__(GPU_THREADS,2)
void k_sum_counts(const uint8_t* __restrict cntWord,
                  uint32_t* __restrict cntBlock, int W)
{
    int blk=blockIdx.x, base=blk*WORDS_PER_BLOCK, wlim=W-base;
    if(wlim<=0) return; int localW = wlim<WORDS_PER_BLOCK? wlim:WORDS_PER_BLOCK;
    __shared__ uint32_t ssum[GPU_THREADS]; uint32_t acc=0;
    for(int i=threadIdx.x;i<localW;i+=blockDim.x) acc += cntWord[base+i];
    ssum[threadIdx.x]=acc; __syncthreads();
    for(int ofs=blockDim.x>>1; ofs; ofs>>=1){
        if(threadIdx.x<ofs) ssum[threadIdx.x]+=ssum[threadIdx.x+ofs];
        __syncthreads();
    }
    if(threadIdx.x==0) cntBlock[blk]=ssum[0];
}

// Erase every L-th using per-word counts to avoid reading words with zero deletions
__global__ __launch_bounds__(GPU_THREADS,2)
void k_erase_using_counts(uint64_t* __restrict bits,
                          uint8_t* __restrict cntWord,
                          const uint32_t* __restrict prefBlock,
                          uint32_t* __restrict cntBlock,
                          int W, int L)
{
    int blk=blockIdx.x, base=blk*WORDS_PER_BLOCK, wlim=W-base;
    if(wlim<=0) return; int localW = wlim<WORDS_PER_BLOCK? wlim:WORDS_PER_BLOCK;

    uint32_t ones_before = prefBlock[blk];

    extern __shared__ unsigned char smem[];
    uint16_t* sCnt  = (uint16_t*)smem;                    // per-word counts snapshot
    uint32_t* sPref = (uint32_t*)(sCnt + localW);         // per-word prefix of counts

    for(int i=threadIdx.x;i<localW;i+=blockDim.x) sCnt[i] = cntWord[base+i];
    if(threadIdx.x==0) sPref[0]=0u;
    __syncthreads();

    if(threadIdx.x==0){
        for(int i=0;i<localW;++i) sPref[i+1] = sPref[i] + sCnt[i];
    }
    __syncthreads();

    uint32_t ones_block = sPref[localW];
    uint32_t mblk = ((ones_before + ones_block)/(uint32_t)L) - (ones_before/(uint32_t)L);
    if(!mblk) return;

    __shared__ uint32_t removed_shared;
    if(threadIdx.x==0) removed_shared=0;
    __syncthreads();

    // Only words with mi(L)>0 are read/written; others are skipped entirely
    for(int i=threadIdx.x;i<localW;i+=blockDim.x){
        uint32_t s0   = sPref[i];
        uint32_t cnti = sCnt[i];
        if(!cnti) continue;

        uint32_t mi = ((ones_before + s0 + cnti)/(uint32_t)L) - ((ones_before + s0)/(uint32_t)L);
        if(!mi) continue;

        uint32_t j0 = (ones_before + s0) / (uint32_t)L + 1u;
        uint32_t j1 = (ones_before + s0 + cnti) / (uint32_t)L;

        uint64_t w = bits[base+i];
        uint64_t mask = 0ull;
        for(uint32_t j=j0; j<=j1; ++j){
            uint32_t localInBlock = (uint32_t)j * (uint32_t)L - 1u - ones_before;
            uint32_t k_in_word = localInBlock - s0;
            int bitpos = select_in_word_dev(w, k_in_word);
            mask |= (1ull << bitpos);
        }

        if(mask){
            uint64_t nw = w & ~mask;
            bits[base+i] = nw;
            uint32_t d = __popcll(mask);
            cntWord[base+i] = (uint8_t)(cnti - d);
            atomicAdd(&removed_shared, d);
        }
    }
    __syncthreads();

    if(threadIdx.x==0){
        cntBlock[blk] = ones_block - removed_shared;
    }
}

//---------------- Host helpers: pick L by copying a single GPU block ----------------
static uint64_t pick_L_from_device(uint64_t k,
                                   const uint32_t* h_prefBlock,
                                   int numBlocks,
                                   const uint64_t* d_bits,
                                   int W)
{
    int lo=0, hi=numBlocks;
    while(lo+1<hi){ int mid=(lo+hi)>>1; if(h_prefBlock[mid]<=k) lo=mid; else hi=mid; }
    int blk=lo, base=blk*WORDS_PER_BLOCK;
    int wlim=W-base; int localW = wlim<WORDS_PER_BLOCK? wlim:WORDS_PER_BLOCK;

    static uint64_t h_block[GPU_WPB]; // only the needed block is copied (8 KiB)
    CUDA_OK(cudaMemcpy(h_block, d_bits+base, localW*sizeof(uint64_t), cudaMemcpyDeviceToHost));

    std::vector<uint32_t> pref(localW+1); pref[0]=0;
    for(int i=0;i<localW;++i) pref[i+1]=pref[i] + (uint32_t)__builtin_popcountll(h_block[i]);

    uint32_t local=(uint32_t)(k - h_prefBlock[blk]);
    int widx = int(std::upper_bound(pref.begin(), pref.end(), local) - pref.begin()) - 1;
    if(widx<0) widx=0; if(widx>=localW) widx=localW-1;
    unsigned r = local - pref[widx];

    unsigned rr=r; int bitpos=-1; uint64_t wbits=h_block[widx];
    for(int byte=0; byte<8; ++byte){
        uint8_t ch=(uint8_t)((wbits>>(byte*8))&0xFF); uint8_t c=(uint8_t)__builtin_popcount((unsigned)ch);
        if(rr<c){ unsigned bv=ch; while(rr){ bv&=bv-1u; --rr; } bitpos=byte*8 + __builtin_ctz(bv); break; }
        rr-=c;
    }
    assert(bitpos>=0);
    uint64_t idx=((uint64_t)(base+widx)<<6) + (uint64_t)bitpos;
    return 2*idx + 1;
}

//---------------- Main: GPU early passes + CPU finish ----------------
int main(int argc, char** argv){
    fast_out();
    if(argc!=2) return 1;
    char* e=nullptr; unsigned long long N=strtoull(argv[1],&e,10);
    if(!e||*e) return 1; if(N<1) return 0;

    const uint64_t M=(N+1ull)>>1;
    const int W=(int)((M+63ull)>>6);
    const int numBlocks = (W + WORDS_PER_BLOCK - 1) / WORDS_PER_BLOCK;

    std::vector<uint64_t> init(W, ~0ull);
    int tail=(int)(M & 63ull); if(tail) init[W-1] &= ((1ull<<tail)-1ull);

    std::vector<uint8_t> h_cntWord(W, 64u);
    if(tail) h_cntWord[W-1] = (uint8_t)tail;

    uint64_t* d_bits=nullptr;          CUDA_OK(cudaMalloc(&d_bits, (size_t)W*sizeof(uint64_t)));
    uint8_t*  d_cntWord=nullptr;       CUDA_OK(cudaMalloc(&d_cntWord, (size_t)W*sizeof(uint8_t)));
    uint32_t* d_cntBlock=nullptr;      CUDA_OK(cudaMalloc(&d_cntBlock, (size_t)numBlocks*sizeof(uint32_t)));
    uint32_t* d_prefBlock=nullptr;     CUDA_OK(cudaMalloc(&d_prefBlock, (size_t)numBlocks*sizeof(uint32_t)));

    CUDA_OK(cudaMemcpy(d_bits,    init.data(),     (size_t)W*sizeof(uint64_t), cudaMemcpyHostToDevice));
    CUDA_OK(cudaMemcpy(d_cntWord, h_cntWord.data(),(size_t)W*sizeof(uint8_t),  cudaMemcpyHostToDevice));

    std::vector<uint32_t> h_cntBlock(numBlocks), h_prefBlock(numBlocks);

    dim3 grid(numBlocks), block(GPU_THREADS);
    k_sum_counts<<<grid, block>>>(d_cntWord, d_cntBlock, W);
    CUDA_OK(cudaGetLastError());
    CUDA_OK(cudaMemcpy(h_cntBlock.data(), d_cntBlock, (size_t)numBlocks*sizeof(uint32_t), cudaMemcpyDeviceToHost));

    uint64_t rank_lucky=2;
    while(true){
        uint64_t total=0;
        for(int i=0;i<numBlocks;++i){ h_prefBlock[i]=(uint32_t)total; total += h_cntBlock[i]; }
        if(rank_lucky > total) break;

        uint64_t L = pick_L_from_device(rank_lucky - 1, h_prefBlock.data(), numBlocks, d_bits, W);
        if(L > total) break;
        if(L >= (uint64_t)GPU_LSTAR) break;

        CUDA_OK(cudaMemcpy(d_prefBlock, h_prefBlock.data(), (size_t)numBlocks*sizeof(uint32_t), cudaMemcpyHostToDevice));

        size_t shmem = (size_t)WORDS_PER_BLOCK*2 + (size_t)(WORDS_PER_BLOCK+1)*4;
        k_erase_using_counts<<<grid, block, shmem>>>(d_bits, d_cntWord, d_prefBlock, d_cntBlock, W, (int)L);
        CUDA_OK(cudaGetLastError());
        CUDA_OK(cudaDeviceSynchronize());

        CUDA_OK(cudaMemcpy(h_cntBlock.data(), d_cntBlock, (size_t)numBlocks*sizeof(uint32_t), cudaMemcpyDeviceToHost));
        ++rank_lucky;
    }

    std::vector<uint64_t> words(W);
    CUDA_OK(cudaMemcpy(words.data(), d_bits, (size_t)W*sizeof(uint64_t), cudaMemcpyDeviceToHost));
    CUDA_OK(cudaFree(d_prefBlock)); CUDA_OK(cudaFree(d_cntBlock));
    CUDA_OK(cudaFree(d_cntWord));  CUDA_OK(cudaFree(d_bits));

    sieve_cpu_and_print(N, words, rank_lucky);
    return 0;
}
```
