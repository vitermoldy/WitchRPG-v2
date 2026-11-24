# Crimson Sovereign: Hutan (WitchRPG v2)

Action-RPG third-person di hutan terbuka. Kamu bermain sebagai Ilyra dari balik bahu kanannya: tangan kirinya membengkokkan realitas dengan sihir Chaos, tangan kanannya membangkitkan musuh yang kalah menjadi pasukan bayangan. Sistem gameplay mengikuti [WitchRPG v1](../WitchRPG); rasa kamera dan tempurnya mengacu pada game aksi third-person berbobot.

Game ini dibangun per fase menurut [PROMPT.md](./PROMPT.md). Keputusan desain ada di [DESIGN.md](./DESIGN.md), gambaran awal di Blender (render, animatic, papan makhluk) di [previz/](./previz/PREVIZ.md).

| Fase | Isi | Status |
| --- | --- | --- |
| 0. Previz | Gambaran game di Blender: kamera, skala, palet, block-out semua makhluk | Selesai |
| 1. Fondasi | Lembah hutan 1 km dengan lima zona, kamera bahu, gerak, dodge, mode bidik, lock-on | Selesai |
| 2. Tempur | Kombo tongkat, parry, Eksekusi, sihir Chaos, Imp, Hellhound, Harpy | Berikutnya |
| 3. Umbra | Umbra Rite, pasukan bayangan | |
| 4. Dunia dan progresi | Zona I sampai III penuh, kamp, altar, Ledger | |
| 5. Boss | Hydra tiga fase, zona IV dan V | |
| 6. Poles | Model akhir, suara, akun dan simpanan server | |

## Menjalankan

Butuh Node 22 atau lebih baru dan browser dengan WebGL 2.

```bash
npm install
npm run dev      # http://localhost:5297
npm test         # tes progresi v1, kamera, gerak, dan peta
npm run build    # hasil di dist/
npm run models   # buat ulang model GLB dari block-out Blender (butuh Blender 5.1)
```

Kalau game terasa berat di laptop dengan dua GPU, atur Chrome ke "High performance" di Windows: Settings, System, Display, Graphics.

## Kontrol (fase 1)

| Gerak | |
| --- | --- |
| WASD | Jalan ke arah kamera |
| Shift | Lari |
| Spasi | Dodge ke arah gerak; tanpa arah, mundur |
| Mouse | Putar kamera |

| Kamera | |
| --- | --- |
| Tahan klik kanan | Mode bidik: kamera mendekat ke bahu, tongkat turun dari titik bidik |
| Klik tengah | Lock-on ke makhluk terdekat di depan; klik lagi untuk lepas |
| Sentak mouse ke samping | Pindah lock-on ke makhluk di sisi itu |
| Esc | Jeda dan sensitivitas mouse |

## Struktur

```
src/game/     logika murni: angka tuning (balance.ts), progresi, skill, simpanan (dari v1)
src/engine/   kamera (camera.ts), gerak (player.ts), rintangan (obstacles.ts), lock-on, model, input, game loop
src/world/    peta dan zona (map.ts), medan per chunk, hutan, kabut dan langit, kamp makhluk
