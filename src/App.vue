<template>
  <div ref="LeafletMap" class="absolute z-0 top-0 left-0 w-screen h-screen" />
  <div class="absolute z-20 bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
    <Select v-model="viewStyle">
      <SelectTrigger class="dark:bg-primary dark:hover:bg-secondary data-[placeholder]:text-zinc-100 px-4">
        <SelectValue placeholder="Görüntüleme Türü" class="placeholder:text-zinc-100" as-child>
          <Pin v-if="viewStyle == 'pin'" />
          <Circle v-else />
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="pin">
            <Pin /> İşaretci
          </SelectItem>
          <SelectItem value="circle">
            <Circle /> Daire
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  </div>
</template>

<script lang="ts" setup>
import L from 'leaflet';
import { onMounted, ref, watchEffect } from 'vue';
import axios from 'axios';
import type Earthquake from 'types/Earthquake';
import { Circle, Pin } from 'lucide-vue-next';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { useColorMode } from '@vueuse/core';

const viewStyle = ref<"pin" | "circle">("circle");

const color = useColorMode();
color.value = 'dark';

const LeafletMap = ref<HTMLDivElement | null>(null);

onMounted(async () => {
  if (!LeafletMap.value) return;
  const map = L.map(LeafletMap.value).setView([39, 35.5], 6);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  const response = await axios<Earthquake[]>({
    baseURL: window.location.origin,
    url: '/api/get',
    params: {
      max: 500
    }
  })

  const circleLayer = new L.LayerGroup();
  const pinLayer = new L.LayerGroup();

  for (let last of response.data) {
    const popup =
      `<strong>${last.konum}</strong>
    <ul>
      <li>Enlem: <strong>${last.enlem}</strong></li>
      <li>Boylam: <strong>${last.boylam}</strong></li>
      <li>Büyüklük: <strong>${last.buyukluk}</strong></li>
      <li>Tür: <strong>${last.type.toUpperCase()}</strong></li>
      <li>Ölçüm Niteliği: <strong>${last.nitelik}</strong></li>
      <li>Saat: <strong>${last.saat}</strong></li>
      <li>Tarih: <strong>${new Date(last.tarih).toLocaleDateString()}</strong></li>
      <li>Derinlik: <strong>${last.derinlik_km} km</strong></li>

    </ul>`

    L.circle([+last.enlem, +last.boylam], {
      radius: last.buyukluk * 5000,
      color: "red",
      fillColor: '#f03',
      fillOpacity: 0.5,
    }).addTo(circleLayer)
      .bindPopup(popup)

    L.marker([+last.enlem, +last.boylam]).addTo(pinLayer).bindPopup(popup)
  }

  circleLayer.addTo(map);

  watchEffect(() => {
    if (viewStyle.value == 'circle') {
      map.removeLayer(pinLayer);
      circleLayer.addTo(map);
      return
    }
    map.removeLayer(circleLayer);
    pinLayer.addTo(map);
  })
})
</script>