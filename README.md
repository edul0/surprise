# Para a Minha Dragoa ♡

Página-surpresa de Dia dos Namorados feita com React + Vite + Framer Motion.

## Como adicionar as fotos

Coloque os arquivos na pasta `public/` com exatamente estes nomes:

| Arquivo               | Onde aparece                                      |
| --------------------- | ------------------------------------------------- |
| `public/collage.jpg`  | Capa da playlist (hero, reflexo e barra inferior) |
| `public/photo1.jpg`   | Polaroid da esquerda — "Sempre juntos ❤"          |
| `public/photo2.jpg`   | Polaroid central (destaque) — "Minha dragoa"      |
| `public/photo3.jpg`   | Polaroid da direita — "Para sempre"               |

Enquanto os arquivos não existirem, a página usa imagens de fallback
(Unsplash e `public/cover.svg`) automaticamente.

## Rodando

```bash
npm ci --legacy-peer-deps
npm run dev      # desenvolvimento
npm run build    # produção
```
