# Smart Logistics — Sunum Notlari

## Slayt 1: Baslik
- Smart Logistics — Gercek Zamanli Teslimat Rota Optimizasyonu
- Anadolu Hackathon 2026

## Slayt 2: Problem
- Mevcut planlama sabit hiz varsayiyor (otoyol=90, sehir ici=40 km/h)
- Gercek hizlar planlanandan %50 daha dusuk
- Sonuc: Sadece %14.6 zamaninda teslimat
- 1451 duraktan 1242'si (%85.6) zaman penceresini kacirmis

## Slayt 3: Cozum
- XGBoost ile durak bazinda gecikme tahmini (MAE: 3.08 dk)
- Otomatik durak yeniden siralama onerisi
- Dispatcher icin harita tabanli dashboard

## Slayt 4: Mimari
- Veri -> Feature Engineering (17 feature) -> XGBoost -> FastAPI -> React Dashboard
- SHAP ile aciklanabilir tahminler (juri icin kritik)

## Slayt 5: Demo
- Canli demo: RT-0001 rotasi
- Haritada riskli duraklar kirmizi
- Optimizasyon: 26.4 dk tasarruf, 3 pencere kurtarildi

## Slayt 6: Sonuclar
- Gecikme tahmini MAE: 3.08 dk, R2: 0.959
- Pencere kacirma tahmini: %94.5 dogruluk
- En onemli faktorler: tarihsel gecikme olasiligi, mesafe, yol tipi

## Slayt 7: Gelecek
- Gercek zamanli API entegrasyonu (trafik + hava durumu)
- Mobil uygulama (sofor icin)
- Coklu sehir destegi
- Reinforcement learning ile dinamik rota guncelleme
