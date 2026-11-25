# Crimson Sovereign: Hutan (WitchRPG v2)

Action-RPG third-person di hutan terbuka. Kamu bermain sebagai Ilyra dari balik bahu kanannya: tangan kirinya membengkokkan realitas dengan sihir Chaos, tangan kanannya membangkitkan musuh yang kalah menjadi pasukan bayangan. Sistem gameplay mengikuti [WitchRPG v1](../WitchRPG); rasa kamera dan tempurnya mengacu pada game aksi third-person berbobot.

Game ini dibangun per fase menurut [PROMPT.md](./PROMPT.md). Keputusan desain ada di [DESIGN.md](./DESIGN.md), gambaran awal di Blender (render, animatic, papan makhluk) di [previz/](./previz/PREVIZ.md).

| Fase | Isi | Status |
| --- | --- | --- |
| 0. Previz | Gambaran game di Blender: kamera, skala, palet, block-out semua makhluk | Selesai |
| 1. Fondasi | Lembah hutan 1 km dengan lima zona, kamera bahu, gerak, dodge, mode bidik, lock-on | Selesai |
| 2. Tempur | Kombo tongkat, parry, Eksekusi, sihir Chaos, Imp, Hellhound, Harpy | Selesai |
| 3. Umbra | Umbra Rite, pasukan bayangan | Selesai |
| 4. Dunia dan progresi | Zona I sampai III, altar, Ledger, Centaur, Naga rawa, Minotaur, Medusa, Chimera | Selesai |
| 5. Boss | Hydra tiga fase, zona IV dan V, Cyclops, Succubus, Incubus, Phoenix, makhluk elit | Selesai |

## Menjalankan

Butuh Node 22 atau lebih baru dan browser dengan WebGL 2.

```bash
npm install
npm run dev      # http://localhost:5297
npm test         # tes progresi v1, kamera, gerak, peta, tempur, AI makhluk, dan simpanan
npm run build    # hasil di dist/
npm run models   # buat ulang model GLB dari block-out Blender (butuh Blender 5.1)
npm run models -- imp hellhound harpy --lod 0.22   # versi sederhana untuk kerumunan bayangan
```

Kalau game terasa berat di laptop dengan dua GPU, atur Chrome ke "High performance" di Windows: Settings, System, Display, Graphics.

## Kontrol (fase 4)

| Gerak dan kamera | |
| --- | --- |
| WASD, Shift | Jalan ke arah kamera, lari |
| Spasi | Dodge ke arah gerak; tanpa arah, mundur. Satu-satunya jawaban untuk garis amber yang berkedip |
| Mouse | Putar kamera |
| Klik tengah | Lock-on ke makhluk terdekat di depan; klik lagi untuk lepas |
| Sentak mouse ke samping | Pindah lock-on ke makhluk di sisi itu |
| Tab | Ledger: bagi poin stat dan skill, lihat dan lepas bayangan. Game menunggu selama Ledger terbuka |
| F di altar | Perjalanan cepat ke altar lain yang sudah menyala, atau buka Ledger |
| Esc | Jeda: sensitivitas, volume, bayangan detail penuh, guncangan kamera |

| Tempur | |
| --- | --- |
| Klik kiri | Tiga pukulan tongkat berantai; tahan untuk pukulan berat |
| Tahan C | Tahan serangan dari depan. Tekan tepat saat cincin amber penuh untuk parry: makhluk limbung |
| F | Eksekusi makhluk yang limbung; tubuhnya lebih mudah dibangkitkan (+15%) |
| H | Lempar tongkat ke titik bidik atau target lock-on; tekan lagi untuk memanggilnya, mengenai makhluk di jalur pulang |

| Sihir Chaos (tangan kiri) | |
| --- | --- |
| Tahan klik kanan | Bidik |
| Saat membidik: klik kiri | Hex Bolt; menjatuhkan Harpy dari udara |
| Saat membidik: tahan klik kiri | Telekinesis; lepas untuk melempar ke titik bidik |
| Q, E, X, V | Chaos Burst (Lv 3), Hex Snare (Lv 5), Hex Barrier (Lv 7), Reality Warp (Lv 10). Tanpa membidik, mengenai target lock-on atau titik di depan Ilyra |
| G | Crimson Overload saat meter Chaos penuh |

| Umbra (tangan kanan) | |
| --- | --- |
| Tahan R | Umbra Rite pada tubuh yang bersinar ungu (Lv 2); dua tubuh atau lebih dalam 12 m dibangkitkan sekaligus |
| T | Panggil atau kembalikan seluruh pasukan |
| Tahan Z | Roda perintah: gerakkan mouse ke Ikuti, Serang, Tahan, atau Tukar Tempat (Lv 4), lalu lepas Z. Perintah Fokus (Lv 6) membuat semua bayangan menyerang satu target |

## Dunia

Tiga zona pertama bisa dimainkan: Hutan Pembuka (Lv 1 sampai 3: Imp, Hellhound), Tebing Berangin di dataran tinggi (Lv 4 sampai 6: Harpy, Centaur), dan Rawa Berkabut (Lv 7 sampai 9: Naga rawa, Minotaur, serta sarang Medusa dan Chimera). Empat altar menyala saat Ilyra mendekat: memulihkan HP dan mana, menjadi titik bangkit, dan menghubungkan perjalanan cepat. Kamp yang ditaklukkan padam dan berdiri lagi dua menit kemudian bila Ilyra sudah jauh.

## Struktur

```
src/game/     logika murni: angka tuning (balance.ts), progresi, skill, simpanan (dari v1)
src/engine/   kamera (camera.ts), gerak (player.ts), rintangan (obstacles.ts), lock-on, input, game loop (game.ts)
              tempur: aturan parry dan stun (combat.ts), Ilyra (fight.ts), sihir (spells.ts), makhluk dan bayangan (units.ts)
              Umbra (umbra.ts), gambar makhluk per bagian dan kerumunan (rigs.ts), telegraf amber (telegraph.ts)
              model Ilyra dan animasinya (models.ts), efek dan suara dari v1 (fx.ts, audio.ts)
              proyektil makhluk: panah dan semburan (projectiles.ts)
src/world/    peta, zona, dan altar (map.ts, altars.ts), medan per chunk, hutan, kabut dan langit, kamp makhluk (camps.ts)
src/ui/       HUD, Ledger dan panel altar (ledger.ts)
tests/        Vitest: progresi v1, kamera, gerak, peta, tempur, AI makhluk, simpanan
previz/       skrip Blender, render, animatic, papan makhluk, PREVIZ.md
public/models model GLB hasil ekspor dari previz
```
